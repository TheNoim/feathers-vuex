/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import _omit from 'lodash/omit'
import { AuthenticationState, AuthenticationOptions } from './types'

export default function setupAuthState(options: AuthenticationOptions) {
  const nonStateProps = ['state', 'getters', 'mutations', 'actions']

  const state: AuthenticationState = {
    serverAlias: 'api',
    namespace: 'auth',

    user: null, // For a reactive user object, use the `user` getter.
    userService: 'users',

    accessToken: null, // The JWT
    payload: null, // The JWT payload
    entityIdField: 'userId',
    responseEntityField: 'user',

    isAuthenticatePending: false,
    isLogoutPending: false,

    errorOnAuthenticate: null,
    errorOnLogout: null
  }

  const startingState = _omit(options, nonStateProps)

  return Object.assign({}, state, startingState)
}
