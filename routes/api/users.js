import Joi from 'joi';
import cloudant from '../../config/db.js';
import moment from 'moment-timezone';
import md5 from 'md5';
import configEnv from '../../config/env_status.js';

let db = cloudant.db.use(configEnv.db)

const Users = [{ // ver todos
    method: 'GET',
    path: '/api/users',
    options: {
        handler: (request, h) => {
            return new Promise(resolve=>{
                db.find({
                    'selector': {
                        '_id': {
                            '$gte': null
                        },
                        'type': 'user',
                        'status': 'enabled'
                    }
                }, (err, result) => {
                    if (err) throw err;
                    
                    if(result.docs[0]) {
                        resolve(result.docs);   
                    } else {
                        resolve({err: 'no existen usuarios habilitados'});
                    }
                });
            });
        }
    }
}, 
{ // todos los usuarios deshabilitados
    method: 'GET',
    path: '/api/disabledUsers',
    options: {
        handler: (request, h) => {
            return new Promise(resolve=>{
                db.find({
                    "selector": {
                        "_id": {
                            "$gte": null
                        },
                        "type": "user",
                        "status": "disabled"
                    }
                }, (err, result) => {
                    if (err) throw err;
        
                    if(result.docs[0]) {
                        resolve(result.docs);
                    } else {
                        resolve({err: 'no existen usuarios deshabilitados'});
                    }   
                });
            });
        }
    }
}, 
{ // agregar un usuario
    method: 'POST',
    path: '/api/user',
    options: {
        handler: (request, h) => {
            let email = request.payload.email;
            let name = request.payload.name;
            let lastname = request.payload.lastname;
            let password = md5(request.payload.password);
            let role = request.payload.role;
            let userData = {};

            return new Promise(resolve=>{
                db.find({
                    'selector': {
                        '_id': email,
                        'type': 'user'
                    },
                    'limit':1
                }, (err, result) => {
                    if (err) throw err;
                    
                    if (result.docs[0]) {
                        resolve({error: 'El usuario del correo '+result.docs[0]._id+' ya existe.'});
                    } else {
                        userData = {
                            _id: email,
                            type: 'user',
                            status: 'enabled',
                            password: password,
                            name: name,
                            lastname: lastname,
                            role: role
                        };
    
                        db.insert(userData, (errUpdate, body) => {
                            if (errUpdate) throw errUpdate;
    
                            if(body.ok) resolve({ok: 'El usuario del correo '+email+' creado correctamente!'});
                        });
                    }
                });
            });
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string(),
                password: Joi.string(),
                name: Joi.string(),
                lastname: Joi.string(),
                role: Joi.string()
            })
        }
    }
}, { // deshabilitar un usuario
    method: 'POST',
    path: '/api/disableUser',
    options: {
        handler: (request, h) => {
            let email = request.payload.email;
            let userData = {};

            return new Promise(resolve=>{
                db.find({ 
                    "selector": {
                        "_id": email,
                        "type": "user"
                    },
                    "limit":1
                }, (err, result) => {
                    if (err) throw err;
    
                    userData = result.docs[0];
                    userData.status = 'disabled';
    
                    db.insert(userData, (errUpdate, body) => {
                        if (errUpdate) throw errUpdate;
    
                        resolve({ok: 'Usuario '+userData._id+' deshabilitado correctamente'}); 
                    });
                }); 
            });
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string()
            })
        }
    }
},
{ // habilitar un usuario
    method: 'POST',
    path: '/api/enableUser',
    options: {
        handler: (request, h) => {
            let email = request.payload.email;
            let userData = {};

            return new Promise(resolve=>{
                db.find({ 
                    "selector": {
                        "_id": email,
                        "type": "user"
                    },
                    "limit":1
                }, (err, result) => {
                    if (err) throw err;

                    userData = result.docs[0];
                    userData.status = 'enabled';
    
                    db.insert(userData, (errUpdate, body) => {
                        if (errUpdate) throw errUpdate;
    
                        resolve({ok: 'Usuario '+userData._id+' habilitado correctamente'}); 
                    }); 
                }); 
            });
        },
        validate: {
            payload: Joi.object().keys({
                email: Joi.string()
            })
        }
    }
},
{ // traer un usuario
  method: 'POST',
  path: '/api/getUser',
  options: {
      handler: (request, h) => {
        let user = request.payload.user;

        return new Promise(resolve=>{
          db.find({ 
              "selector": {
                  "_id": user,
                  "type": "user"
              },
              "limit":1
          }, (err, result) => {
              if (err) throw err;

              if (result.docs[0]) resolve(result.docs[0]);
          });
        });
      },
      validate: {
        payload: Joi.object().keys({
            user: Joi.string()
        })
      }
  }
},

{ // modificar usuario 
    method: 'POST',
    path: '/api/modUser',
    options: {
        handler: (request, h) => {
            let id = request.payload.userId;
            let name = request.payload.userName;
            let lastname = request.payload.userLastname;
            let password = request.payload.userPassword;
            let role = request.payload.userRole;
            let modUserObj = {};

            
            
            return new Promise(resolve => {
                db.find({
                    "selector": {
                        "_id": id,
                        "type": "user",
                        "status": "enabled"
                    },
                    "limit": 1
                }, function (err, result) {
                    if (err) throw err;

                    if (result.docs[0]) {
                        modUserObj = result.docs[0];
                        modUserObj.name = name;
                        modUserObj.lastname = lastname;
                        modUserObj.role = role;
                        
                        if (password) {
                            modUserObj.password = md5(password);
                        }

                        db.insert(modUserObj, function (errUpdate, body) {
                            if (errUpdate) throw errUpdate;

                            resolve({ ok: 'Usuario ' + modUserObj.name + ' modificado correctamente' });
                        });
                    } else {
                        resolve({ error: 'el usuario de email ' + email + ' no existe' });
                    }
                });
            });
            
        },
        validate: {
            payload: Joi.object().keys({
                userId: Joi.string(),
                userName: Joi.string(),
                userLastname: Joi.string(),
                userPassword: Joi.string().allow(''),
                userRole: Joi.string()//.allow('')
            })
        }
    }
},];

export default Users;