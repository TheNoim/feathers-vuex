/*
eslint
@typescript-eslint/no-explicit-any: 0
*/

import { AuthenticationClientOptions } from '@feathersjs/authentication-client'

export interface AuthenticationOptions
  extends Partial<AuthenticationClientOptions> {
  namespace?: string
  userService?: string
  serverAlias?: string
  debug?: boolean
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
}

export interface AuthenticationState {
  serverAlias: string
  namespace: string

  user: any
  userService?: string

  accessToken: any
  payload: any
  entityIdField: string
  responseEntityField: string

  isAuthenticatePending: boolean
  isLogoutPending: boolean

  errorOnAuthenticate: any
  errorOnLogout: any
}
