import Joi from 'joi';

const Hostings = {
    method: ['GET'],
    path: '/hostings',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials;
      
            return h.view('hostings', { credentials: credentials, admin:'ok'});
        }
    }
};

export default Hostings;
