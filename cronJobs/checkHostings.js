import cloudant from '../config/db.js';
import crontab from 'node-crontab'
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
    let time = moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss')

    console.log(time)
}


//let dailyCron = crontab.scheduleJob("0 */1 * *", function(){ // cada día a las 12 AM
//    main();
//});

let dailyCron = crontab.scheduleJob("*/5 * * * * *", function(){ // cada 5 segundos
    test();
});


export default dailyCron