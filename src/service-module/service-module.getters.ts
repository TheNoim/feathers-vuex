/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import sift from 'sift'
import { filterQuery, sorter, select } from '@feathersjs/adapter-commons'
import { globalModels as models } from './global-models'
import _omit from 'lodash/omit'
import { unref } from '@vue/composition-api'
import { ServiceState } from '..'
import { Id } from '@feathersjs/feathers'
import { getId } from '../utils'

const FILTERS = ['$sort', '$limit', '$skip', '$select']
const additionalOperators = ['$elemMatch']

const getCopiesById = ({
  keepCopiesInStore,
  servicePath,
  serverAlias,
  copiesById
}) => {
  if (keepCopiesInStore) {
    return copiesById
  } else {
    const Model = models[serverAlias].byServicePath[servicePath]

    return Model.copiesById
  }
}

export default function makeServiceGetters() {
  return {
    list: state => Object.values(state.keyedById),
    temps: state => Object.values(state.keyedById),
    itemsAndTemps: (state, getters) => getters.list.concat(getters.temps),
    itemsAndClones: (state, getters) => {
      const items = getters.list
      const copiesById = getCopiesById(state)
      return items.map(item => {
        const id = item[state.idField]
        if (id == null) {
          return item
        }
        return copiesById[id] || item
      })
    },
    itemsTempsAndClones: (state, getters) => {
      const { itemsAndTemps } = getters
      const copiesById = getCopiesById(state)
      return itemsAndTemps.map(item => {
        const id = item[state.idField] | item[state.tempIdField]
        if (id == null) {
          return item
        }
        return copiesById[id] || item
      })
    },
    operators: state => additionalOperators.concat(state.whitelist),
    find: (state, getters) => _params => {
      const params = unref(_params) || {}

      const { paramsForServer } = state
      const q = _omit(params.query || {}, paramsForServer)

      const { query, filters } = filterQuery(q, { operators: state.operators })

      let values
      if (!params.temps && !params.copies) {
        values = getters.list
      } else if (params.temps && params.copies) {
        values = getters.itemsTempsAndClones
      } else if (!params.temps) {
        values = getters.itemsAndClones
      } else {
        values = getters.itemsAndTemps
      }

      values = values.filter(sift(query))

      const total = values.length

      if (filters.$sort !== undefined) {
        values.sort(sorter(filters.$sort))
      }

      if (filters.$skip !== undefined && filters.$limit !== undefined) {
        values = values.slice(filters.$skip, filters.$limit + filters.$skip)
      } else if (filters.$skip !== undefined || filters.$limit !== undefined) {
        values = values.slice(filters.$skip, filters.$limit)
      }

      if (filters.$select) {
        values = select(params)(values)
      }

      return {
        total,
        limit: filters.$limit || 0,
        skip: filters.$skip || 0,
        data: values
      }
    },
    ids: (state, getters) =>
      getters.list.map(item => getId(item, state.idField)),
    count: (state, getters) => _params => {
      const params = unref(_params) || {}

      const cleanQuery = _omit(params.query, FILTERS)
      params.query = cleanQuery

      return getters.find(params).total
    },
    get: ({ keyedById, tempsById, idField, tempIdField }) => (
      _id,
      _params = {}
    ) => {
      const id = unref(_id)
      const params = unref(_params)

      const record = keyedById[id] && select(params, idField)(keyedById[id])
      if (record) {
        return record
      }
      const tempRecord =
        tempsById[id] && select(params, tempIdField)(tempsById[id])

      return tempRecord || null
    },
    getCopyById: state => id => {
      const copiesById = getCopiesById(state)
      return copiesById[id]
    },

    isCreatePendingById: ({ isIdCreatePending }: ServiceState) => (id: Id) =>
      isIdCreatePending.includes(id),
    isUpdatePendingById: ({ isIdUpdatePending }: ServiceState) => (id: Id) =>
      isIdUpdatePending.includes(id),
    isPatchPendingById: ({ isIdPatchPending }: ServiceState) => (id: Id) =>
      isIdPatchPending.includes(id),
    isRemovePendingById: ({ isIdRemovePending }: ServiceState) => (id: Id) =>
      isIdRemovePending.includes(id),
    isSavePendingById: (state: ServiceState, getters) => (id: Id) =>
      getters.isCreatePendingById(id) ||
      getters.isUpdatePendingById(id) ||
      getters.isPatchPendingById(id),
    isPendingById: (state: ServiceState, getters) => (id: Id) =>
      getters.isSavePendingById(id) || getters.isRemovePendingById(id)
  }
}

export type GetterName = keyof ReturnType<typeof makeServiceGetters>
