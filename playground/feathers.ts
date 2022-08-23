import feathers from '@feathersjs/feathers'
import socketio from '@feathersjs/socketio-client'
import auth from '@feathersjs/authentication-client'
import io from 'socket.io-client'
import { iff, discard } from 'feathers-hooks-common'
import feathersVuex from '../src'

const socket = io('http://localhost:3030', {
  transports: ['websocket'],
  rejectUnauthorized: false
})

const feathersClient = feathers()
  .configure(socketio(socket))
  .configure(auth({ storage: window.localStorage }))
  .hooks({
    before: {
      all: [
        iff(
          (context) => ['create', 'update', 'patch'].includes(context.method),
          discard('__id', '__isTemp')
        )
      ]
    }
  })

export default feathersClient

// Setting up feathers-vuex
const { makeServicePlugin, makeAuthPlugin, BaseModel, models, FeathersVuex } =
  feathersVuex(feathersClient, {
    serverAlias: 'api',
    idField: 'id',
    tempIdField: '_idTemp',
    whitelist: ['$regex', '$options']
  })

export { makeAuthPlugin, makeServicePlugin, BaseModel, models, FeathersVuex }
