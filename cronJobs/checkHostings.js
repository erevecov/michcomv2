import cloudant from '../config/db.js';
import cron from 'node-cron';
import moment from 'moment-timezone';
import configEnv from '../config/env_status.js';

let db = cloudant.db.use(configEnv.db);

const main = async () => {
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
            console.log(result.docs);
        } else {
            console.log({error: 'No existen clientes con paquetes de hosting'});
        }
    })
}

const test = async () => {
    let time = moment.tz('America/Santiago').format('DD')

    console.log(time)
    
}


/*
field	value
second	0-59
minute	0-59
hour	0-23
day of month	1-31
month	1-12 (or names)
day of week	0-7 (or names, 0 or 7 are sunday)
*/

let dailyCron = cron.schedule('0 0 9 * * *', function(){ // una vez al día a las 9 AM
    test()
});



export default dailyCron