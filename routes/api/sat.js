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
//MODIFICAR REPARACIONES
{ 
    method: 'POST',
    path: '/api/modSatRepair',
    options: {
        handler: (request, h) => {
            let id = request.payload.id;
            let technicalName = request.payload.technical;
            let clientName = request.payload.client;
            let equipmentName = request.payload.equipment;
            let brandName = request.payload.brand;
            let modelName = request.payload.model;
            let accesoryName = request.payload.accesory;
            let failName = request.payload.fail;
            

            let modSatRepairtObj = {};

            return new Promise(resolve => {
                db.find({
                    "selector": {
                        "_id": id,
                        "type": "satRepair",
                    },
                    "limit": 1
                }, function (err, result) {
                    if (err) throw err;

                    if (result.docs[0]) {
                        modSatRepairtObj = result.docs[0];
                        modSatRepairtObj.technicalName = technical;
                        modSatRepairtObj.clientName =client;
                        modSatRepairtObj.equipmentName = equipment;
                        modSatRepairtObj.brandName = brand;
                        modSatRepairtObj.modelName = model;
                        modSatRepairtObj.accesoryName = accesory;
                        modSatRepairtObj.failName = fail;
                       
                        db.insert(modSatClientObj, function (errUpdate, body) {
                            if (errUpdate) throw errUpdate;

                            resolve({ ok: 'Técnico ' + modSatRepairObj.technicalName + ' modificado correctamente' });
                        });
                    } else {
                        resolve({ error: 'el cliente de número ' + _id + ' no existe' });
                    }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                id: Joi.string(),
                technical:Joi.string(),
                client:Joi.string(),
                equipment:Joi.string(),
                brand:Joi.string(),
                model:Joi.string(),
                moaccesory:Joi.string(),
                fail:Joi.string(),

            })
        }
    }
},
//XXXXXXXXXXXXXXXXXX
//MODIFICAR CLIENTES
{ // modificar cliente en el sistema
    method: 'POST',
    path: '/api/modSatClientEdit',
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
