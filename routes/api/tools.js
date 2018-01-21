import Joi from 'joi';
import moment from 'moment-timezone';
import cloudant from '../../config/db.js';

let db = cloudant.db.use("michcom_developing");

const tools = [{ // todos los clientes habilitados
    method: 'GET',
    path: '/api/tools/getServerTime',
    options: {
        handler: (request, h) => {
            return new Promise(resolve =>{
                resolve(moment().tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'));
            }); 
        }
    }
}
];
export default tools;