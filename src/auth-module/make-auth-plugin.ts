/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { FeathersVuexOptions } from '../types'
import { AuthenticationOptions } from './types'
import makeState from './auth-module.state'
import makeGetters from './auth-module.getters'
import makeMutations from './auth-module.mutations'
import makeActions from './auth-module.actions'
import {
  AuthenticationClient,
  AuthenticationClientOptions
} from '@feathersjs/authentication-client'
import { Application } from '@feathersjs/feathers'
import auth from '@feathersjs/authentication-client'

import _pick from 'lodash/pick'

interface AuthenticationDefaults {
  namespace: string
  userService: string
  serverAlias: string
  state: {}
  getters: {}
  mutations: {}
  actions: {}
}

const defaults: AuthenticationDefaults = {
  namespace: 'auth',
  userService: '', // Set this to automatically populate the user (using an additional request) on login success.
  serverAlias: 'api',
  state: {}, // for custom state
  getters: {}, // for custom getters
  mutations: {}, // for custom mutations
  actions: {} // for custom actions
}

export default function authPluginInit(
  feathersClient: Application,
  globalOptions: FeathersVuexOptions
) {
  if (!feathersClient || !feathersClient.service) {
    throw new Error('You must pass a Feathers Client instance to feathers-vuex')
  }

  return function makeAuthPlugin(options: AuthenticationOptions) {
    const clientProps = [
      'storage',
      'path',
      'locationKey',
      'locationErrorKey',
      'jwtStrategy',
      'storageKey',
      'header',
      'scheme',
      'Authentication'
    ]

    if (clientProps.some(propKey => options[propKey])) {
      const propsForAuth = _pick(options, clientProps)
      feathersClient.configure(auth(propsForAuth))
    }

    options = Object.assign(
      {},
      defaults,
      {
        serverAlias: globalOptions.serverAlias,
        debug: globalOptions.debug
      },
      options
    )

    if (!feathersClient.authenticate) {
      throw new Error(
        'You must register the @feathersjs/authentication-client plugin before using the feathers-vuex auth module'
      )
    }
    if (options.debug && options.userService && !options.serverAlias) {
      console.warn(
        'A userService was provided, but no serverAlias was provided. To make sure the user record is an instance of the User model, a serverAlias must be provided.'
      )
    }

    const defaultState = makeState(options)
    const defaultGetters = makeGetters(options)
    const defaultMutations = makeMutations()
    const defaultActions = makeActions(feathersClient)

    return function setupStore(store) {
      const { namespace } = options

      store.registerModule(namespace, {
        namespaced: true,
        state: Object.assign({}, defaultState, options.state),
        getters: Object.assign({}, defaultGetters, options.getters),
        mutations: Object.assign({}, defaultMutations, options.mutations),
        actions: Object.assign({}, defaultActions, options.actions)
      })
    }
  }
}
