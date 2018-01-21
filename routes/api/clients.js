import Joi from 'joi';
import cloudant from '../../config/db.js';

let db = cloudant.db.use("michcom_developing");

const clients = [{ // todos los clientes habilitados
    method: 'GET',
    path: '/api/clients',
    options: {
        handler: (request, h) => {
            return new Promise(resolve =>{
                db.find({
                    "selector": {
                        "_id": {
                            "$gte": null
                        },
                        "type": "client",
                        "status": "enabled"
                    }
                }, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (result.docs[0]) {
                        resolve(result.docs);
                    } else {
                        resolve('No existen clientes habilitados');
                    }
                });
            }); 
        }
    }
},{ // total de clientes sin deudas y pendientes
    method: 'GET',
    path: '/api/clients/countStatus',
    options: {
        handler: (request, h) => {
            return new Promise(resolve =>{
                db.find({
                    "selector": {
                        "_id": {
                            "$gt": 0
                        },
                        "status": "enabled",
                        "type": "client"
                    },
                    "fields": [
                        "amountOwed"
                    ]
                }, (err, result) => { 
                    if (err) {
                        throw err;
                    }
    
                    if(result.docs[0]) {

                        let countClients = result.docs.reduce((final, actual)=>{
                            if(actual.amountOwed == 0) {
                                final.paid = (final.paid || 0) + 1;
                            } else {
                                final.owed = (final.owed || 0) + 1;
                            }
                            return final;
                        }, {});
                        
                        resolve(countClients);
                    } else {
                        resolve({error: 'without clients'});
                    }
                });
            }); 
        }
    }
},
{ // obtener un cliente junto a todas sus facturas
    method: 'POST',
    path: '/api/client',
    options: {
        handler: (request, h) => {
            let rut = request.payload.rut;
            return new Promise(resolve=>{
                db.find({ 
                    "selector": {
                        "_id": rut,
                        "type": "client"
                    },
                    "limit":1
                }, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    let clientData = result.docs[0];
                    clientData.rut = clientData._id;
                    delete clientData._id;

                    db.find({ 
                        "selector": {
                            "_id": {
                                "$gt": 0
                            },
                            "$not": {
                              "status": "disabled"
                            },
                            "type": "invoice",
                            "client": rut
                        },
                        "fields": [
                            "_id",
                            "invoice",
                            "business",
                            "amount",
                            "status",
                            "invoice_type",
                            "description",
                            "date",
                            "iva"
                        ],
                        "sort": [
                            {
                                "_id": "desc"
                            }
                        ]
                    }, (err2, result2) => {
                        if (err) throw err;

                        clientData.invoices = result2.docs;
                        resolve(clientData);
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
}
];
export default clients;