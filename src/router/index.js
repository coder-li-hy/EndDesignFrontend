import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        // 当打开页面访问到的是/这个路径时将其重定向到/dept路径
        // 即默认访问部门管理页面
        path: '/',
        redirect: '/login',
    },
    {
        // 方式一：这里表示要访问HomeView这个组件
        path: '/products',
        name: 'products',
        component: () => import( '@/views/SysViews/ProductView.vue')
    },
    {
        path: '/login',
        name: 'login',
        component: () => import ('@/views/SysViews/LoginView.vue')
    },
    {
        path: '/mine',
        name: 'mine',
        component: () => import('@/views/SysViews/MyDetailView.vue')
    },
    {
        path: '/myproducts',
        name: 'myproducts',
        component: () => import('@/views/SysViews/MyProductsView.vue')
    },
    {
        path: '/aboutus',
        name: 'aboutus',
        component: () => import('@/views/SysViews/AboutUs.vue')
    },
    {
        path: '/helpus',
        name: 'helpus',
        component: () => import('@/views/SysViews/helpUs.vue')
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/SysViews/ProfileView.vue')
    }
    // {
    //   //方式二：
    //   path: '/dept',
    //   name: 'dept',
    //   // 直接访问组件AboutView
    //   component: () => import( '../views/ElementView/ElementView.vue')
    // }
]

const router = new VueRouter({
    routes
})

export default router
