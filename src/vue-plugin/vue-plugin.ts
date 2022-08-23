/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import FeathersVuexFind from '../FeathersVuexFind'
import FeathersVuexGet from '../FeathersVuexGet'
import FeathersVuexFormWrapper from '../FeathersVuexFormWrapper'
import FeathersVuexInputWrapper from '../FeathersVuexInputWrapper'
import FeathersVuexPagination from '../FeathersVuexPagination'
import FeathersVuexCount from '../FeathersVuexCount'
import { globalModels } from '../service-module/global-models'
import type { GlobalModels } from '../service-module/types'
import { isVue3 } from 'vue-demi'
import type { Plugin } from 'vue-demi'

// Augment global models onto VueConstructor and instance
declare module 'vue' {
  interface VueConstructor {
    $FeathersVuex: GlobalModels
  }
  interface Vue {
    $FeathersVuex: GlobalModels
  }
  interface ComponentCustomProperties {
    $FeathersVuex: GlobalModels
  }
}

export const FeathersVuex = {
  install(Vue, options = { components: true }) {
    if (isVue3) {
      Vue.config.globalProperties.$FeathersVuex = globalModels
    } else {
      // @ts-ignore
      Vue.$FeathersVuex = globalModels
      // @ts-ignore
      Vue.prototype.$FeathersVuex = globalModels
    }

    const shouldSetupComponents = options.components !== false

    if (shouldSetupComponents) {
      Vue.component('FeathersVuexFind', FeathersVuexFind)
      Vue.component('FeathersVuexGet', FeathersVuexGet)
      Vue.component('FeathersVuexFormWrapper', FeathersVuexFormWrapper)
      Vue.component('FeathersVuexInputWrapper', FeathersVuexInputWrapper)
      Vue.component('FeathersVuexPagination', FeathersVuexPagination)
      Vue.component('FeathersVuexCount', FeathersVuexCount)
    }
  }
} as Plugin
