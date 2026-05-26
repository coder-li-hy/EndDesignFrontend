<!-- src/views/layout/MainLayout.vue -->
<template>
  <el-container class="main-layout">

    <!-- 左侧侧边栏 -->
    <el-aside width="200px" class="sidebar">
      <SideMenu/>
    </el-aside>

    <!-- 右侧主体 -->
    <el-container>

      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 🔔 通知图标（独立红点，更醒目） -->
          <el-badge
              :value="unreadCount"
              :hidden="unreadCount === 0"
              :max="99"
              class="notice-icon-wrapper"
              type="danger"
              @click.native="goToNotifications">
            <i class="el-icon-bell notice-icon" :class="{ 'pulse': hasNewUnread }"/>
          </el-badge>

          <!-- 用户下拉 -->
          <el-dropdown @command="handleCommand" trigger="click" class="user-dropdown">
            <span class="user-wrapper">
              <el-avatar :size="32" :src="userAvatar"/>
              <span class="username">{{ userInfo.username }}</span>
              <el-tag size="mini" :type="roleTagType" class="role-tag">{{ roleText }}</el-tag>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="profile">
                <i class="el-icon-user"></i> 个人中心
              </el-dropdown-item>
              <el-dropdown-item command="notifications" divided>
                <i class="el-icon-message"></i> 我的通知
                <el-badge :value="unreadCount" :hidden="unreadCount === 0"
                          class="menu-badge" type="danger"/>
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <i class="el-icon-switch-button"></i> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view :key="$route.fullPath"/>
      </el-main>

    </el-container>

    <!-- AI 助手（保留原功能） -->
    <AiAssistant/>
  </el-container>
</template>

<script>
import SideMenu from '@/views/SysViews/SideMenu'
import AiAssistant from '@/views/SysViews/AiAssistant.vue'
import Vue from "vue";

// 🔁 事件总线（Vue2 简单方案，也可用 Vuex）
const EventBus = new Vue()

export default {
  components: { AiAssistant, SideMenu },

  data() {
    return {
      userInfo: JSON.parse(sessionStorage.getItem('userInfo')) || {},
      unreadCount: 0,          // 🔴 未读通知数
      hasNewUnread: false,     // ✨ 是否有"新到达"的未读（用于闪烁动画）
      pollTimer: null,         // ⏱ 轮询定时器
      lastUnreadCount: 0       // 📊 用于检测变化
    }
  },

  computed: {
    currentTitle() {
      return this.$route.meta?.title || '首页'
    },
    roleText() {
      const map = { 'ADMIN': '管理员', 'TEACHER': '教师', 'STUDENT': '学生' }
      return map[this.userInfo.role] || this.userInfo.role
    },
    roleTagType() {
      const map = { 'ADMIN': 'danger', 'TEACHER': 'warning', 'STUDENT': 'success' }
      return map[this.userInfo.role] || 'info'
    },
    userAvatar() {
      // 可根据 userInfo.avatar 动态设置，此处用默认
      return 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },

  created() {
    // 🔄 初始化加载未读数
    this.fetchUnreadCount()

    // ⏱ 每 60 秒轮询一次未读数（实时性要求不高时）
    this.startPolling()

    // 📡 监听子页面发出的"未读数变化"事件（如通知页标记已读后）
    EventBus.$on('unread-count-change', this.handleUnreadUpdate)

    // 📡 监听 WebSocket 推送（如果后端支持）
    // this.initWebSocket()
  },

  beforeDestroy() {
    // 🧹 清理
    this.stopPolling()
    EventBus.$off('unread-count-change', this.handleUnreadUpdate)
  },

  methods: {
    // 🔔 获取未读数量
    async fetchUnreadCount() {
      try {
        const { data } = await this.axios.get('/api/notifications/unread-count')
        if (data.code === 200) {
          const newCount = data.data || 0
          this.updateUnreadCount(newCount)
        }
      } catch (err) {
        console.error('获取未读数失败:', err)
      }
    },

    // 🔄 更新未读数（含新消息检测）
    updateUnreadCount(newCount) {
      // ✨ 检测是否有"新到达"的未读消息（数量增加）
      if (newCount > this.lastUnreadCount && newCount > 0) {
        this.hasNewUnread = true
        // 3 秒后取消闪烁
        setTimeout(() => { this.hasNewUnread = false }, 3000)
        // 💡 可选：播放提示音 / 浏览器通知
        // this.playNotifySound()
      }
      this.unreadCount = newCount
      this.lastUnreadCount = newCount
    },

    // 📡 处理子页面事件更新（如通知页标记已读后通知主布局）
    handleUnreadUpdate(newCount) {
      this.updateUnreadCount(newCount)
    },

    // ⏱ 开始轮询
    startPolling() {
      this.pollTimer = setInterval(() => {
        // 用户活跃时才轮询（避免后台浪费）
        if (document.visibilityState === 'visible') {
          this.fetchUnreadCount()
        }
      }, 60000) // 60 秒
    },

    // ⏹ 停止轮询
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },

    // 🔗 跳转到通知页
    goToNotifications() {
      this.$router.push('/notifications')
    },

    // 🎛 下拉菜单命令处理
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/profile')
          break
        case 'notifications':
          this.goToNotifications()
          break
        case 'logout':
          this.handleLogout()
          break
      }
    },

    // 🚪 退出登录
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
          this.stopPolling() // 🧹 清理定时器
          this.$message.success('退出成功')
          await this.$router.replace('/login')
        }
      })
    },

    // 🔊 播放提示音（可选，需浏览器授权）
    playNotifySound() {
      // 简单方案：使用 HTML5 Audio
      const audio = new Audio('/sounds/notify.mp3') // 需准备音频文件
      audio.play().catch(e => console.log('音频播放受限:', e))
    },

    // 🌐 初始化 WebSocket（可选，实时推送方案）
    // initWebSocket() {
    //   const ws = new WebSocket(`ws://${process.env.VUE_APP_WS_HOST}/ws/notifications`)
    //   ws.onmessage = (event) => {
    //     const data = JSON.parse(event.data)
    //     if (data.type === 'NEW_NOTIFICATION') {
    //       this.updateUnreadCount(this.unreadCount + 1)
    //       this.$notify.info({ title: '新通知', message: data.title, duration: 4000 })
    //     }
    //   }
    // }
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
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px; /* 🔔 通知图标与用户下拉的间距 */
}

/* 🔔 通知图标样式 */
.notice-icon-wrapper {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
  display: flex;
  align-items: center;
}

.notice-icon-wrapper:hover {
  background: #f5f7fa;
}

.notice-icon {
  font-size: 20px;
  color: #606266;
  transition: color 0.2s;
}

.notice-icon-wrapper:hover .notice-icon {
  color: #409EFF;
}

/* ✨ 新消息闪烁动画 */
.notice-icon.pulse {
  animation: bell-pulse 1s ease-in-out 3; /* 闪烁 3 次 */
}

@keyframes bell-pulse {
  0%, 100% { transform: scale(1); color: #606266; }
  50% { transform: scale(1.2); color: #F56C6C; }
}

/* 👤 用户区域 */
.user-dropdown {
  margin-left: 8px;
}

.user-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 10px;
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
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  margin-left: 4px;
  transform: scale(0.9);
}

/* 📋 下拉菜单内红点 */
.menu-badge {
  margin-left: 8px;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

/* 响应式：小屏幕隐藏用户名，只显示头像+红点 */
@media (max-width: 768px) {
  .username, .role-tag {
    display: none;
  }
  .header-right {
    gap: 8px;
  }
}
</style>