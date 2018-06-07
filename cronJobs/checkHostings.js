import cloudant from '../config/db.js';
import cron from 'node-cron';
import moment from 'moment-timezone';
import configEnv from '../config/env_status.js';
import nodemailer from 'nodemailer';
import rutjs from 'rutjs';

let db = cloudant.db.use(configEnv.db);

moment.locale('es');
require('dotenv').load()

var config = {
    from: `Contabilidad Michcom Ltda. <${process.env.EMAIL_USER}>`,
    to: ['ereveco@michcom.cl'], //contacto@michcom.cl
    subject: 'Pago de Hostings pendientes'
};

var transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: 25,
    secure: false, // use TLS
    auth: {
        user: process.env.EMAIL_USER, // .env para commit
        pass: process.env.EMAIL_PASSWORD // .env para commit
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
});

var mailOptions = {
    from: config.from, 
    to: config.to, // emails de destino
    subject: config.subject, 
    html: 'testing'
};



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
            let time = moment.tz('America/Santiago').format('MM-DD')
         
            let res = result.docs.reduce((arr, el, i) => {
                if(el.hosting.report_day == time) {
                    return arr.concat(el)
                }
            }, [])
            
            if (res[0]) {
                let dateText = moment.tz('America/Santiago').add(5, 'days').format('LL')
                let html = `<center><h1>${res.length} Pagos de hosting con fecha <b>${dateText}</b></h1></center>` 

                let resText = res.reduce((txt, el, i) => {
                    let rut = new rutjs(el._id);
                    let textFree = 'sin comentario'; 

                    if(el.hosting.free_text.length > 0) {
                        textFree = el.hosting.free_text;
                    }

                    return txt += `
                        <hr>
                        <p>
                            El cliente <b>${rut.getNiceRut()} (${el.name})</b>
                            debe pagar un total de <b>$${number_format(el.hosting.amount)}</b> por un hosting <b>${el.hosting.package}.</b>
                            <p>comentario: ${textFree}</p>
                        </p>
                    `
                    
                }, '');

                html += resText;
                html += `
                    <div>
                        <span>
                            <img src="cid:logomichcom"/>
                        </span>
                    </div>

                    <br>
                    <center>
                        Curicó, ${moment.tz('America/Santiago').format('dddd DD [de] MMMM [de] YYYY')}
                    </center>
                `;

                mailOptions.attachments = [
                    {
                        filename: 'logomichcom.png',
                        path: 'http://michcom.cl/assets/img/contamichcom.png',
                        cid: 'logomichcom' //same cid value as in the html img src
                    }
                ];

                mailOptions.html = html;

                transporter.sendMail(mailOptions, function (err, info) {           
                    if (!err) {
                        console.log(info)
                        console.log({ok: 'Correo enviado correctamente'});
                    } else {
                        console.log(err)
                        console.log({error: 'No se pudo enviar el correo'});
                    }               
                });
            }
            
        } else {
            console.log({error: 'No existen clientes con paquetes de hosting'});
        }
    })
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


let dailyCron = cron.schedule('0 0 0 * * *', function(){ // una vez al día a las 0 AM
    main()
});


/*
let dailyCron = cron.schedule('* * * * * *', function(){ // cada 1 segundos
    main()
});
*/


const number_format = (amount, decimals) => {
    amount += ''; // por si pasan un numero en vez de un string
    amount = parseFloat(amount.replace(/[^0-9\.]/g, '')); // elimino cualquier cosa que no sea numero o punto

    decimals = decimals || 0; // por si la variable no fue fue pasada

    // si no es un numero o es igual a cero retorno el mismo cero
    if (isNaN(amount) || amount === 0)
        return parseFloat(0).toFixed(decimals);

    // si es mayor o menor que cero retorno el valor formateado como numero
    amount = '' + amount.toFixed(decimals);

    var amount_parts = amount.split('.'),
        regexp = /(\d+)(\d{3})/;

    while (regexp.test(amount_parts[0]))
        amount_parts[0] = amount_parts[0].replace(regexp, '$1' + '.' + '$2');

    return amount_parts.join('.');
}

export default dailyCron