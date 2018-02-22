import Joi from 'joi';

const Clients = {
    method: ['GET'],
    path: '/clients',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials;
      
            return h.view('clients', { credentials: credentials, admin:'ok'});
        }
    }
};

export default Clients;
