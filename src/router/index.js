import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    // ========== 公开页面（无需登录） ==========
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/SysViews/LoginView.vue'),
        meta: { public: true }  // 标记为公开页面
    },

    // ========== 个人中心（所有登录用户） ==========
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/SysViews/ProfileView.vue'),
        meta: { requireLogin: true }  // 需要登录，不限制角色
    },

    // ========== 管理员菜单 ==========
    {
        path: '/admin',
        name: 'admin',
        component: () => import('@/views/SysViews/MainLayout.vue'),
        redirect: '/admin/users',  // 默认跳转到子路由
        meta: { requireLogin: true, role: 'ADMIN' },  // 只允许管理员
        children: [
            {
                path: 'users',
                name: 'admin-users',
                component: () => import('@/views/SysViews/Admin/UserManage.vue'),
                meta: { title: '用户管理' }
            },
            {
                path: 'audit',
                name: 'admin-audit',
                component: () => import('@/views/SysViews/Admin/ContentAudit.vue'),
                meta: { title: '内容审核' }
            },
            {
                path: 'config',
                name: 'admin-config',
                component: () => import('@/views/SysViews/Admin/SystemConfig.vue'),
                meta: { title: '系统配置' }
            }
        ]
    },

    // ========== 教师菜单 ==========
    {
        path: '/teacher',
        name: 'teacher',
        component: () => import('@/views/SysViews/MainLayout.vue'),
        redirect: '/teacher/courses',
        meta: { requireLogin: true, role: 'TEACHER' },  // 只允许教师
        children: [
            {
                path: 'courses',
                name: 'teacher-courses',
                component: () => import('@/views/SysViews/Teacher/CourseManage.vue'),
                meta: { title: '我的课程' }
            },
            {
                path: 'assignments',
                name: 'teacher-assignments',
                component: () => import('@/views/SysViews/Teacher/AssignmentManage.vue'),
                meta: { title: '作业管理' }
            },
            {
                path: 'resources',
                name: 'teacher-resources',
                component: () => import('@/views/SysViews/Teacher/ResourceManage.vue'),
                meta: { title: '资源管理' }
            },
            {
                path: 'progress',
                name: 'resource-progress',
                component: () => import('@/views/SysViews/Teacher/TeacherResourceProgress.vue'),
                meta: { title: '进度跟踪' }
            },
        ]
    },

    // ========== 学生菜单 ==========
    {
        path: '/student',
        name: 'student',
        redirect: '/student/courses',
        component: () => import('@/views/SysViews/MainLayout.vue'),
        meta: { requireLogin: true, role: 'STUDENT' },  // 只允许学生
        children: [
            {
                path: 'courses',
                name: 'student-courses',
                component: () => import('@/views/SysViews/Student/StudentCourse.vue'),
                meta: { title: '选课超市' }
            },
            {
                path: 'market',
                name: 'student-market',
                component: () => import('@/views/SysViews/Student/StudentCourseMarket.vue'),
                meta: { title: '选课超市' }
            },
            // {
            //     path: 'my-courses',
            //     name: 'student-my-courses',
            //     component: () => import('@/views/Student/MyCourses.vue'),
            //     meta: { title: '我的课程' }
            // }
        ]
    },

    // ========== 404 页面 ==========
    {
        path: '*',
        redirect: '/login'
    }
]

const router = new VueRouter({
    mode: 'history',  // 去掉 URL 中的 # 号（可选）
    routes
})

// ========== 最简单的路由守卫（只处理登录状态） ==========
router.beforeEach((to, from, next) => {
    // 1. 如果是公开页面（如登录页），直接放行
    if (to.meta['public']) {
        next()
        return
    }

    // 2. 如果需要登录，检查是否已登录（通过 sessionStorage 判断）
    if (to.meta['requireLogin']) {
        // 判断登录状态：你的后端用 Session，前端可以存一个标记
        const isLogin = sessionStorage.getItem('isLogin') === 'true'

        if (!isLogin) {
            // 未登录：提示 + 跳转登录页，并记录原路径
            alert('请先登录')  // 或用 Vue.prototype.$message.warning()
            next({
                path: '/login',
                query: { redirect: to.fullPath }  // 登录成功后跳回原页面
            })
            return
        }
    }

    // 3. 其他情况直接放行
    // ⚠️ 角色权限校验交给后端接口，前端不做拦截
    next()
})

export default router