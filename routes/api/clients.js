import Joi from 'joi'
import cloudant from '../../config/db.js'

let db = cloudant.db.use('michcom')

const clients = [{ // todos los clientes habilitados
  method: 'GET',
  path: '/api/clients',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gte: null
            },
            type: 'client',
            status: 'enabled'
          }
        }, (err, result) => {
          if (err) throw err

          if (result.docs[0]) {
            resolve(result.docs)
          } else {
            resolve({err: 'No existen clientes habilitados'})
          }
        })
      })
    }
  }
},
{ // total de clientes sin deudas y pendientes
  method: 'GET',
  path: '/api/clients/countStatus',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gt: 0
            },
            status: 'enabled',
            type: 'client'
          },
          fields: [
            'amountOwed'
          ]
        }, (err, result) => {
          if (err) throw err

          if (result.docs[0]) {
            let countClients = result.docs.reduce((final, actual) => {
              if (actual.amountOwed === 0) {
                final.paid = (final.paid || 0) + 1
              } else {
                final.owed = (final.owed || 0) + 1
              }
              return final
            }, {})

            resolve(countClients)
          } else {
            resolve({
              error: 'without clients'
            })
          }
        })
      })
    }
  }
},
{ // traer un cliente
  method: 'POST',
  path: '/api/getClient',
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
              if (err) throw err;

              if (result.docs[0]) resolve(result.docs[0]);
          });
        });
      },
      validate: {
        payload: Joi.object().keys({
            rut: Joi.string()
        })
      }
  }
},
{ // agregar cliente al sistema
  method: 'POST',
  path: '/api/newClient',
  options: {
    handler: (request, h) => {
      let name = request.payload.name;
      let rut = request.payload.rut;
      let address = request.payload.address;
      let emails = JSON.parse(request.payload.emails);
      let newClientObj = {};
      
      return new Promise(resolve=>{
        db.find({ 
          "selector": {
              "_id": rut,
              "type": "client"
          },
          "limit":1
        }, (err, result) => {
          if (err) throw err;
  
          if(result.docs[0]) {
            resolve({error: 'el cliente de rut '+rut+' ya existe'});
          }else{
            newClientObj._id = rut;
            newClientObj.type = 'client';
            newClientObj.status = 'enabled';
            newClientObj.name = name;
            newClientObj.address = address;
            newClientObj.emails = emails;
            newClientObj.invoiceOwed = [];
            newClientObj.amountOwed = 0;
  
            db.insert(newClientObj, function(errUpdate, body) {
              if (errUpdate) throw errUpdate;
  
              resolve({ok: 'Cliente '+newClientObj.name+' agregado correctamente'}); 
            });
          }
        });
      }); 
    },
    validate: {
        payload: Joi.object().keys({
            name: Joi.string(),
            rut: Joi.string(),
            address: Joi.string().allow(''),
            emails: Joi.string().allow('')
        })
    }
  }
},
{ // todos los clientes deshabilitados
  method: 'GET',
  path: '/api/disabledClients',
  options: {
    handler: (request, h) => {
      return new Promise(resolve=>{
        db.find({
          "selector": {
              "_id": {
                  "$gte": null
              },
              "type": "client",
              "status": "disabled"
          },
          "fields": [
          ]
        }, function(err, result) {
          if (err) throw err;
          
          if (result.docs[0]) {
            resolve(result.docs);
          } else {
            resolve({err: 'no existen clientes deshabilitados'});
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
      let rut = request.payload.rut

      return new Promise(resolve => {
        db.find({
          selector: {
            _id: rut,
            type: 'client'
          },
          limit: 1
        }, (err, result) => {
          if (err) throw err

          let clientData = result.docs[0]
          clientData.rut = clientData._id
          delete clientData._id

          db.find({
            selector: {
              _id: {
                $gt: 0
              },
              $not: {
                status: 'disabled'
              },
              type: 'invoice',
              client: rut
            },
            fields: [
              '_id',
              'invoice',
              'business',
              'amount',
              'status',
              'invoice_type',
              'description',
              'date',
              'iva',
              'reason'
            ],
            sort: [{
              _id: 'desc'
            }]
          }, (err2, result2) => {
            if (err) throw err

            clientData.invoices = result2.docs
            resolve(clientData)
          })
        })
      })
    },
    validate: {
      payload: Joi.object().keys({
        rut: Joi.string()
      })
    }
  }
},
{ // modificar cliente en el sistema
  method: 'POST',
  path: '/api/modClient',
  options: {
    handler: (request, h) => {
      let name = request.payload.name;
      let rut = request.payload.rut;
      let address = request.payload.address;
      let emails = JSON.parse(request.payload.emails);
      let modClientObj = {};

      return new Promise(resolve=>{
        db.find({ 
          "selector": {
              "_id": rut,
              "type": "client"
          },
          "limit":1
      }, function(err, result) {
          if (err) throw err;

          if(result.docs[0]) {
            modClientObj = result.docs[0];
            modClientObj.name = name;
            modClientObj.address = address;
            modClientObj.emails = emails;

            db.insert(modClientObj, function(errUpdate, body) {
              if (errUpdate) throw errUpdate;
            
              resolve({ok: 'Cliente '+modClientObj.name+' modificado correctamente'}); 
            });      
          }else{
            resolve({error: 'el cliente de rut '+rut+' no existe'});
          }
        }); 
      });
    },
    validate: {
        payload: Joi.object().keys({
            name: Joi.string(),
            rut: Joi.string(),
            address: Joi.string().allow(''),
            emails: Joi.string().allow('')
        })
    }
  }
},
{ // habilitar un cliente
  method: 'POST',
  path: '/api/enableClient',
  options: {
      handler: (request, h) => {
        let rut = request.payload.rut;
        let clientData = {};

        return new Promise(resolve=>{
          db.find({ 
            "selector": {
                "_id": rut,
                "type": "client"
            },
            "limit":1
          }, function(err, result) {
            if (err) throw err;

            clientData = result.docs[0];

            clientData.status = 'enabled';

            db.insert(clientData, function(errUpdate, body) {
                if (errUpdate) throw errUpdate;

                resolve({ok: 'Cliente '+clientData.name+' habilitado correctamente'}); 
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
}, { // deshabilitar un cliente
  method: 'DELETE',
  path: '/api/disableClient',
  options: {
      handler: (request, h) => {
          let rut = request.payload.rut;
          let clientData = {};

          return new Promise(resolve=>{
            db.find({ 
              "selector": {
                  "_id": rut,
                  "type": "client"
              },
              "limit":1
          }, function(err, result) {
              if (err) throw err;

              clientData = result.docs[0];

              clientData.status = 'disabled';

              db.insert(clientData, function(errUpdate, body) {
                  if (errUpdate) throw errUpdate;

                  resolve({ok: 'Cliente '+clientData.name+' deshabilitado correctamente'}); 
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
