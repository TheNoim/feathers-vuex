import { createApp } from 'vue'
import App from './App.vue'
import { store } from './store'
import { FeathersVuex } from '../src'

await store.dispatch('auth/authenticate').catch(console.error)

createApp(App).use(store).use(FeathersVuex).mount('#app')
