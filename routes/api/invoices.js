import Joi from 'joi';
import cloudant from '../../config/db.js';
import moment from 'moment-timezone';

let db = cloudant.db.use("michcom_developing");

const invoices = [{ // Crear una factura
    method: 'POST',
    path: '/api/invoice',
    options: {
        handler: (request, h) => {
            let rut = request.payload.rut;
            let invoice = request.payload.invoice;
            let business = request.payload.business;
            let amount = request.payload.amount;
            let invoice_type = request.payload.invoice_type;
            let description = request.payload.description;
            let date = request.payload.date;
            let iva = request.payload.iva;

            let filter1 = rut.split('.').join('');
            let filter2 = filter1.replace('-', ''); // limpiar rut

            return new Promise(resolve =>{
                db.find({
                    "selector": {
                        "_id": {
                            "$gt": 0
                        },
                        "$not": {
                          "status": "disabled"
                        },
                        "type": "invoice",
                        "invoice": invoice,
                        "business": business
                    },
                    "fields": [
                        "_id"
                    ],
                    "limit":1
                }, (err, result) => {
                    if (err) {
                        throw err;
                    }
                    
                    if (result.docs[0]) {
                        resolve({error: 'LA FACTURA <b>'+invoice+'<b> YA EXISTE EN '+business.toUpperCase()});
                    }else {
                         let newInvoice = {
                            '_id': moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
                            'type':"invoice",
                            'invoice': invoice,
                            'date': date,
                            'client' : filter2,
                            'business': business,
                            'amount': amount,
                            'status': 'PENDIENTE',
                            "invoice_type": invoice_type,
                            "description": description,
                            "iva": iva
                        };
    
                        db.insert(newInvoice, (err, body) => {
                            if(err) {
                                throw err;
                            }
    
                            if(body.ok) {
                                db.find({ 
                                    "selector": {
                                        "_id": filter2, // rut
                                        "type": "client"
                                    },
                                    "limit":1
                                }, (err, result) => {
                                    if (err) {
                                        throw err;
                                    }
                                    
                                    let client = result.docs[0]; // asignamos el objeto cliente a variable client
                                    client.invoiceOwed.push(invoice); // Agregamos la nueva factura al ARRAY de facturas del cliente 
                                    client.amountOwed += amount; // Agregamos el costo de la nueva factura al costo total de todas las facturas adeudadas del cliente
                          
                                    db.insert(client, function(err2, body2) {
                                        if (err2) {
                                            throw err2;
                                        }
    
                                        resolve({ok: 'FACTURA <b>'+invoice+'</b> CREADA CORRECTAMENTE', id: body.id});
                                    });
    
                                });
                                
                            }  
                        });
                    }
    
                                 
                }); 
            });
        },
        validate: {
            payload: Joi.object().keys({
                invoice: Joi.number(),
                amount: Joi.number(),
                id: Joi.string(),
                rut: Joi.string(),
                business: Joi.string(),
                invoice_type: Joi.string(),
                description: Joi.string(),
                date: Joi.string(),
                iva: Joi.string()
            })
        }
    }
},
{ // obtener deudas de los clientes 
    method: 'GET',
    path: '/api/invoiceAmount',
    options: {
        handler: (request, h) => {
            return new Promise(resolve=>{
                db.find({
                    "selector": {
                      "_id": {
                        "$gt": 0
                      },
                      "$not": {
                        "status": "disabled"
                      },
                      "type": "invoice"
                    },
                    "fields": [
                      "amount",
                      "status",
                      "invoice_type"
                    ]
                }, (err, result) => { 
                    if (err) {
                        throw err;
                    }
    
                    if(result.docs[0]) {
                        let owed = result.docs.reduce((final, actual)=>{
                            if(actual.invoice_type === 'service' && actual.status === 'PENDIENTE') {
                                final.tronit = (final.tronit || 0) + actual.amount;
                            } else if (actual.invoice_type === 'product' && actual.status === 'PENDIENTE') {
                                final.michcom = (final.michcom || 0) + actual.amount;
                            }
        
                            if (actual.status === 'PENDIENTE') {
                                final.totalAmount = (final.totalAmount || 0) + actual.amount;
                            }
        
                            return final;
        
                        }, {});
    
                        resolve(owed);
                    } else {
                        resolve({error: 'without invoices'});
                    }
                });
            });
        }
    }
},
{
    method: 'POST',
    path: '/api/invoices/owed',
    options: {
        handler: (request, h) => {
            let rut = request.payload.rut;

            return new Promise(resolve => {
                db.find({
                    "selector": {
                      "_id": {
                        "$gt": 0
                      },
                      "client": rut,
                      "status": "PENDIENTE", 
                      "type": "invoice"
                    }
                }, (err, result) => { 
                    if (err) {
                        throw err;
                    }
                    if(result.docs[0]) {
                        let res = result.docs.map((el, index) => {
                            return {
                                date: el._id,
                                invoice: el.invoice,
                                business: el.business,
                                amount: el.amount,
                                type: el.invoice_type,
                                description: el.description,
                                iva: el.iva
                            };
                        });
                        resolve(res);
                    } else {
                        resolve({error: 'without owed invoices'});
                    }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                rut: Joi.string().required()
            })
        }
    }
},
{ // Cambiar es status de una factura a disabled
    method: 'POST',
    path: '/api/deleteInvoice',
    options: {
        handler: (request, h) => {
            let invoice = request.payload.invoice;
            let business = request.payload.business;

            let beforeStatus = '';
            return new Promise(resolve=>{
                db.find({ 
                    "selector": {
                        "_id": {
                            "$gt": 0
                        },
                        "type": "invoice",
                        "invoice": invoice,
                        "business": business
                    },
                    "limit":1,
                    "sort": [
                        {
                            "_id": "desc" // debe encontrar la factura con la fecha mas alta
                        }
                    ]
                }, (err, result) => {
                    if (err) throw err;
                    console.log(result)
                    let getInvoice = result.docs[0];
                    beforeStatus = getInvoice.status;
    
                    getInvoice.status = 'disabled';
    
                    db.insert(getInvoice, (err2, body) => {
                        if (err2) throw err2;
    
                        if(beforeStatus === 'PENDIENTE') {
                            db.find({ 
                            "selector": {
                                "_id": getInvoice.client,
                                "type": "client"
                            },
                            "limit":1
                            }, (err3, result2) => {
                                if (err3) {
                                    throw err3;
                                }
    
                                let client = result2.docs[0];
    
                                let indexOf = client.invoiceOwed.indexOf(invoice);
    
                                if (indexOf > -1) {
                                    client.invoiceOwed.splice(indexOf, 1);
                                    client.amountOwed = client.amountOwed - getInvoice.amount; 
    
                                    db.insert(client, (err4, body2) => {
                                        if (err4) {
                                            throw err4;
                                        }
    
                                        resolve({ok: 'factura de numero '+invoice+' eliminada correctamente', beforeStatus: beforeStatus});
                                    });  
                                } 
                            }); 
                        }   else if (beforeStatus === 'PAGADO') {
                            resolve({ok: 'factura de numero '+invoice+' eliminada correctamente', beforeStatus: beforeStatus});
                        }
                    });
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                invoice: Joi.number(),
                business: Joi.string()
            })
        }
    }
}];

export default invoices;
