import Joi from 'joi';
import cloudant from '../../config/db.js';
import configEnv from '../../config/env_status.js';
import moment from 'moment-timezone';

let db = cloudant.db.use(configEnv.db)

const clients = [
{ // todos los clientes habilitados con hosting plan de hosting asignado
    method: 'GET',
    path: '/api/hosting/clients',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: {
                            $gte: null
                        },
                        hosting: {
                            $exists: true
                        },
                        type: 'client',
                        status: 'enabled'
                    }
                }, (err, result) => {
                if (err) throw err;

                    if (result.docs[0]) {
                        resolve(result.docs);
                    } else {
                        resolve({error: 'No existen clientes con paquetes de hosting'});
                    }
                });
            });
        }
    }
},
{ // todos los clientes habilitados que no tengan un hosting asignado
    method: 'GET',
    path: '/api/hosting/without',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: {
                            $gte: null
                        },
                        hosting: {
                            $exists: false
                        },
                        type: 'client',
                        status: 'enabled'
                    }
                }, (err, result) => {
                    if (err) throw err;
                    if (result.docs[0]) {
                        resolve(result.docs);
                    } else {
                        resolve({error: 'No existen clientes sin paquetes de hosting'});
                    }
                });
            });
        }
    }
},
{ // todos los paquetes de hosting
    method: 'GET',
    path: '/api/hosting/packages',
    options: {
        handler: (request, h) => {
            return new Promise(resolve => {
                db.find({
                    selector: {
                        _id: "packages"
                    }
                }, (err, result) => {
                    if (err) throw err;
                    if (result.docs[0]) {
                        resolve(result.docs[0].packages);
                    } else {
                        resolve({error: 'no se encuentra el documento "paquetes".'});
                    }
                });
            });
        }
    }
},
{ // agregar paquete de hosting a un cliente
    method: 'POST',
    path: '/api/hosting/add',
    options: {
      handler: (request, h) => {
        let client = request.payload.client;
        let hostingPackage = request.payload.package;
        let freq = request.payload.freq;
        let init = request.payload.init;
        let amount = request.payload.amount;
        let freeText = request.payload.freeText;
        let reportDay = moment(init).subtract(5, 'days').format('MM-DD');

        return new Promise(resolve => {
          db.find({
            selector: {
              _id: client
            },
            limit: 1
          }, (err, result) => {
              if (err) throw err;
              
              if(result.docs[0]) {
                
                result.docs[0].hosting = {
                  package: hostingPackage,
                  freq: freq,
                  amount: parseInt(amount),
                  init_day: init,
                  free_text: freeText,
                  report_day: reportDay
                };
  
                db.insert(result.docs[0], (err2, body) => {
                    if (err2) throw err2;
        
                    if(body.ok) {
                        resolve({
                            ok: 'paquete de hosting '+ hostingPackage +' asignado correctamente al cliente '+result.docs[0].name,
                            client: {
                                rut: client,
                                name: result.docs[0].name
                            }
                        });
                    }
                });
                
              }
          });
        });
      },
      validate: {
        payload: Joi.object().keys({
          client: Joi.string(),
          package: Joi.string(),
          freq: Joi.string(),
          init: Joi.string(),
          amount: Joi.number(),
          freeText: Joi.string().allow('')
        })
      }
    }
},
{ // eliminar paquete de hosting de un cliente
  method: 'DELETE',
  path: '/api/hosting/delete',
  options: {
    handler: (request, h) => {
      let client = request.payload.client;

      return new Promise(resolve => {
        db.find({
          selector: {
            _id: client
          },
          limit: 1
        }, (err, result) => {
            if (err) throw err;
            
            if(result.docs[0]) {
                delete result.docs[0].hosting;

                db.insert(result.docs[0], (err2, body) => {
                    if (err2) throw err2;
        
                    if(body.ok) resolve({ok: 'paquete de hosting eliminado correctamente del cliente '+result.docs[0].name});
                });
            }
        });
      });
    },
    validate: {
      payload: Joi.object().keys({
        client: Joi.string()
      })
    }
  }
}
];




export default clients;
