<!-- components/SideMenu.vue -->
<template>
  <el-menu
      :default-active="activeMenu"
      class="side-menu"
      background-color="#545c64"
      text-color="#fff"
      active-text-color="#ffd04b"
      :router="true"
  >
    <template v-for="menu in menuList">
      <el-menu-item
          :key="menu.path"
          :index="menu.path"
      >
        <i :class="menu.icon"></i>
        <span slot="title">{{ menu.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script>
export default {
  computed: {
    activeMenu() {
      return this.$route.path
    },

    // 根据角色返回不同的菜单列表
    menuList() {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
      const role = userInfo.role

      const menus = {
        'ADMIN': [
          { path: '/admin/users', title: '用户管理', icon: 'el-icon-user-solid' },
          { path: '/admin/audit', title: '内容审核', icon: 'el-icon-s-check' },
          { path: '/admin/config', title: '系统配置', icon: 'el-icon-s-operation' },
          { path: '/admin/sendSys', title: '发送通知', icon: 'el-icon-bell' },
        ],
        'TEACHER': [
          { path: '/teacher/courses', title: '我的课程', icon: 'el-icon-reading' },
          // { path: '/teacher/assignments', title: '作业管理', icon: 'el-icon-document-copy' },
          // { path: '/teacher/resources', title: '课程资源', icon: 'el-icon-folder-opened' },
          // { path: '/teacher/progress', title: '资源管理', icon: 'el-icon-data-analysis' },
          // { path: '/teacher/courseQA', title: '课程问答', icon: 'el-icon-chat-dot-round' },
        ],
        'STUDENT': [
          { path: '/student/courses', title: '我的课程', icon: 'el-icon-reading' },
          { path: '/student/market', title: '选课超市', icon: 'el-icon-shop' },
          // { path: '/student/submit', title: '作业提交', icon: 'el-icon-upload' },
          // { path: '/student/courseQA', title: '课程问答', icon: 'el-icon-chat-dot-round' },
        ]
      }

      return menus[role] || []
    }
  }
}
</script>