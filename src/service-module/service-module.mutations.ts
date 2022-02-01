/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0,
no-var: 0
*/
import Vue from 'vue'
import { serializeError } from 'serialize-error'
import {
  updateOriginal,
  mergeWithAccessors,
  assignTempId,
  getId,
  getQueryInfo
} from '../utils'
import { globalModels as models } from './global-models'
import _omit from 'lodash/omit'
import _get from 'lodash/get'
import _isObject from 'lodash/isObject'
import { Id } from '@feathersjs/feathers'
import { ServiceState } from '..'

export type PendingServiceMethodName =
  | 'find'
  | 'get'
  | 'create'
  | 'update'
  | 'patch'
  | 'remove'
export type PendingIdServiceMethodName = Exclude<
  PendingServiceMethodName,
  'find' | 'get'
>

export default function makeServiceMutations() {
  function addItems(state, items) {
    const { serverAlias, idField, tempIdField, modelName } = state
    const Model = models[serverAlias][modelName]
    const BaseModel = models[serverAlias]['BaseModel']

    const keyedById = {}
    const tempsById = {}

    for (let i = 0, n = items.length; i < n; i++) {
      let item = items[i]

      const id = getId(item, idField)
      const isTemp = id == null

      // If the response contains a real id, remove isTemp
      if (!isTemp && '__isTemp' in item) {
        delete item.__isTemp
      }

      if (Model && !(item instanceof BaseModel) && !(item instanceof Model)) {
        item = new Model(item, { commit: false })
      }

      if (isTemp) {
        let tempId = item[tempIdField]
        if (tempId == null) {
          tempId = assignTempId(state, item)
        }
        item.__isTemp = true

        tempsById[tempId] = item
      } else {
        keyedById[id] = item
      }
    }

    const lengthKeyed = Object.keys(keyedById).length

    if (lengthKeyed) {
      if (lengthKeyed === 1) {
        const [[id, item]] = Object.entries(keyedById)
        Vue.set(state.keyedById, id, item)
      } else {
        Vue.set(state, 'keyedById', { ...state.keyedById, ...keyedById })
      }
    }

    const lengthTemps = Object.keys(tempsById).length

    if (lengthTemps) {
      if (lengthTemps === 1) {
        const [[id, item]] = Object.entries(tempsById)
        Vue.set(state.tempsById, id, item)
      } else {
        Vue.set(state, 'tempsById', { ...state.tempsById, ...tempsById })
      }
    }
  }

  function updateItems(state, items) {
    const { idField, replaceItems, addOnUpsert, serverAlias, modelName } = state
    const Model = _get(models, [serverAlias, modelName])
    const BaseModel = _get(models, [state.serverAlias, 'BaseModel'])

    for (let i = 0, n = items.length; i < n; i++) {
      let item = items[i]

      const id = getId(item, idField)

      // If the response contains a real id, remove isTemp
      if (id != null) {
        delete item.__isTemp
      }

      // Update the record
      if (id !== null && id !== undefined) {
        if (!!state.keyedById[id]) {
          // Completely replace the item
          if (replaceItems) {
            if (Model && !(item instanceof Model)) {
              item = new Model(item)
            }
            Vue.set(state.keyedById, id, item)
            // Merge in changes
          } else {
            /**
             * If we have a Model class, calling new Model(incomingData) will call update
             * the original record with the accessors and setupInstance data.
             * This means that date objects and relationships will be preserved.
             *
             * If there's no Model class, just call updateOriginal on the incoming data.
             */
            if (
              Model &&
              !(item instanceof BaseModel) &&
              !(item instanceof Model)
            ) {
              item = new Model(item)
            } else {
              const original = state.keyedById[id]
              updateOriginal(original, item)
            }
          }

          // if addOnUpsert then add the record into the state, else discard it.
        } else if (addOnUpsert) {
          Vue.set(state.keyedById, id, item)
        }
        continue
      }
    }
  }

  function mergeInstance(state, item) {
    const id = getId(item, state.idField)
    const existingItem = state.keyedById[id]
    if (existingItem) {
      mergeWithAccessors(existingItem, item)
    }
  }

  function merge(state, { dest, source }) {
    mergeWithAccessors(dest, source)
  }

  return {
    mergeInstance,
    merge,
    addItem(state, item) {
      addItems(state, [item])
    },
    addItems,
    updateItem(state, item) {
      updateItems(state, [item])
    },
    updateItems(state, items) {
      if (!Array.isArray(items)) {
        throw new Error(
          'You must provide an array to the `updateItems` mutation.'
        )
      }
      updateItems(state, items)
    },

    // Promotes temp to "real" item:
    // - adds _id to temp
    // - removes __isTemp flag
    // - migrates temp from tempsById to keyedById
    updateTemp(state, { id, tempId }) {
      const temp = state.tempsById[tempId]
      if (temp) {
        temp[state.idField] = id
        Vue.delete(temp, '__isTemp')
        Vue.delete(state.tempsById, tempId)
        // If an item already exists in the store from the `created` event firing
        // it will be replaced here
        Vue.set(state.keyedById, id, temp)
      }

      // Add _id to temp's clone as well if it exists
      const Model = _get(models, [state.serverAlias, state.modelName])
      const tempClone = Model && Model.copiesById && Model.copiesById[tempId]
      if (tempClone) {
        tempClone[state.idField] = id
        Model.copiesById[id] = tempClone
        Vue.delete(tempClone, '__isTemp')
      }
    },

    removeItem(state, item) {
      const { idField } = state
      const idToBeRemoved = _isObject(item) ? getId(item, idField) : item
      const isIdOk = idToBeRemoved !== null && idToBeRemoved !== undefined

      const Model = _get(models, `[${state.serverAlias}][${state.modelName}]`)
      const copiesById = state.keepCopiesInStore
        ? state.copiesById
        : Model.copiesById

      if (isIdOk) {
        Vue.delete(state.keyedById, idToBeRemoved)
        if (copiesById.hasOwnProperty(idToBeRemoved)) {
          Vue.delete(copiesById, idToBeRemoved)
        }
      }
    },

    // Removes temp records
    removeTemps(state, tempIds) {
      tempIds.forEach(id => {
        const temp = state.tempsById[id]
        if (temp) {
          if (temp[state.idField]) {
            // Removes __isTemp if created
            delete temp.__isTemp
            Vue.delete(temp, '__isTemp')
          }
        }
      })
      state.tempsById = _omit(state.tempsById, tempIds)
    },

    removeItems(state, items) {
      const { idField } = state

      if (!Array.isArray(items)) {
        throw new Error(
          'You must provide an array to the `removeItems` mutation.'
        )
      }
      // Make sure we have an array of ids. Assume all are the same.
      const containsObjects = items[0] && _isObject(items[0])
      const idsToRemove = containsObjects
        ? items.map(item => getId(item, idField))
        : items
      const mapOfIdsToRemove = idsToRemove.reduce((map, id) => {
        map[id] = true
        return map
      }, {})

      const Model = _get(models, [
        state.serverAlias,
        'byServicePath',
        state.servicePath
      ])
      const copiesById = state.keepCopiesInStore
        ? state.copiesById
        : Model.copiesById

      idsToRemove.forEach(id => {
        Vue.delete(state.keyedById, id)
        if (copiesById.hasOwnProperty(id)) {
          Vue.delete(copiesById, id)
        }
      })
    },

    clearAll(state) {
      state.keyedById = {}

      if (state.keepCopiesInStore) {
        state.copiesById = {}
      } else {
        const Model = _get(models, [
          state.serverAlias,
          'byServicePath',
          state.servicePath
        ])
        Object.keys(Model.copiesById).forEach(k =>
          Vue.delete(Model.copiesById, k)
        )
      }
    },

    // Creates a copy of the record with the passed-in id, stores it in copiesById
    createCopy(state, id) {
      const { servicePath, keepCopiesInStore, serverAlias } = state
      const current = state.keyedById[id] || state.tempsById[id]
      const Model = _get(models, [serverAlias, 'byServicePath', servicePath])

      let item

      if (Model) {
        item = new Model(current, { clone: true })
      } else {
        const existingClone = state.copiesById[id]

        item = existingClone
          ? mergeWithAccessors(existingClone, current)
          : mergeWithAccessors({}, current)
      }

      if (keepCopiesInStore) {
        state.copiesById[id] = item
      } else {
        // Since it won't be added to the store, make it a Vue object
        if (!item.hasOwnProperty('__ob__')) {
          item = Vue.observable(item)
        }
        if (!Model.hasOwnProperty('copiesById')) {
          Object.defineProperty(Model, 'copiesById', { value: {} })
        }
        Model.copiesById[id] = item
      }
    },

    // Resets the copy to match the original record, locally
    resetCopy(state, id) {
      const { servicePath, keepCopiesInStore } = state
      const Model = _get(models, [
        state.serverAlias,
        'byServicePath',
        servicePath
      ])
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, ['copiesById', id])

      if (copy) {
        const original =
          copy[state.idField] != null
            ? state.keyedById[id]
            : state.tempsById[id]
        mergeWithAccessors(copy, original)
      }
    },

    // Deep assigns copy to original record, locally
    commitCopy(state, id) {
      const { servicePath, keepCopiesInStore } = state
      const Model = _get(models, [
        state.serverAlias,
        'byServicePath',
        servicePath
      ])
      const copy = keepCopiesInStore
        ? state.copiesById[id]
        : Model && _get(Model, ['copiesById', id])

      if (copy) {
        const original =
          copy[state.idField] != null
            ? state.keyedById[id]
            : state.tempsById[id]
        mergeWithAccessors(original, copy)
      }
    },

    // Removes the copy from copiesById
    clearCopy(state, id) {
      const { keepCopiesInStore } = state
      const Model = _get(models, [
        state.serverAlias,
        'byServicePath',
        state.servicePath
      ])

      const copiesById = keepCopiesInStore ? state.copiesById : Model.copiesById

      if (copiesById[id]) {
        Vue.delete(copiesById, id)
      }
    },

    /**
     * Stores pagination data on state.pagination based on the query identifier
     * (qid) The qid must be manually assigned to `params.qid`
     */
    updatePaginationForQuery(state, { qid, response, query = {} }) {
      const { data, total } = response
      const { idField } = state
      const ids = data.map(i => i[idField])
      const queriedAt = new Date().getTime()
      const { queryId, queryParams, pageId, pageParams } = getQueryInfo(
        { qid, query },
        response
      )

      if (!state.pagination[qid]) {
        Vue.set(state.pagination, qid, {})
      }
      if (!query.hasOwnProperty('$limit') && response.hasOwnProperty('limit')) {
        Vue.set(state.pagination, 'defaultLimit', response.limit)
      }
      if (!query.hasOwnProperty('$skip') && response.hasOwnProperty('skip')) {
        Vue.set(state.pagination, 'defaultSkip', response.skip)
      }

      const mostRecent = {
        query,
        queryId,
        queryParams,
        pageId,
        pageParams,
        queriedAt,
        total
      }

      const qidData = state.pagination[qid] || {}
      Object.assign(qidData, { mostRecent })
      qidData[queryId] = qidData[queryId] || {}
      const queryData = {
        total,
        queryParams
      }
      Object.assign(qidData[queryId], queryData)

      const pageData = {
        [pageId]: { pageParams, ids, queriedAt }
      }
      Object.assign(qidData[queryId], pageData)

      const newState = Object.assign({}, state.pagination[qid], qidData)

      Vue.set(state.pagination, qid, newState)
    },

    setPending(state, method: PendingServiceMethodName): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`is${uppercaseMethod}Pending`] = true
    },
    unsetPending(state, method: PendingServiceMethodName): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`is${uppercaseMethod}Pending`] = false
    },

    setIdPending(
      state,
      payload: { method: PendingIdServiceMethodName; id: Id | Id[] }
    ): void {
      const { method, id } = payload
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      const isIdMethodPending = state[
        `isId${uppercaseMethod}Pending`
      ] as ServiceState['isIdCreatePending']
      // if `id` is an array, ensure it doesn't have duplicates
      const ids = Array.isArray(id) ? [...new Set(id)] : [id]
      ids.forEach(id => {
        if (typeof id === 'number' || typeof id === 'string') {
          isIdMethodPending.push(id)
        }
      })
    },
    unsetIdPending(
      state,
      payload: { method: PendingIdServiceMethodName; id: Id | Id[] }
    ): void {
      const { method, id } = payload
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      const isIdMethodPending = state[
        `isId${uppercaseMethod}Pending`
      ] as ServiceState['isIdCreatePending']
      // if `id` is an array, ensure it doesn't have duplicates
      const ids = Array.isArray(id) ? [...new Set(id)] : [id]
      ids.forEach(id => {
        const idx = isIdMethodPending.indexOf(id)
        if (idx >= 0) {
          Vue.delete(isIdMethodPending, idx)
        }
      })
    },

    setError(
      state,
      payload: { method: PendingServiceMethodName; error: Error }
    ): void {
      const { method, error } = payload
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`errorOn${uppercaseMethod}`] = Object.assign(
        {},
        serializeError(error)
      )
    },
    clearError(state, method: PendingServiceMethodName): void {
      const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
      state[`errorOn${uppercaseMethod}`] = null
    }
  }
}
