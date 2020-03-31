/*
eslint
@typescript-eslint/no-explicit-any: 0
*/

export interface HandleEvents {
  created?: Function
  patched?: Function
  updated?: Function
  removed?: Function
}

export interface MakeServicePluginOptions {
  Model: any
  service: any
  addOnUpsert?: boolean
  enableEvents?: boolean
  idField?: string
  tempIdField?: string
  nameStyle?: string
  namespace?: string
  preferUpdate?: boolean
  autoRemove?: boolean
  servicePath?: string
  instanceDefaults?: () => {}
  setupInstance?: (data, { models, store }) => {}
  state?: {}
  getters?: {}
  mutations?: {}
  actions?: {}
}
