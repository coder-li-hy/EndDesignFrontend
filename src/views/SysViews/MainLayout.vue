<!-- src/views/layout/MainLayout.vue -->
<template>
  <el-container class="main-layout">

    <!-- 左侧侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <SideMenu/>  <!-- 你已完成的动态菜单组件 -->
    </el-aside>

    <!-- 右侧主体 -->
    <el-container>

      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <!-- 面包屑导航（可选） -->
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 用户信息 + 退出 -->
          <el-dropdown @command="handleCommand" trigger="click">
            <span class="user-wrapper">
              <el-avatar :size="32" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"/>
              <span class="username">{{ userInfo.username }}</span>
              <el-tag size="mini" :type="roleTagType" class="role-tag">{{ roleText }}</el-tag>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i> 个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <i class="el-icon-switch-button"></i> 退出登录
              </el-dropdown-item>
              <!-- ⭐ 新增：我的通知 -->
              <el-dropdown-item command="notifications">
                <i class="el-icon-bell"></i> 我的通知
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 - 路由出口 -->
      <el-main class="main-content">
        <!-- ⭐ 核心：所有子页面在这里渲染 -->
        <router-view :key="$route.fullPath" />
      </el-main>

    </el-container>
  </el-container>
</template>

<script>
import SideMenu from '@/views/SysViews/SideMenu'

export default {
  components: { SideMenu },

  data() {
    return {
      userInfo: JSON.parse(sessionStorage.getItem('userInfo'))
    }
  },

  computed: {
    // 当前页面标题（从路由 meta 获取）
    currentTitle() {
      return this.$route.meta['title'] || '首页'
    },

    // 角色中文显示
    roleText() {
      const map = { 'ADMIN': '管理员', 'TEACHER': '教师', 'STUDENT': '学生' }
      return map[this.userInfo.role] || this.userInfo.role
    },

    // 角色标签颜色
    roleTagType() {
      const map = { 'ADMIN': 'danger', 'TEACHER': 'warning', 'STUDENT': 'success' }
      return map[this.userInfo.role] || 'info'
    }
  },

  methods: {
    handleCommand(command) {
      if (command === 'logout') {
        this.handleLogout()
      } else if (command === 'profile') {
        this.$router.push('/profile')
      }else if (command === 'notifications') {
        // ⭐ 跳转到通知页面
        this.$router.push('/notifications')
      }
    },

    async handleLogout() {
      this.$confirm('确定要退出登录吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await this.axios.post('/api/auth/logout')
        } catch (e) {
          console.error('Logout error:', e)
        } finally {
          sessionStorage.clear()
          this.$message.success('退出成功')
          await this.$router.replace('/login')
        }
      })
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: #545c64;
  color: #fff;
}

.header {
  background: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.2s;
}

.user-wrapper:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.role-tag {
  margin-left: 4px;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

/* 面包屑样式 */
.el-breadcrumb {
  font-size: 14px;
}
</style>
 src/views/SysViews/MainLayout.vue



<!--测试用MainLayout-->
<!--<template>-->
<!--  <el-container style="height: 100vh;">-->
<!--    <el-aside width="200px" style="background: #545c64; color: #fff;">-->
<!--      <div style="padding: 20px;">侧边栏</div>-->
<!--    </el-aside>-->
<!--    <el-container>-->
<!--      <el-header style="background: #fff; border-bottom: 1px solid #eee;">-->
<!--        顶部栏-->
<!--      </el-header>-->
<!--      <el-main style="background: #f5f7fa;">-->
<!--        &lt;!&ndash; ⭐ 核心出口 &ndash;&gt;-->
<!--        <router-view />-->
<!--      </el-main>-->
<!--    </el-container>-->
<!--  </el-container>-->
<!--</template>-->