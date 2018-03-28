import Joi from 'joi'
import moment from 'moment-timezone'
import fs from 'fs';
// import cloudant from '../../config/db.js'

// let db = cloudant.db.use('michcom_developing')

const tools = [{ // todos los clientes habilitados
  method: 'GET',
  path: '/api/tools/getServerTime',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        resolve(moment().tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'))
      })
    }
  }
},
{
  method: 'POST',
  path: '/api/tools/uploadImg',
  options: {
    handler: (request, h) => {
      let img = request.payload.img.replace(/^data:image\/jpeg;base64,/, "");
      let id = request.payload.id;

      return new Promise(resolve => {
        fs.writeFile(`img_logs/${id}.jpeg`, img, 'base64', function(err) {
          console.log(err);

          resolve({ok: 'Imagen subida correctamente'});
        });        
      });
    },
    validate: {
      payload: Joi.object().keys({
        id: Joi.string().required(),
        img: Joi.string().required()
      })
    }
  }
}
];

export default tools
