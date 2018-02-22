import md5 from 'md5'
import cloudant from '../../config/db.js'

// let client = redis.createClient();

var db = cloudant.db.use('michcom_developing')

let uuid = 1 // Use seq instead of proper unique identifiers for demo only

const findUser = async (email, password) => {
  return new Promise((resolve) => {
    db.find({
      selector: {
        _id: email,
        password: password,
        status: 'enabled',
        type: 'user'
      }
    }, (err, result) => {
      if (err) throw err

      if (result.docs[0]) {
        let data = result.docs[0]
        if (data.password === password) {
          resolve(data)
        } else {
          resolve(null)
        }
      } 

    })
  })
}

const login = async (request, h) => {
  if (request.auth.isAuthenticated) return h.redirect('/')

  let account = null

  if (request.method === 'post') {
    if (!request.payload.username || !request.payload.password) {
      return h.view('login', {message: 'Missing username or password'}, { layout: false })
    } else {
      account = await findUser(request.payload.username, md5(request.payload.password))
      if (!account) {
        return h.view('login', {message: 'Invalid username or password'}, { layout: false })
      } else {
        const sid = String(++uuid)
        account.email = account._id
        delete account._id
        delete account.password
        delete account._rev
        await request.server.app.cache.set(sid, { account }, 0)
        request.cookieAuth.set({ sid })
        return h.redirect('/')
      }
    }
  }

  if (request.method === 'get') return h.view('login', {title: 'test'}, { layout: false })
}

export default login
