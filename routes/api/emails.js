import Joi from 'joi';
import nodemailer from 'nodemailer';

require('dotenv').load()

var config = {
    from: `Contabilidad Michcom Ltda. <${process.env.EMAIL_USER}>`,
    to: ['eduardorevecovillalobos@gmail.com'],
    subject: 'Facturas pendientes'
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

const emails = [
  { // Enviar correos de reportes (facturas pendientes)
    method: 'POST',
    path: '/api/send_pending_report',
    options: {
      handler: (request, h) => {
        let to = JSON.parse(request.payload.to);
        let html = request.payload.html;

        html+= `
            <center>
            <div>
                <span>
                    <img src="cid:logomichcom"/>
                </span>
            </div>
            </center>
        `;
        mailOptions.attachments = [
            {
                filename: 'logomichcom.png',
                path: 'http://michcom.cl/images/logomichcom.png',
                cid: 'logomichcom' //same cid value as in the html img src
            },
            /*
            {
                filename: 'logotronit.jpg',
                path: 'http://michcom.cl/images/logotronit.jpg',
                cid: 'logotronit' //same cid value as in the html img src
            },
            {
                filename: 'microsoft.png',
                path: 'http://michcom.cl/images/microsoft.png',
                cid: 'microsoft' //same cid value as in the html img src
            },*/
        ];
        
        

        /*
            uso mi correo para testing. En producción: mailOptions.to = to
        */

        mailOptions.to = to;
        mailOptions.to.push('contabilidad@michcom.cl');
        mailOptions.to.push('ereveco@michcom.cl');
        console.log(mailOptions.to);
        mailOptions.html = html;

        return new Promise(resolve => {
            transporter.sendMail(mailOptions, function (err, info) {           
                if (!err) {
                    console.log(info)
                    resolve({ok: 'Correo enviado correctamente'});
                } else {
                    console.log(err)
                    resolve({error: 'No se pudo enviar el correo'});
                }               
            });
        });
      },
      validate: {
        payload: Joi.object().keys({
          to: Joi.string(),
          html: Joi.string()
        })
      }
    }
  }
];
  
  export default emails;