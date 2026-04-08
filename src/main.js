import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import router from "./router";

Vue.use(ElementUI);
new Vue({
    // 已经导入路由并且生效
    router,
    render: h => h(App)
}).$mount('#app')
