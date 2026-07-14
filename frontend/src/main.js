import { createApp } from 'vue'
import App from './app/App.vue'
import { router } from './app/router.js'
import './app/styles.css'

createApp(App).use(router).mount('#app')
