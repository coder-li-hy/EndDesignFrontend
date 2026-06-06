<template>
  <div class="notification-page">
    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部" clearable @change="handleFilter">
            <el-option label="系统通知" value="SYSTEM"/>
            <el-option label="课程通知" value="COURSE"/>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="filters.unreadOnly" @change="handleFilter">只看未读</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="el-icon-refresh" @click="fetchNotifications">刷新</el-button>
          <el-button v-if="hasUnread" type="success" icon="el-icon-check" @click="markAllRead">
            全部已读
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>



    <!-- 通知列表 -->
    <el-card class="list-card" shadow="never">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated/>
      </div>

      <el-empty v-else-if="notifications.length === 0" description="暂无通知"/>

      <div v-else>
        <div
            v-for="item in notifications"
            :key="item.notify_id"
            class="notification-item"
            :class="{ 'unread': !item.is_read }"
            @click="handleClick(item)"
        >
          <div class="item-header">
            <el-tag size="mini" :type="item.type === 'SYSTEM' ? 'danger' : 'warning'">
              {{ item.type === 'SYSTEM' ? '系统' : '课程' }}
            </el-tag>
            <span class="item-title">{{ item.title }}</span>
            <span v-if="!item.is_read" class="unread-dot">●</span>
          </div>

          <div class="item-meta">
            <span class="publisher">{{ item.publisher_name || '系统' }}</span>
            <span class="time">{{ formatTime(item.publish_time) }}</span>
<!--            <span v-if="item.course_id && item.course_id !== 0" class="course-tag">-->
<!--              [课程#{{ item.course_id }}]-->
<!--            </span>-->
          </div>

          <div class="item-content" v-html="truncateContent(item.content)"/>
        </div>

        <!-- 分页 -->
        <el-pagination
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            :current-page="pagination.page"
            :page-sizes="[10, 20, 50]"
            :page-size="pagination.size"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"/>
      </div>
    </el-card>

    <!-- 通知详情弹窗（点击时展示完整内容） -->
    <el-dialog
        title="通知详情"
        :visible.sync="detailVisible"
        width="600px"
        :close-on-click-modal="false">
      <div v-if="currentDetail" class="detail-content">
        <div class="detail-header">
          <h3>{{ currentDetail.title }}</h3>
          <div class="detail-meta">
            <el-tag size="mini" :type="currentDetail.type === 'SYSTEM' ? 'danger' : 'warning'">
              {{ currentDetail.type === 'SYSTEM' ? '系统通知' : '课程通知' }}
            </el-tag>
            <span>发布：{{ currentDetail.publisher_name }}</span>
            <span>时间：{{ formatTime(currentDetail.publish_time) }}</span>
          </div>
        </div>
        <div class="detail-body" v-html="currentDetail.content"/>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button v-if="currentDetail && !currentDetail.is_read"
                   type="primary" @click="markSingleRead(currentDetail.notify_id)">
          标记为已读
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'NotificationList',

  data() {
    return {
      loading: false,
      notifications: [],
      pagination: { page: 1, size: 10, total: 0 },
      filters: { type: '', courseId: '', unreadOnly: false },
      myCourses: [], // 当前用户选的课程列表
      hasUnread: false,

      detailVisible: false,
      currentDetail: null
    }
  },

  computed: {
    // 判断是否为学生/教师（用于显示课程筛选）
    isStudentOrTeacher() {
      const role = JSON.parse(sessionStorage.getItem('userInfo'))?.role
      return role === 'STUDENT' || role === 'TEACHER'
    }
  },

  created() {
    this.fetchNotifications()
    this.fetchUnreadCount()


  },

  methods: {
    // 获取通知列表
    async fetchNotifications() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          size: this.pagination.size,
          ...this.filters
        }
        // 过滤空值
        Object.keys(params).forEach(k => !params[k] && params[k] !== 0 && delete params[k])

        const { data } = await axios.get('/api/notifications/my', { params })
        if (data.code === 1) {
          this.notifications = data.data.records || []
          this.pagination.total = data.data.total || 0
        }
      } catch (err) {
        this.$message.error('加载通知失败')
        console.error(err)
      } finally {
        this.loading = false
      }
    },

    // 获取未读数量（更新红点）
    async fetchUnreadCount() {
      try {
        const { data } = await axios.get('/api/notifications/unread-count')
        this.hasUnread = data.code === 1 && data.data > 0
        // 通知主布局更新红点（事件总线或 Vuex）
        this.$emit('unread-count-change', data.data || 0)
      } catch (e) { console.error(e) }
    },

    // 获取我的课程（用于筛选）
    async fetchMyCourses() {
      try {
        const { data } = await axios.get('/api/courses/my') // 需你实现该接口
        if (data.code === 200) {
          this.myCourses = data.data || []
        }
      } catch (e) { console.error(e) }
    },

    // 筛选条件变化时重置页码并刷新
    handleFilter() {
      this.pagination.page = 1
      this.fetchNotifications()
    },

    // 分页处理
    handlePageChange(page) {
      this.pagination.page = page
      this.fetchNotifications()
    },
    handleSizeChange(size) {
      this.pagination.size = size
      this.pagination.page = 1
      this.fetchNotifications()
    },

    // 标记单条已读
    async markSingleRead(notifyId) {
      try {
        await axios.post(`/api/notifications/${notifyId}/read`)
        // 本地更新 + 重新拉取未读数
        const item = this.notifications.find(n => n.notify_id === notifyId)
        if (item) {
          item.is_read = true
          item.read_time = new Date().toISOString()
        }
        if (this.currentDetail?.notify_id === notifyId) {
          this.currentDetail.is_read = true
        }
        this.fetchUnreadCount()
        this.$message.success('已标记为已读')
      } catch (e) {
        this.$message.error('操作失败')
      }
    },

    // 批量标记全部已读（当前筛选条件下）
    async markAllRead() {
      this.$confirm('确定将当前列表的通知全部标记为已读？', '提示', { type: 'warning' })
          .then(async () => {
            try {
              // 方案1：逐条调用（简单）
              const unreadIds = this.notifications.filter(n => !n.is_read).map(n => n.notify_id)
              for (const id of unreadIds) {
                await axios.post(`/api/notifications/${id}/read`)
              }
              // 刷新
              this.fetchNotifications()
              this.fetchUnreadCount()
              this.$message.success('全部标记成功')
            } catch (e) {
              this.$message.error('批量操作失败')
            }
          })
    },

    // 点击通知项：打开详情 + 自动标记已读
    handleClick(item) {
      this.currentDetail = { ...item }
      this.detailVisible = true

      // 如果未读，自动标记（提升体验）
      if (!item.is_read) {
        this.markSingleRead(item.notify_id) // 静默执行，不弹提示
      }
    },

    // 内容截断（列表页展示）
    truncateContent(content, len = 120) {
      if (!content) return ''
      // 去除 HTML 标签后截断
      const text = content.replace(/<[^>]+>/g, '')
      return text.length > len ? text.slice(0, len) + '...' : text
    },

    // 时间格式化
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = (now - date) / 1000 // 秒

      if (diff < 60) return '刚刚'
      if (diff < 3600) return `${Math.floor(diff/60)}分钟前`
      if (diff < 86400) return `${Math.floor(diff/3600)}小时前`
      return date.toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.notification-page {
  padding: 0;
}

.filter-card {
  margin-bottom: 16px;
}

.list-card {
  min-height: 400px;
}

.loading {
  padding: 20px;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f9fafc;
}

.notification-item.unread {
  background: #f0f9ff;
  border-left: 3px solid #409EFF;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.item-title {
  font-weight: 500;
  font-size: 15px;
  color: #303133;
  flex: 1;
}

.unread-dot {
  color: #F56C6C;
  font-size: 12px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

.item-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  gap: 12px;
}

.course-tag {
  color: #606266;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.item-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  /* 限制3行 + 省略 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pagination {
  margin-top: 20px;
  justify-content: center;
}

/* 详情弹窗 */
.detail-header h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.detail-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.detail-body {
  line-height: 1.8;
  color: #303133;
  /* 支持富文本样式 */
  :deep(p) { margin: 8px 0; }
  :deep(img) { max-width: 100%; border-radius: 4px; }
}
</style>