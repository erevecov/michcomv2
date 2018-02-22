// import Joi from 'joi'
import Boom from 'boom';

import APIUsers from './api/users';
import APIClients from './api/clients';
import APIInvoices from './api/invoices';
import APITools from './api/tools';
import APILogs from './api/logs';
import APIEmails from './api/emails';


import Clients from './clients';
import Users from './users';
import Logs from './logs';

import loginHandler from './handlers/loginHandler';
import logoutHandler from './handlers/logoutHandler';

const Login = {
  method: ['GET', 'POST'],
  path: '/login',
  options: {
    handler: loginHandler,
    auth: { mode: 'try' },
    plugins: { 'hapi-auth-cookie': { redirectTo: false } }
  }
}

const Logout = {
  method: ['GET', 'POST'],
  path: '/logout',
  options: {
    handler: logoutHandler
  }
}

const Public = {
  method: 'GET',
  path: '/public/{path*}',
  options: {
    auth: false,
    handler: {
      directory: {
        path: './public',
        listing: false,
        index: false
      }
    }
  }
}
/*
const default404 = {
  method: [ 'GET', 'POST' ],
  path: '/{any*}',
  handler: (request, h) => {
    const accept = request.raw.req.headers.accept
    if (accept && accept.match(/json/)) {
      return Boom.notFound('This resource isn’t available.')
    }

    return h.view('404', { test: 'credentials' }, {layout: false}).code(404)
  }
}
*/

const Home = {
  method: ['GET'],
  path: '/',
  options: {
    handler: (request, h) => {
      // let client = encodeURIComponent(request.params.client)
      let credentials = request.auth.credentials
      //console.log(credentials)

      return h.view('home', { credentials: credentials })
    }
  }
}

const Routes = [].concat(
    Public,
    Login,
    Logout,
    Home,
    Clients,
    Users,
    Logs,
    // default404,
    APIUsers,
    APIClients,
    APIInvoices,
    APITools,
    APILogs,
    APIEmails
);

export default Routes;
