import Joi from 'joi';

const Users = {
    method: ['GET'],
    path: '/users',
    options: {
        handler: (request, h) => {
            let credentials = request.auth.credentials;
      
            return h.view('users', { credentials: credentials, admin:'ok'});
        }
    }
};

export default Users;
