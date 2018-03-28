import Joi from 'joi'
import cloudant from '../../config/db.js'
import moment from 'moment-timezone'
import configEnv from '../../config/env_status.js';

let db = cloudant.db.use(configEnv.db_logs)

const Monitoring = [{ // crear un log
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
      let type = request.payload.type;
      let img;
      if(type == 'createInvoice') img = true;

      return new Promise(resolve => {
        let logData = {
          _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
          userEmail: credentials.email,
          userName: credentials.name + ' ' + credentials.lastname,
          role: credentials.role,
          form: form,
          description: description,
          img: img
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
        extra: Joi.string().allow(''),
        type: Joi.string().allow('')
      })
    }
  }
}];

export default Monitoring;
