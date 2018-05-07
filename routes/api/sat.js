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
                        resolve(result.docs);
                    } else {
                        resolve({ err: 'no existen reparaciones' });
                    }
                });
            });
        }
    }
}, 
//xxxxxxxxxxxxxxxxxxxxxx
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
               // _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                _id: phone,
                type: 'satClient',
                status: 'enabled',
                name: name,
                address: address,
                //phone: phone,
                email: email
            }
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: phone,
                        type: 'satClient'
                    }
                }, (err, result) => {
                    if (err) throw err

                    if (result.docs[0]) {
                        resolve({ err: 'El usuario ' + result.docs[0].name + ' de número celular ' + result.docs[0]._id + ' ya existe' })
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
