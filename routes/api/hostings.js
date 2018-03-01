import Joi from 'joi';
import cloudant from '../../config/db.js';
import configEnv from '../../config/env_status.js';

let db = cloudant.db.use(configEnv.db)

const clients = [{ // todos los clientes habilitados con hosting plan de hosting asignado
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
            $not: {
                hosting: null
            },
            type: 'client',
            status: 'enabled'
          }
        }, (err, result) => {
          if (err) throw err
            console.log(result)
            if (result.docs[0]) {
                resolve(result.docs)
            } else {
                resolve({error: 'No existen clientes con paquetes de hosting'});
            }
        });
      });
    }
  }
}
];

export default clients;
