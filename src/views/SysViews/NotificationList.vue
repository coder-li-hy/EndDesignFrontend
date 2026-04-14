<template>
  <div class="notification-list">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">我的通知</h2>
      <el-tag size="mini" type="info">共 {{ total }} 条</el-tag>
    </div>

    <!-- 通知列表 -->
    <el-card class="notify-card" shadow="never" v-for="notify in notifyList" :key="notify.notifyId">
      <div class="notify-header">
        <div class="notify-meta">
          <el-tag size="mini" :type="notify.type === 'SYSTEM' ? 'danger' : 'primary'">
            {{ notify.type === 'SYSTEM' ? '系统通知' : '课程通知' }}
          </el-tag>
          <span class="notify-time">{{ formatDateTime(notify.publishTime) }}</span>
        </div>
      </div>

      <h3 class="notify-title" @click="viewDetail(notify)">{{ notify.title }}</h3>

      <div class="notify-content" @click="viewDetail(notify)">
        {{ notify.content }}
      </div>

      <!-- 课程通知显示课程名称 -->
      <div v-if="notify.courseName" class="notify-course">
        <i class="el-icon-s-order"></i> 相关课程：{{ notify.courseName }}
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="notifyList.length === 0" description="暂无通知" />

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          :current-page="page"
          :page-size="size"
          :total="total"
          layout="total, prev, pager, next"
          background
      />
    </div>

    <!-- 通知详情弹窗 -->
    <el-dialog
        title="通知详情"
        :visible.sync="detailDialogVisible"
        width="500px"
        :close-on-click-modal="false"
    >
      <div v-if="currentNotify">
        <div class="detail-meta">
          <el-tag size="mini" :type="currentNotify.type === 'SYSTEM' ? 'danger' : 'primary'">
            {{ currentNotify.type === 'SYSTEM' ? '系统通知' : '课程通知' }}
          </el-tag>
          <span style="margin-left: 10px; color: #909399">
            {{ formatDateTime(currentNotify.publishTime) }}
          </span>
        </div>
        <h3 style="margin: 12px 0">{{ currentNotify.title }}</h3>
        <div class="detail-content" v-html="currentNotify.content"></div>
        <div v-if="currentNotify.courseName" class="detail-course">
          <strong>相关课程：</strong>{{ currentNotify.courseName }}
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'NotificationList',

  data() {
    return {
      userId: null,
      role: null,

      page: 1,
      size: 10,
      total: 0,
      notifyList: [],
      loading: false,

      // 详情弹窗
      detailDialogVisible: false,
      currentNotify: null
    }
  },

  created() {
    // 获取当前用户信息
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.userId = userInfo.userId
    this.role = userInfo.role

    if (this.userId) {
      this.fetchNotifications()
    }
  },

  methods: {
    async fetchNotifications() {
      if (!this.userId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/notifications/my', {
          params: {
            userId: this.userId,
            role: this.role,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.notifyList = resp.data.data.list || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch notifications error:', e)
        this.$message.error('加载通知列表失败')
      } finally {
        this.loading = false
      }
    },

    handlePageChange(p) { this.page = p; this.fetchNotifications() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchNotifications() },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime
    },

    viewDetail(notify) {
      this.currentNotify = notify
      this.detailDialogVisible = true
    }
  }
}
</script>

<style scoped>
.notification-list {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  margin: 20px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.notify-card {
  margin: 0 20px 20px 20px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.notify-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.notify-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.notify-time {
  color: #909399;
}

.notify-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  cursor: pointer;
}

.notify-title:hover {
  color: #667eea;
}

.notify-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}

.notify-course {
  font-size: 13px;
  color: #909399;
}

.pagination-wrapper {
  margin: 0 20px 20px 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情弹窗样式 */
.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
}

.detail-course {
  margin-top: 12px;
  font-size: 13px;
  color: #909399;
}

/* Element UI 定制 */
.el-empty {
  margin: 40px 0;
}
</style>