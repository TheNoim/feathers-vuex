import { createStore } from 'vuex'
import feathersClient, {
  makeServicePlugin,
  BaseModel,
  makeAuthPlugin
} from './feathers'

export class User extends BaseModel {
  static modelName = 'User'
}

const servicePlugin = makeServicePlugin({
  Model: User,
  service: feathersClient.service('users'),
  idField: 'id'
})

const authPlugin = makeAuthPlugin({
  userService: 'users',
  serverAlias: 'api',
  getters: {
    user(state, getters, rootState) {
      console.log({ state })
      if (!state.user) {
        return null
      }
      const { idField } = rootState['users']
      const userId = state.user[idField]
      console.log({ userId, idField })
      return rootState['users'].keyedById[userId] || null
    }
  }
})

export const store = createStore({
  plugins: [servicePlugin, authPlugin]
})
