import Joi from 'joi';
import cloudant from '../../config/db.js';
import moment from 'moment-timezone'
import configEnv from '../../config/env_status.js';

let db = cloudant.db.use(configEnv.db)

const sat = [{ // todos los clientes habilitados
    method: 'GET',
    path: '/api/satClients',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: {
                            $gte: null
                        },
                        type: 'satClient',
                        status: 'enabled'
                    }
                }, (err, result) => {
                    if (err) throw err

                    if (result.docs[0]) {
                        resolve(result.docs)
                    } else {
                        resolve({ err: 'No existen clientes habilitados' })
                    }
                })
            })
        }
    }
},
    //api traer Clientes 
{
    method: 'GET',
    path: '/api/satClient',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    'selector': {
                        '_id': {
                            '$gte': null
                        },
                        'type': 'satClient',
                    }
                }, (err, result) => {
                    if (err) throw err;

                    if (result.docs[0]) {
                        let res = result.docs.reduce((arr, el, i) => {
                            return arr.concat({
                                _id: el._id,
                                status: el.status,
                                name: el.name,
                                phone: el.phone,
                                address: el.address,
                                email: el.email
                            })
                        }, [])

                        resolve(res);
                    } else {
                        resolve({ err: 'no existen Clientes' });
                    }
                });
            });
        }
    }
}, 
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

//api traer reparaciones
{ 
    method: 'GET',
    path: '/api/satRepairs', 
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    'selector': {
                        '_id': {
                            '$gte': null
                        },
                        'type': 'satRepair',
                    }
                }, (err, result) => {
                    if (err) throw err;

                    if (result.docs[0]) {
                        let res = result.docs.reduce((arr, el, i)=>{
                            return arr.concat({
                                _id: el._id,
                                date: moment(el._id).format('DD/MM/YYYY hh:mm'),
                                status: el.status,
                                technical: el.technical,
                                client: el.client,
                                equipment: `${el.equipment} ${el.brand} ${el.model}`,
                                equipment1: el.equipment,
                                accesory: el.accesory,
                                fail: el.fail,
                                equip: el.equipment,
                                brand: el.brand,
                                model: el.model
                            })
                        }, []) 

                        resolve(res);
                    } else {
                        resolve({ err: 'no existen reparaciones' });
                    }
                });
            });
        }
    }
}, 
//xxxxxxxxxxxxxxxxxxxxxx

//MODIFICAR CLIENTES
{ // modificar cliente en el sistema
    method: 'POST',
    path: '/api/modSatClient',
    options: {
        handler: (request, h) => {
            let id = request.payload.id;
            let name = request.payload.name;
            let phone = request.payload.phone;
            let address = request.payload.address;
            let email = request.payload.email;
            let modSatClientObj = {};

            return new Promise(resolve => {
                db.find({
                    "selector": {
                        "_id": id,
                        "type": "satClient",
                        "status": "enabled"
                    },
                    "limit": 1
                }, function (err, result) {
                    if (err) throw err;

                    if (result.docs[0]) {
                        modSatClientObj = result.docs[0];
                        modSatClientObj.name = name;
                        modSatClientObj.address = address;
                        modSatClientObj.email = email;
                        modSatClientObj.phone = phone;

                        db.insert(modSatClientObj, function (errUpdate, body) {
                            if (errUpdate) throw errUpdate;

                            resolve({ ok: 'Cliente ' + modSatClientObj.name + ' modificado correctamente' });
                        });
                    } else {
                        resolve({ error: 'el cliente de número ' + phone + ' no existe' });
                    }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                id: Joi.string(),
                name: Joi.string(),
                phone: Joi.string(),
                address: Joi.string().allow(''),
                email: Joi.string().allow('')
            })
        }
    }
},
//XXXXXXXXXXXXXXXXXX
//MODIFICAR REPARACIONES AUN NO SIRVE
{ 
    method: 'POST',
    path: '/api/modSatRepair',
    options: {
        handler: (request, h) => {
            let id = request.payload.id_var;
            let technical = request.payload.technicalName;
            let client = request.payload.clientName;
            let equipment = request.payload.equipmentName;
            let brand = request.payload.brandName;
            let model = request.payload.modelName;
            let accesory = request.payload.accesoryName;
            let fail = request.payload.failName;
            

            let modSatRepairtObj = {};

            return new Promise(resolve => {
                db.find({
                    "selector": {
                        "_id": id_var,
                        "type": "satRepair",
                    },
                    "limit": 1
                }, function (err, result) {
                    if (err) throw err;

                    if (result.docs[0]) {
                        modSatRepairtObj = result.docs[0];
                        modSatRepairtObj.technical = technical;
                        modSatRepairtObj.client =client;
                        modSatRepairtObj.equipment = equipment;
                        modSatRepairtObj.brand = brand;
                        modSatRepairtObj.model = model;
                        modSatRepairtObj.accesory = accesory;
                        modSatRepairtObj.fail = fail;
                       
                        db.insert(modSatClientObj, function (errUpdate, body) {
                            if (errUpdate) throw errUpdate;

                            resolve({ ok: 'Técnico ' + modSatRepairObj.technical + ' modificado correctamente' });
                        });
                    } else {
                        resolve({ error: 'el cliente de número ' + _id + ' no existe' });
                    }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                id_var: Joi.string(),
                technicalName:Joi.string(),
                clientName:Joi.string(),
                equipmentName:Joi.string(),
                brandName:Joi.string(),
                modelName:Joi.string(),
                accesoryName:Joi.string(),
                failName:Joi.string(),

            })
        }
    }
},
//XXXXXXXXXXXXXXXXXX

{ // todos los clientes habilitados
    method: 'GET',
    path: '/api/satEquipment',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: "satEquipment"
                    }
                }, (err, result) => {
                    if (err) throw err

                    if (result.docs[0]) {
                        resolve(result.docs[0])
                    }
                })
            })
        }
    }
},
{ // Agregar una nueva reparación
    method: 'POST',
    path: '/api/newRepairSat',
    options: {
        handler: (request, h) => {
            let technical = request.payload.technical;
            let client = request.payload.client;
            let equipment = request.payload.equipment;
            let brand = request.payload.brand;
            let model = request.payload.model;
            let accesory = request.payload.accesory;
            let fail = request.payload.fail;

            let repairObject = {
                _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                type: 'satRepair',
                status: 'working',
                technical:technical,
                client:client,
                equipment: equipment,
                brand:brand,
                model:model,
                accesory:accesory,
                fail:fail
            }
            return new Promise(resolve => {
                db.insert(repairObject, function (errUpdate, body) {
                    if (errUpdate) throw errUpdate;
                    resolve({ ok: 'El equipo ' + repairObject.brand +' '+repairObject.model + ' agregado correctamente' });
                });
            })
        },
        validate: {
            payload: Joi.object().keys({
                technical: Joi.string(),
                client: Joi.string(),
                equipment: Joi.string(),
                brand: Joi.string(),
                model: Joi.string(),
                accesory: Joi.string(),
                fail: Joi.string()
            })
        }
    }
},
{ // agregar cliente al sistema
    method: 'POST',
    path: '/api/newClientSat',
    options: {
        handler: (request, h) => {
            let name = request.payload.name;
            let address = request.payload.address;
            let phone = request.payload.phone;
            let email = request.payload.email;
            let clientObject = {
                _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                type: 'satClient',
                status: 'enabled',
                name: name,
                address: address,
                phone: phone,
                email: email
            }
            return new Promise(resolve => {
                db.find({
                    selector: {
                        phone: phone,
                        name: name,
                        type: 'satClient'
                    }
                }, (err, result) => {
                    if (err) throw err

                    if (result.docs[0]) {
                        resolve({ err: 'El usuario ' + result.docs[0].name + ' de número celular ' + result.docs[0].phone + ' ya existe' })
                    } else {
                        db.insert(clientObject, function (errUpdate, body) {
                            if (errUpdate) throw errUpdate;
                            resolve({ ok: 'Cliente ' + clientObject.name + ' agregado correctamente' });
                        });
                    }
                })

               
            })         
        },
        validate: {
            payload: Joi.object().keys({
                name: Joi.string(),
                phone: Joi.string(),
                email: Joi.string().allow(''),
                address: Joi.string().allow('')
            })
        }
    }
},
{

 // agregar Tipo de equipo
    method: 'POST',
    path: '/api/newEquipmentSat',
    options: {
        handler: (request, h) => {
            let nameEquipment = request.payload.name;
            console.log(nameEquipment)
            return new Promise(resolve => {
                db.find({
                        selector: {
                        _id: "satEquipment"
                    }
                }, (err, result) => {
                    if (err) throw err

                    if (result.docs[0]) {
                       /* db.insert(clientObject, function (errUpdate, body) {
                          if (errUpdate) throw errUpdate;
                            resolve({ ok: 'Cliente ' + clientObject.name + ' agregado correctamente' });
                        });*/
                        let res = result.docs[0];
                        let equipmentSelected = res.types.filter(function (el) {
                            return el.type == nameEquipment
                        })
                        if (equipmentSelected.length == 0){
                            res.types.push(nameEquipment)
                            resolve(res.types)

                        }else {
                            resolve({ err: 'El equipo ingresado ya existe'})
                        }
                    } else {
                        resolve({ err: 'No se han encontrado tipos de equipo en el sistema' })
                    }
                })
            })         
        },
        validate: {
            payload: Joi.object().keys({
                name: Joi.string(),
            })
        }
    }
},
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

/*
 { // agregar equipo al sistema
        method: 'POST',
        path: '/api/newEquipmentSat',
        options: {
            handler: (request, h) => {
                let equipment = request.payload.equipment;

                let equipmentObject = {
                    _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                    type: 'satEquipment',
                    status: 'enabled',
                    equipment: equipment
                }
                return new Promise(resolve => {
                    db.insert(equipmentObject, function (errUpdate, body) {
                        if (errUpdate) throw errUpdate;

                        resolve({ ok: 'Equipo ' + equipmentObject.equipment + ' agregado correctamente' });
                    });
                })
            },
            validate: {
                payload: Joi.object().keys({
                    equipment: Joi.string()
                })
            }
        }
    },
{ // deshabilitar un cliente
    method: 'DELETE',
    path: '/api/disableClient',
    options: {
        handler: (request, h) => {
            let rut = request.payload.rut;
            let clientData = {};

            return new Promise(resolve => {
                db.find({
                    "selector": {
                        "_id": rut,
                        "type": "client"
                    },
                    "limit": 1
                }, function (err, result) {
                    if (err) throw err;

                    clientData = result.docs[0];

                    clientData.status = 'disabled';

                    db.insert(clientData, function (errUpdate, body) {
                        if (errUpdate) throw errUpdate;

                        resolve({ ok: 'Cliente ' + clientData.name + ' deshabilitado correctamente' });
                    });
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string()
            })
        }
    }
}*/

];

export default sat;
