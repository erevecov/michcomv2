import Joi from 'joi';

const Logs = {
    method: ['GET'],
    path: '/logs',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials;
      
            return h.view('logs', { credentials: credentials, admin:'ok'});
        }
    }
};

export default Logs;
