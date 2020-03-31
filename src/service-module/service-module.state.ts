/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/

import _omit from 'lodash/omit'

import { MakeServicePluginOptions } from './types'

export interface ServiceStateExclusiveDefaults {
  ids: string[]

  errorOnFind: any
  errorOnGet: any
  errorOnCreate: any
  errorOnPatch: any
  errorOnUpdate: any
  errorOnRemove: any

  isFindPending: boolean
  isGetPending: boolean
  isCreatePending: boolean
  isPatchPending: boolean
  isUpdatePending: boolean
  isRemovePending: boolean

  keyedById: {}
  tempsById: {}
  tempsByNewId: {}
  copiesById: {}
  namespace?: string
  pagination?: {
    defaultLimit: number
    defaultSkip: number
    default?: PaginationState
  }
  modelName?: string
}

export interface ServiceState {
  options: {}
  ids: string[]
  autoRemove: boolean
  errorOnFind: any
  errorOnGet: any
  errorOnCreate: any
  errorOnPatch: any
  errorOnUpdate: any
  errorOnRemove: any
  isFindPending: boolean
  isGetPending: boolean
  isCreatePending: boolean
  isPatchPending: boolean
  isUpdatePending: boolean
  isRemovePending: boolean
  idField: string
  keyedById: {}
  tempsById: {}
  tempsByNewId: {}
  copiesById: {}
  whitelist: string[]
  paramsForServer: string[]
  namespace: string
  nameStyle: string // Should be enum of 'short' or 'path'
  pagination?: {
    defaultLimit: number
    defaultSkip: number
    default?: PaginationState
  }
  modelName?: string
}

export interface PaginationState {
  ids: any
  limit: number
  skip: number
  ip: number
  total: number
  mostRecent: any
}

export default function makeDefaultState(options: MakeServicePluginOptions) {
  const nonStateProps = [
    'Model',
    'service',
    'instanceDefaults',
    'setupInstance',
    'handleEvents',
    'state',
    'getters',
    'mutations',
    'actions'
  ]

  const state: ServiceStateExclusiveDefaults = {
    ids: [],
    keyedById: {},
    copiesById: {},
    tempsById: {}, // Really should be called tempsByTempId
    tempsByNewId: {}, // temporary storage for temps while getting transferred from tempsById to keyedById
    pagination: {
      defaultLimit: null,
      defaultSkip: null
    },

    isFindPending: false,
    isGetPending: false,
    isCreatePending: false,
    isUpdatePending: false,
    isPatchPending: false,
    isRemovePending: false,

    errorOnFind: null,
    errorOnGet: null,
    errorOnCreate: null,
    errorOnUpdate: null,
    errorOnPatch: null,
    errorOnRemove: null
  }

  if (options.Model) {
    state.modelName = options.Model.modelName
  }

  const startingState = _omit(options, nonStateProps)

  return Object.assign({}, state, startingState)
}
