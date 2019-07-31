// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'bootstrap-css-only/css/bootstrap.min.css'
import '../build/css/mdb.css'
import Vue from 'vue'
import Vuex from 'vuex'
import App from './App'
import router from './router'
import Vue2TouchEvents from 'vue2-touch-events'
import store from './store/index'
import VueSocketIO from 'vue-socket.io'
import VShowSlide from 'v-show-slide'
import Vuedraggable from 'vuedraggable'
import Vuebar from 'vuebar'
import VueCookies from 'vue-cookies'
import Notifications from 'vue-notification'
Vue.use(Notifications)
Vue.use(Vuex)

Vue.use(VShowSlide)
Vue.use(Vuedraggable)
Vue.use(Vuebar)

Vue.use(VueCookies)
// set default config
VueCookies.config('1d')

// set global cookie
VueCookies.set('theme', 'default')
VueCookies.set('hover-time', '1s')

Vue.use(
  new VueSocketIO({
    debug: true,
    connection: 'http://localhost:9092',
    vuex: {
      store,
      actionPrefix: 'SOCKET_',
      mutationPrefix: 'SOCKET_'
    }
  })
)
Vue.use(Vue2TouchEvents)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
