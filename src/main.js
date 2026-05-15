import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import router from "./router";
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css' // 引入主题样式

Vue.use(ElementUI);
new Vue({
    // 已经导入路由并且生效
    router,
    render: h => h(App)
}).$mount('#app')

// 注册全局指令 v-highlight
Vue.directive('highlight', {
    bind(el) {
        // 获取代码内容
        const code = el.textContent || el.innerText

        // 执行高亮
        el.innerHTML = hljs.highlightAuto(code).value

        // 添加样式类
        el.classList.add('hljs')
        el.style.whiteSpace = 'pre-wrap' // 保留换行
        el.style.wordBreak = 'break-all' // 防止长行溢出
    },
    update(el) {
        // 内容变化时重新高亮
        const code = el.textContent || el.innerText
        el.innerHTML = hljs.highlightAuto(code).value
    }
})