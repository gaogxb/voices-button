import { createApp } from 'vue'
import App from './App.vue'
import i18n from '@/assets/script/i18n'
import router from '@/router'
import { analytics } from '@/assets/script/analytics'
import '@/assets/style/transition.styl'
import '@/assets/style/animation.styl'

// 初始化 Google Analytics
analytics.init()

createApp(App).use(router).use(i18n).mount('#app')
