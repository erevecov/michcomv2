import Joi from 'joi'
import cloudant from '../../config/db.js'
import moment from 'moment-timezone'
import configEnv from '../../config/env_status.js';

let db = cloudant.db.use(configEnv.db_logs)

const Logs = [{ // ver todos
  method: 'GET',
  path: '/api/logs',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        db.find({
          'selector': {
            '_id': {
              '$gte': null
            }
          },
          'fields': [
            '_id',
            'userName',
            'userEmail',
            'role',
            'form',
            'description'
          ],
          'sort': [{
            '_id': 'desc'
          }]
        }, (err, result) => {
          if (err) throw err
          
          if (result.docs[0]) {
            resolve(result.docs)
          } else {
            resolve({
              error: 'NO EXISTEN LOGS EN EL SISTEMA'
            })
          }
        })
      })
    }
  }
}, { // crear un log
  method: 'POST',
  path: '/api/log',
  options: {
    handler: (request, h) => {
      let session = request.auth.credentials;
      

      let credentials = {
        email: session.email,
        name: session.name,
        lastname: session.lastname,
        role: session.role
      };

      let description = request.payload.description;
      let form = request.payload.form;
      let extra = request.payload.extra; // puede ser cualquier string (para los formularios de factura el dato extra es el numero de la factura)

      return new Promise(resolve => {
        let logData = {
          _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
          userEmail: credentials.email,
          userName: credentials.name + ' ' + credentials.lastname,
          role: credentials.role,
          form: form,
          description: description
        };

        if(extra) logData.extra = extra;

        db.insert(logData, (errUpdate, body) => {
          if (errUpdate) throw errUpdate;

          resolve(body);
        });
      });
    },
    validate: {
      payload: Joi.object().keys({
        description: Joi.string(),
        form: Joi.string(),
        extra: Joi.string().allow('')
      })
    }
  }
}, { // ver logs personalizados
  method: 'POST',
  path: '/api/getLogs',
  options: {
    handler: (request, h) => {
      let user = request.payload.user
      let startDate = request.payload.startDate
      let endDate = request.payload.endDate

      return new Promise(resolve => {
        let query = {
          selector: {
            _id: {
              $gte: null
            }
          },
          fields: [],
          sort: [{
            _id: 'desc'
          }]
        }

        if (user) {
          query.selector.userEmail = user
        }

        if (startDate && endDate) {
          query.selector._id.$gte = startDate
          query.selector._id.$lte = endDate
        }

        db.find(query, (err, result) => {
          if (err) throw err

          resolve(result.docs)
        })
      })
    },
    validate: {
      payload: Joi.object().keys({
        user: Joi.string().allow(''),
        startDate: Joi.string().allow(''),
        endDate: Joi.string().allow('')
      })
    }
  }
}, 
{ // ver historial (logs) de una factura
  method: 'POST',
  path: '/api/invoiceHistory',
  options: {
    handler: (request, h) => {
      let invoice = request.payload.invoice;
      return new Promise(resolve => {
        let query = {
          selector: {
            _id: {
              $gte: null
            },
            extra: String(invoice)
          },
          sort: [{
            _id: 'desc'
          }]
        };

        db.find(query, (err, result) => {
          if (err) throw err;

          if(result.docs[0]) {
            resolve(result.docs);
          } else {
            resolve({err: 'no se encuentran registros de la factura <b>'+invoice+'</b>'});
          }
        });
      });
    },
    validate: {
      payload: Joi.object().keys({
        invoice: Joi.string().allow('')
      })
    }
  }
}]

export default Logs;
