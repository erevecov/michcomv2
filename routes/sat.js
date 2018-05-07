import Joi from 'joi';

const Sat = {
    method: ['GET'],
    path: '/sat',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials;

            return h.view('sat', { credentials: credentials, admin: 'ok' });
        }
    }
};

export default Sat;
