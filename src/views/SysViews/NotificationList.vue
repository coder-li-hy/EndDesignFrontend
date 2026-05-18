<template>
  <div class="notification-list">

    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">🔔 我的通知</h2>
        <p class="page-subtitle">系统消息与课程通知，重要信息不错过</p>
      </div>
      <div class="header-actions">
        <el-tag size="mini" effect="dark" type="primary" class="count-tag">
          📬 共 {{ total }} 条
        </el-tag>
        <el-button
            size="small"
            icon="el-icon-refresh"
            @click="fetchNotifications"
            :loading="loading"
            class="refresh-btn"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 通知筛选 -->
    <el-card class="filter-card" shadow="hover" v-if="notifyList.length > 0">
      <el-form :inline="true" size="small">
        <el-form-item label="类型">
          <el-select v-model="filterType" placeholder="全部" clearable @change="fetchNotifications" style="width: 120px">
            <el-option label="🔴 系统通知" value="SYSTEM"/>
            <el-option label="🔵 课程通知" value="COURSE"/>
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <div class="notify-wrapper" v-loading="loading">

      <el-card
          class="notify-card"
          shadow="hover"
          v-for="notify in notifyList"
          :key="notify.notifyId"
          @click="viewDetail(notify)"
      >
        <!-- 卡片头部 -->
        <div class="notify-header">
          <div class="notify-type">
            <el-tag
                size="mini"
                :type="notify.type === 'SYSTEM' ? 'danger' : 'primary'"
                :effect="notify.type === 'SYSTEM' ? 'dark' : 'light'"
                class="type-tag"
            >
              {{ notify.type === 'SYSTEM' ? '🔴 系统' : '🔵 课程' }}
            </el-tag>
          </div>
          <div class="notify-time">
            <i class="el-icon-time"></i>
            {{ formatDateTime(notify.publishTime) }}
          </div>
        </div>

        <!-- 通知标题 -->
        <h3 class="notify-title">{{ notify.title }}</h3>

        <!-- 通知内容（截断显示） -->
        <div class="notify-content">
          {{ notify.content }}
        </div>

        <!-- 课程名称（如果有） -->
        <div v-if="notify.courseName" class="notify-course">
          <i class="el-icon-s-order"></i>
          <span>相关课程：</span>
          <el-tag size="mini" effect="plain">{{ notify.courseName }}</el-tag>
        </div>

        <!-- 卡片底部：查看详情 -->
        <div class="notify-footer">
          <el-button
              size="mini"
              type="text"
              class="action-detail"
              @click.stop="viewDetail(notify)"
          >
            查看详情 <i class="el-icon-arrow-right"></i>
          </el-button>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty
          v-if="notifyList.length === 0 && !loading"
          :image-size="150"
          description="🎉 暂无新通知，好好享受学习时光～"
          class="empty-state"
      >
        <el-button type="primary" @click="fetchNotifications" icon="el-icon-refresh">
          刷新列表
        </el-button>
      </el-empty>

    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > size">
      <el-pagination
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          :current-page="page"
          :page-size="size"
          :total="total"
          layout="total, prev, pager, next, jumper"
          background
          :pager-count="5"
      />
    </div>

    <!-- 通知详情弹窗 -->
    <el-dialog
        title="📋 通知详情"
        :visible.sync="detailDialogVisible"
        width="520px"
        :close-on-click-modal="false"
        class="dialog-custom"
        @closed="onDetailClose"
    >
      <div v-if="currentNotify" class="detail-wrapper">
        <!-- 头部信息 -->
        <div class="detail-header">
          <el-tag
              size="medium"
              :type="currentNotify.type === 'SYSTEM' ? 'danger' : 'primary'"
              :effect="currentNotify.type === 'SYSTEM' ? 'dark' : 'light'"
              class="detail-type-tag"
          >
            {{ currentNotify.type === 'SYSTEM' ? '🔴 系统通知' : '🔵 课程通知' }}
          </el-tag>
          <span class="detail-time">
            <i class="el-icon-time"></i>
            {{ formatDateTime(currentNotify.publishTime) }}
          </span>
        </div>

        <!-- 标题 -->
        <h3 class="detail-title">{{ currentNotify.title }}</h3>

        <!-- 内容区域 -->
        <div class="detail-content" v-html="formatContent(currentNotify.content)"></div>

        <!-- 相关课程 -->
        <div v-if="currentNotify.courseName" class="detail-course">
          <i class="el-icon-s-order"></i>
          <strong>相关课程：</strong>
          <el-tag size="mini" effect="dark" type="primary">{{ currentNotify.courseName }}</el-tag>
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

      // 筛选条件
      filterType: '',

      // 详情弹窗
      detailDialogVisible: false,
      currentNotify: null
    }
  },

  created() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.userId = userInfo.userId
    this.role = userInfo.role

    if (this.userId) {
      this.fetchNotifications()
    }
  },

  methods: {
    // 获取通知列表
    async fetchNotifications() {
      if (!this.userId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/notifications/my', {
          params: {
            userId: this.userId,
            role: this.role,
            type: this.filterType || undefined,
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

    // 分页处理
    handlePageChange(p) { this.page = p; this.fetchNotifications() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchNotifications() },

    // 格式化时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')
      return isToday ? `今天 ${h}:${m}` : `${date.getMonth()+1}-${date.getDate()} ${h}:${m}`
    },

    // 格式化内容（支持简单换行 + 防 XSS）
    formatContent(content) {
      if (!content) return ''
      return content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>')
    },

    // 查看详情
    viewDetail(notify) {
      this.currentNotify = { ...notify }
      this.detailDialogVisible = true
    },

    // 详情弹窗关闭回调
    onDetailClose() {
      this.currentNotify = null
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.notification-list {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 20px;
  padding: 0 10px;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.count-tag {
  font-size: 13px;
}

.refresh-btn {
  padding: 8px 16px;
}

/* ========== 筛选卡片 ========== */
.filter-card {
  margin: 0 20px 16px 20px;
  border-radius: 12px;
}

/* ========== 通知列表包装器 ========== */
.notify-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px 20px;
}

/* ========== 通知卡片 ========== */
.notify-card {
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.notify-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

/* 卡片头部 */
.notify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ebeef5;
}

.type-tag {
  font-size: 11px;
  padding: 2px 8px;
}

.notify-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notify-time i {
  font-size: 11px;
}

/* 通知标题 */
.notify-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

/* 通知内容 */
.notify-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 相关课程 */
.notify-course {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.notify-course i {
  font-size: 12px;
}

/* 卡片底部操作 */
.notify-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}

.action-detail {
  color: #909399;
  font-size: 12px;
  padding: 4px 8px;
}

.action-detail:hover {
  color: #409eff;
  font-weight: 500;
}

.action-detail i {
  margin-left: 2px;
  font-size: 11px;
  transition: transform 0.2s;
}

.action-detail:hover i {
  transform: translateX(2px);
}

/* ========== 空状态 ========== */
.empty-state {
  padding: 60px 0;
}

.empty-state ::v-deep .el-empty__description {
  font-size: 14px;
  color: #909399;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 20px;
}

/* ========== 详情弹窗 ========== */
.dialog-custom ::v-deep .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-custom ::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  margin: 0;
}

.dialog-custom ::v-deep .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn {
  top: 16px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: white;
}

.dialog-custom ::v-deep .el-dialog__body {
  padding: 20px 24px;
  background: #fff;
}

.dialog-custom ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #ebeef5;
}

.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.detail-type-tag {
  font-size: 12px;
  padding: 6px 12px;
}

.detail-time {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  line-height: 1.4;
}

.detail-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-course {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  padding: 10px 14px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .filter-card {
    margin: 0 10px 16px 10px;
  }

  .notify-wrapper {
    padding: 0 10px 20px;
  }

  .notify-card {
    border-radius: 10px;
  }

  .notify-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .notify-footer {
    justify-content: flex-start;
  }

  .pagination-wrapper {
    padding: 0 10px 20px;
  }
}

/* ========== Element UI 深度定制 ========== */
.el-card {
  border-radius: 12px;
  border: none;
}

.el-card ::v-deep .el-card__body {
  padding: 16px;
}

.el-tag {
  border-radius: 12px;
}

.el-input >>> .el-input__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  height: 36px;
  font-size: 13px;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.el-select >>> .el-input__inner {
  border-radius: 8px;
  height: 36px;
}

.el-message {
  z-index: 9999 !important;
}

/* 全局滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>