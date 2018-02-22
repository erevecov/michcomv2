import Joi from 'joi'
import cloudant from '../../config/db.js'
import moment from 'moment-timezone'

let db = cloudant.db.use('michcom_developing')

const invoices = [{ // Crear una factura
  method: 'POST',
  path: '/api/invoice',
  options: {
    handler: (request, h) => {
      let rut = request.payload.rut
      let invoice = request.payload.invoice
      let business = request.payload.business
      let amount = request.payload.amount
      let invoiceType = request.payload.invoice_type
      let description = request.payload.description
      let date = request.payload.date
      let iva = request.payload.iva

      let filter1 = rut.split('.').join('')
      let filter2 = filter1.replace('-', '') // limpiar rut

      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gt: 0
            },
            $not: {
              status: 'disabled'
            },
            type: 'invoice',
            invoice: invoice,
            business: business
          },
          fields: [
            '_id'
          ],
          limit: 1
        }, (err, result) => {
          if (err) {
            throw err
          }

          if (result.docs[0]) {
            resolve({
              error: 'LA FACTURA <b>' + invoice + '<b> YA EXISTE EN ' + business.toUpperCase()
            })
          } else {
            let newInvoice = {
              _id: moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS'),
              type: 'invoice',
              invoice: invoice,
              date: date,
              client: filter2,
              business: business,
              amount: amount,
              status: 'PENDIENTE',
              invoice_type: invoiceType,
              description: description,
              iva: iva
            }

            db.insert(newInvoice, (err, body) => {
              if (err) throw err

              if (body.ok) {
                db.find({
                  selector: {
                    _id: filter2, // rut
                    type: 'client'
                  },
                  limit: 1
                }, (err, result) => {
                  if (err) throw err

                  let client = result.docs[0] // asignamos el objeto cliente a variable client
                  client.invoiceOwed.push(invoice) // Agregamos la nueva factura al ARRAY de facturas del cliente
                  client.amountOwed += amount // Agregamos el costo de la nueva factura al costo total de todas las facturas adeudadas del cliente

                  db.insert(client, (err2, body2) => {
                    if (err2) throw err2

                    resolve({
                      ok: 'FACTURA <b>' + invoice + '</b> CREADA CORRECTAMENTE',
                      id: body.id
                    })
                  })
                })
              }
            })
          }
        })
      })
    },
    validate: {
      payload: Joi.object().keys({
        invoice: Joi.number(),
        amount: Joi.number(),
        id: Joi.string(),
        rut: Joi.string(),
        business: Joi.string(),
        invoice_type: Joi.string(),
        description: Joi.string(),
        date: Joi.string(),
        iva: Joi.string()
      })
    }
  }
},
{ // obtener deudas de los clientes
  method: 'GET',
  path: '/api/invoiceAmount',
  options: {
    handler: (request, h) => {
      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gt: 0
            },
            $not: {
              status: 'disabled'
            },
            type: 'invoice'
          },
          fields: [
            'amount',
            'status',
            'invoice_type'
          ]
        }, (err, result) => {
          if (err) throw err

          if (result.docs[0]) {
            let owed = result.docs.reduce((final, actual) => {
              if (actual.invoice_type === 'service' && actual.status === 'PENDIENTE') {
                final.tronit = (final.tronit || 0) + actual.amount
              } else if (actual.invoice_type === 'product' && actual.status === 'PENDIENTE') {
                final.michcom = (final.michcom || 0) + actual.amount
              }

              if (actual.status === 'PENDIENTE') {
                final.totalAmount = (final.totalAmount || 0) + actual.amount
              }

              return final
            }, {})

            resolve(owed)
          } else {
            resolve({
              error: 'without invoices'
            })
          }
        })
      })
    }
  }
},
{
  method: 'POST',
  path: '/api/invoices/owed',
  options: {
    handler: (request, h) => {
      let rut = request.payload.rut

      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gt: 0
            },
            client: rut,
            status: 'PENDIENTE',
            type: 'invoice'
          }
        }, (err, result) => {
          if (err) throw err

          if (result.docs[0]) {
            let res = result.docs.map((el, index) => {
              return {
                date: el._id,
                invoice: el.invoice,
                business: el.business,
                amount: el.amount,
                type: el.invoice_type,
                description: el.description,
                iva: el.iva
              }
            })
            resolve(res)
          } else {
            resolve({
              error: 'without owed invoices'
            })
          }
        })
      })
    },
    validate: {
      payload: Joi.object().keys({
        rut: Joi.string().required()
      })
    }
  }
},
{
  method: 'POST',
  path: '/api/changeInvoiceState',
  options: {
    handler: async (request, h) => {
      let invoice = request.payload.invoice;
      let date = request.payload.date;
      let reason = request.payload.reason;
      let business = request.payload.business;
      let originalStatus = request.payload.originalStatus;

      const getOriginalInvoice = new Promise(resolve=>{
        db.find({
            "selector": {
                "_id": {
                    "$gt": 0
                },
                "status": originalStatus,
                "type": "invoice",
                "invoice": invoice,
                "business": business
            },
            "limit":1
        }, (err, result) => {
          if (err) throw 'err1: '+err;

          if (result.docs[0]) resolve(result.docs[0]);
        });
      })

      return new Promise(full=>{
        getOriginalInvoice.then(getInvoice=>{
          let modInvoice = Object.assign({}, getInvoice); // copiar sin fusionar

          return new Promise(resolve=>{
            if (originalStatus === 'PENDIENTE') {
              if (date.length === 0) date = moment.tz('America/Santiago').format('DD/MM/YYYY');

              //modInvoice._id = moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS');
              //delete modInvoice._rev;
              modInvoice.status = 'PAGADO';
              modInvoice.date = date;
              modInvoice.reason = reason;
            } else if (originalStatus === 'PAGADO') {
              //modInvoice._id = moment.tz('America/Santiago').format('YYYY-MM-DDTHH:mm:ss.SSSSS');
              //delete modInvoice._rev;
              modInvoice.status = 'PENDIENTE';
              modInvoice.date = '-';
              modInvoice.reason = reason;
            }

            resolve({modInvoice})
          })


        }).then(obj=>{
          return new Promise(resolve=>{
            db.insert(obj.modInvoice, function(err2, body) {
              if (err2) throw 'err2: '+err2;

              if (body.ok) resolve(obj)
            })
          })
        }).then((obj)=>{
          return new Promise(resolve=>{
            db.find({
                "selector": {
                    "_id": obj.modInvoice.client,
                    "type": "client"
                },
                "limit":1
            }, function(err3, result3) {
              if (err3) throw 'err3: '+err3;

              if (result3.docs[0]) {
                obj.client = result3.docs[0]
                resolve(obj)
              }
            })
          })
        }).then(obj=>{
          return new Promise(resolve=>{
            if (originalStatus === 'PENDIENTE') {
              let indexOf = obj.client.invoiceOwed.indexOf(obj.modInvoice.invoice);

              if (indexOf > -1) {
                  obj.client.invoiceOwed.splice(indexOf, 1);
                  obj.client.amountOwed = obj.client.amountOwed - obj.modInvoice.amount;

                  db.insert(obj.client, function(err4, body4) {
                      if (err4) throw err4;

                      full({ok: 'factura de numero '+invoice+' pagada correctamente', status: obj.modInvoice.status});
                  });
              }

            } else if (originalStatus === 'PAGADO') {
              obj.client.invoiceOwed.push(obj.modInvoice.invoice)
              obj.client.amountOwed += obj.modInvoice.amount

              db.insert(obj.client, function(err4, body4) {
                  if (err4) throw err4;

                  full({ok: 'factura de numero '+invoice+' anulada correctamente', status: obj.modInvoice.status });
              });
            }

          })
        })
      })

    },
    validate: {
        payload: Joi.object().keys({
            invoice: Joi.number(),
            date: Joi.string(),
            reason: Joi.string().allow(''),
            business: Joi.string(),
            originalStatus: Joi.string()
        })
    }
  }
},
{ // Cambiar es status de una factura a disabled
  method: 'POST',
  path: '/api/deleteInvoice',
  options: {
    handler: (request, h) => {
      let invoice = request.payload.invoice
      let business = request.payload.business

      let beforeStatus = ''
      return new Promise(resolve => {
        db.find({
          selector: {
            _id: {
              $gt: 0
            },
            type: 'invoice',
            invoice: invoice,
            business: business
          },
          limit: 1,
          sort: [{
            _id: 'desc' // debe encontrar la factura con la fecha mas alta
          }]
        }, (err, result) => {
          if (err) throw err

          //console.log(result)
          let getInvoice = result.docs[0]
          beforeStatus = getInvoice.status

          getInvoice.status = 'disabled'

          db.insert(getInvoice, (err2, body) => {
            if (err2) throw err2

            if (beforeStatus === 'PENDIENTE') {
              db.find({
                selector: {
                  _id: getInvoice.client,
                  type: 'client'
                },
                limit: 1
              }, (err3, result2) => {
                if (err3) throw err3

                let client = result2.docs[0]
                let indexOf = client.invoiceOwed.indexOf(invoice)

                if (indexOf > -1) {
                  client.invoiceOwed.splice(indexOf, 1)
                  client.amountOwed = client.amountOwed - getInvoice.amount

                  db.insert(client, (err4, body2) => {
                    if (err4) throw err4

                    resolve({
                      ok: 'factura de numero ' + invoice + ' eliminada correctamente',
                      beforeStatus: beforeStatus
                    })
                  })
                }
              })
            } else if (beforeStatus === 'PAGADO') {
              resolve({
                ok: 'factura de numero ' + invoice + ' eliminada correctamente',
                beforeStatus: beforeStatus
              })
            }
          })
        })
      })
    },
    validate: {
      payload: Joi.object().keys({
        invoice: Joi.number(),
        business: Joi.string()
      })
    }
  }
},
{ // modificar factura
  method: 'POST',
  path: '/api/modInvoice',
  options: {
    handler: async (request, h) => {
      let data = JSON.parse(request.payload.fullData);
      let invoiceValidation = await validateInvoice(data);

      if(invoiceValidation) {
        let modInvoice = await getAndModInvoice(data);
        let modifiedClient = await modClient(modInvoice.original, modInvoice.modified);

        if(modifiedClient) {
          let beforeText = '';

          if(data.invoice != data.originalInvoice) {
            beforeText = `(antes ${data.originalInvoice})`
          }

          return {ok: `Factura ${data.invoice} modificada correctamente!`}
        }
      } else {
          return {error: `Ya existe la factura ${data.invoice} en ${data.business}.`};
      }
      
    },
    validate: {
      payload: Joi.object().keys({
        fullData: Joi.string()
      })
    }
  }
}
]


const validateInvoice = (data) => {
  return new Promise(resolve=>{
    if(data.invoice == data.originalInvoiceNumber && data.business == data.originalBusiness) { // si el numero de factura y business son iguales a los originales (OK)
      resolve(true)
    } else {
      db.find({
        selector: {
          _id: {
            $gt: 0
          },
          $not: {
            status: 'disabled'
          },
          type: 'invoice',
          invoice: data.invoice,
          business: data.business 
        },
        limit: 1
      }, (err, result) => {
        if (err) throw err
  
        if(result.docs[0]) {
          resolve(false)
        } else {
          resolve(true)
        }
      })
    }
  });
}

const getAndModInvoice = (data) => {
  return new Promise(resolve=>{
    db.find({
      selector: {
        _id: {
          $gt: 0
        },
        $not: {
          status: 'disabled'
        },
        type: 'invoice',
        invoice: data.originalInvoiceNumber,
        business: data.originalBusiness
      },
      limit: 1
    }, (err, result) => {
      if (err) throw err

      if(result.docs[0]) {
        let modInvoice =  Object.assign({}, result.docs[0]);

        modInvoice.invoice = data.invoice;
        modInvoice.business = data.business;
        modInvoice.invoice_type = data.invoice_type;
        modInvoice.amount = data.amount;
        modInvoice.iva = data.iva;
        modInvoice.description = data.description;

        db.insert(modInvoice, (err, body) => {
          if (err) throw err
          
          if (body.ok)  resolve({original: result.docs[0], modified: modInvoice});
        });
      }
    })
  });
}

const modClient = (originalInvoice, modifiedInvoice) => { // solo si la factura está pendiente
  return new Promise(resolve=>{
    db.find({
      selector: {
        _id: originalInvoice.client,
        type: 'client'
      },
      limit: 1
    }, (err, result) => {
      if (err) throw err

      let client = result.docs[0]
      let indexOf = client.invoiceOwed.indexOf(originalInvoice.invoice)

      if (indexOf > -1) { // solo si la factura está pendiente
        client.invoiceOwed.splice(indexOf, 1) // si la factura está pendiente quitamos el número de factura original del arreglo invoiceOwed 
        client.invoiceOwed.push(modifiedInvoice.invoice) // agregamos el nuevo numero de factura al arreglo invoiceOwed

        client.amountOwed = client.amountOwed - originalInvoice.amount;
        client.amountOwed = client.amountOwed + modifiedInvoice.amount;

        db.insert(client, (err2, body) => {
          if (err2) throw err2

          if (body.ok) resolve(true)
        })
      } else {
        resolve(true);
      }
    })
  })
}

export default invoices
