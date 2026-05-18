<template>
  <div class="course-market">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 + 搜索 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-shopping-cart-full"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">选课超市</h2>
          <p class="page-subtitle">浏览可选课程，规划学习路径</p>
        </div>
      </div>

      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" size="small" class="search-form">
        <el-form-item>
          <el-input
              v-model="searchForm.courseName"
              placeholder="搜索课程名称..."
              clearable
              @keyup.enter.native="handleSearch"
              class="search-input"
              prefix-icon="el-icon-search"
          />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" @click="handleSearch" class="btn-search">
            <i class="el-icon-search"></i> 搜索
          </el-button>
          <el-button @click="handleReset" class="btn-reset">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 课程统计栏 -->
    <div class="course-stats" v-if="courseList.length > 0">
      <div class="stat-item">
        <span class="stat-value">{{ total }}</span>
        <span class="stat-label">总课程</span>
      </div>
      <div class="stat-item">
        <span class="stat-value available">{{ availableCount }}</span>
        <span class="stat-label">可选</span>
      </div>
      <div class="stat-item">
        <span class="stat-value full">{{ fullCount }}</span>
        <span class="stat-label">已满</span>
      </div>
      <div class="stat-item">
        <span class="stat-value selected">{{ selectedCount }}</span>
        <span class="stat-label">已选</span>
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="course-grid" v-loading="loading">
      <el-card
          class="course-card"
          shadow="hover"
          v-for="course in courseList"
          :key="course.courseId"
          :class="getCourseCardClass(course)"
      >
        <!-- 卡片顶部装饰条 -->
        <div class="card-decoration" :class="getCardDecorationClass(course)"></div>

        <div class="course-content">
          <!-- 课程标题区 -->
          <div class="course-header">
            <div class="header-main">
              <h3 class="course-name" :title="course?.courseName">
                {{ course?.courseName }}
              </h3>
              <el-tag
                  size="mini"
                  :type="course?.isFull ? 'danger' : 'success'"
                  effect="dark"
                  class="status-tag"
              >
                <i :class="course?.isFull ? 'el-icon-close' : 'el-icon-check'"></i>
                {{ course?.isFull ? '已满' : '可选' }}
              </el-tag>
            </div>

            <!-- 用户状态标签 -->
            <div class="user-status" v-if="course?.userStatus">
              <el-tag
                  size="mini"
                  :type="getUserStatusTagType(course.userStatus)"
                  effect="light"
                  class="user-status-tag"
              >
                <i :class="getUserStatusIcon(course.userStatus)"></i>
                {{ getUserStatusText(course.userStatus) }}
              </el-tag>
            </div>
          </div>

          <!-- 课程信息网格 -->
          <div class="course-info-grid">
            <div class="info-item">
              <i class="el-icon-user info-icon"></i>
              <span class="info-label">教师</span>
              <span class="info-value">{{ course?.teacherName || '-' }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-calendar info-icon"></i>
              <span class="info-label">时间</span>
              <span class="info-value">{{ formatCourseDate(course) }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-s-data info-icon"></i>
              <span class="info-label">学分</span>
              <span class="info-value credit">{{ course?.credits || '-' }}</span>
            </div>
            <div class="info-item">
              <i class="el-icon-s-order info-icon"></i>
              <span class="info-label">容量</span>
              <div class="capacity-info">
                <span class="info-value">
                  {{ course?.currentCount || 0 }}/{{ course?.maxCapacity || 0 }}
                </span>
                <el-progress
                    :percentage="getCapacityPercent(course)"
                    :show-text="false"
                    stroke-width="4"
                    class="capacity-progress"
                    :color="getCapacityProgressColor(course)"
                />
              </div>
            </div>
          </div>

          <!-- 课程状态提示 -->
          <el-alert
              v-if="showCourseAlert(course)"
              :title="getCourseAlertTitle(course)"
              :type="getCourseAlertType(course)"
              :closable="false"
              show-icon
              class="course-alert"
              effect="light"
          />

          <!-- 操作按钮区 -->
          <div class="course-actions">
            <el-button
                size="small"
                type="text"
                @click="viewCourseDetail(course)"
                class="action-btn detail"
            >
              <i class="el-icon-view"></i> 详情
            </el-button>

            <!-- 已选/排队状态 -->
            <el-tag
                v-if="course?.userStatus === 'SELECTED'"
                size="mini"
                type="success"
                effect="dark"
                class="action-tag"
            >
              <i class="el-icon-check"></i> 已选课
            </el-tag>
            <el-tag
                v-else-if="course?.userStatus === 'QUEUED'"
                size="mini"
                type="warning"
                effect="dark"
                class="action-tag"
            >
              <i class="el-icon-time"></i> 排队中
            </el-tag>

            <!-- 选课按钮 -->
            <el-button
                v-else
                size="small"
                :type="course?.isFull ? 'warning' : 'primary'"
                :loading="course?.selecting"
                @click="handleSelect(course)"
                class="btn-select"
                :class="{ 'btn-pulse': !course?.isFull && !course?.userStatus }"
            >
              <i :class="course?.isFull ? 'el-icon-bell' : 'el-icon-circle-plus'"></i>
              {{ course?.selecting ? '处理中...' : (course?.isFull ? '加入排队' : '立即选课') }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
        v-if="!loading && courseList.length === 0"
        :description="searchForm.courseName ? '未找到相关课程' : '暂无可选课程'"
        :image-size="120"
        class="empty-state"
    >
      <template #extra>
        <el-button type="primary" @click="handleReset" v-if="searchForm.courseName">
          <i class="el-icon-refresh"></i> 清除搜索
        </el-button>
        <el-button type="info" plain @click="$router.back()" v-else>
          <i class="el-icon-back"></i> 返回上一页
        </el-button>
      </template>
    </el-empty>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          :current-page="page"
          :page-sizes="[10, 20, 50]"
          :page-size="size"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          class="course-pagination"
      />
    </div>

    <!-- 课程详情弹窗 -->
    <el-dialog
        title="📋 课程详情"
        :visible="detailDialogVisible"
        @close="detailDialogVisible = false"
        width="520px"
        :close-on-click-modal="false"
        class="detail-dialog"
        custom-class="modal-custom"
    >
      <div class="detail-header" v-if="currentCourse">
        <h3 class="detail-course-name">{{ currentCourse.courseName }}</h3>
        <el-tag :type="currentCourse.isFull ? 'danger' : 'success'" effect="dark">
          {{ currentCourse.isFull ? '🔴 已满' : '🟢 可选' }}
        </el-tag>
      </div>

      <el-descriptions :column="1" border class="detail-descriptions" v-if="currentCourse">
        <el-descriptions-item label="授课教师">
          <i class="el-icon-user"></i> {{ currentCourse.teacherName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="课程时间">
          <i class="el-icon-calendar"></i> {{ formatCourseDate(currentCourse) }}
        </el-descriptions-item>
        <el-descriptions-item label="学分">
          <i class="el-icon-s-data"></i> <strong class="credit-large">{{ currentCourse.credits || '-' }}</strong> 学分
        </el-descriptions-item>
        <el-descriptions-item label="课程容量">
          <i class="el-icon-s-order"></i>
          {{ currentCourse.currentCount || 0 }} / {{ currentCourse.maxCapacity || 0 }}
          <el-progress
              :percentage="getCapacityPercent(currentCourse)"
              :show-text="false"
              stroke-width="6"
              class="capacity-progress"
              :color="getCapacityProgressColor(currentCourse)"
          />
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag
              v-if="currentCourse.userStatus === 'SELECTED'"
              type="success" effect="light"
          >
            ✅ 已选课
          </el-tag>
          <el-tag
              v-else-if="currentCourse.userStatus === 'QUEUED'"
              type="warning" effect="light"
          >
            ⏳ 排队中 ({{ currentCourse.queuePosition || '-' }})
          </el-tag>
          <el-tag v-else type="info" effect="light">
            {{ currentCourse.isFull ? '🔔 可排队' : '✨ 可选课' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">
            关 闭
          </el-button>
          <el-button
              v-if="currentCourse && !currentCourse.userStatus"
              :type="currentCourse.isFull ? 'warning' : 'primary'"
              :loading="currentCourse.selecting"
              @click="handleSelectFromDetail(currentCourse)"
          >
            <i :class="currentCourse.isFull ? 'el-icon-bell' : 'el-icon-circle-plus'"></i>
            {{ currentCourse.isFull ? '加入排队' : '立即选课' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentCourseMarket',

  data() {
    return {
      studentId: null,
      searchForm: { courseName: '' },

      page: 1,
      size: 10,
      total: 0,
      courseList: [],
      loading: false,

      // 详情弹窗
      detailDialogVisible: false,
      currentCourse: null
    }
  },

  computed: {
    // 可选课程数量
    availableCount() {
      return this.courseList.filter(c => !c.isFull && !c.userStatus).length
    },
    // 已满课程数量
    fullCount() {
      return this.courseList.filter(c => c.isFull).length
    },
    // 已选课程数量
    selectedCount() {
      return this.courseList.filter(c => c.userStatus === 'SELECTED').length
    }
  },

  created() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.studentId) {
      this.fetchCourseMarket()
    }
  },

  methods: {
    // ✅ 所有方法添加空值检查 - 修复 startDate 错误

    formatCourseDate(course) {
      // 🔧 先检查 course 对象本身
      if (!course || !course.startDate || !course.endDate) return '-'
      const start = new Date(course.startDate)
      const end = new Date(course.endDate)
      const now = new Date()

      if (start.getFullYear() === now.getFullYear()) {
        return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
      }
      return `${course.startDate} ~ ${course.endDate}`
    },

    getCapacityPercent(course) {
      if (!course || !course.maxCapacity) return 0
      return Math.min(100, Math.round((course.currentCount / course.maxCapacity) * 100))
    },

    getCapacityProgressColor(course) {
      if (!course) return '#22c55e'
      const percent = this.getCapacityPercent(course)
      if (percent >= 100) return '#ef4444'
      if (percent >= 90) return '#f59e0b'
      return '#22c55e'
    },

    getCourseCardClass(course) {
      if (!course) return ''
      const classes = []
      if (course.userStatus === 'SELECTED') classes.push('card-selected')
      if (course.userStatus === 'QUEUED') classes.push('card-queued')
      if (course.isFull && !course.userStatus) classes.push('card-full')
      return classes.join(' ')
    },

    getCardDecorationClass(course) {
      if (!course) return 'decoration-available'
      if (course.userStatus === 'SELECTED') return 'decoration-selected'
      if (course.userStatus === 'QUEUED') return 'decoration-queued'
      if (course.isFull) return 'decoration-full'
      return 'decoration-available'
    },

    getUserStatusTagType(status) {
      const map = { 'SELECTED': 'success', 'QUEUED': 'warning' }
      return map[status] || 'info'
    },

    getUserStatusIcon(status) {
      const map = { 'SELECTED': 'el-icon-check', 'QUEUED': 'el-icon-time' }
      return map[status] || 'el-icon-info'
    },

    getUserStatusText(status) {
      const map = { 'SELECTED': '已选课', 'QUEUED': '排队中' }
      return map[status] || status
    },

    showCourseAlert(course) {
      return course?.isFull && !course?.userStatus
    },

    getCourseAlertTitle(course) {
      if (course?.isFull && !course?.userStatus) {
        return '🔔 课程已满，可加入排队等待名额'
      }
      return ''
    },

    getCourseAlertType(course) {
      if (course?.isFull && !course?.userStatus) return 'warning'
      return 'info'
    },

    async fetchCourseMarket() {
      if (!this.studentId) return
      this.loading = true
      try {
        const resp = await axios.get('/api/student/courses/market', {
          params: {
            studentId: this.studentId,
            courseName: this.searchForm.courseName,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.courseList = (resp.data.data.list || []).map(course => ({
            ...course,
            selecting: false
          }))
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch course market error:', e)
        this.$message.error('加载课程列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchCourseMarket() },
    handleReset() { this.searchForm = { courseName: '' }; this.handleSearch() },
    handlePageChange(p) { this.page = p; this.fetchCourseMarket() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchCourseMarket() },

    viewCourseDetail(course) {
      // 🔧 确保复制的是有效对象
      this.currentCourse = course ? { ...course } : null
      this.detailDialogVisible = true
    },

    async handleSelect(course) {
      if (!course || course.selecting) return
      course.selecting = true
      try {
        const resp = await axios.post(`/api/student/courses/${course.courseId}/select`, {
          studentId: this.studentId
        })
        if (resp.data.code === 1) {
          this.$message.success(resp.data.msg || '✅ 操作成功')
          this.fetchCourseMarket()
        } else {
          this.$message.error(resp.data.msg || '❌ 操作失败')
        }
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '❌ 网络请求失败')
      } finally {
        course.selecting = false
      }
    },

    async handleSelectFromDetail(course) {
      if (!course || course.selecting) return
      await this.handleSelect(course)
      if (!course.selecting) {
        this.detailDialogVisible = false
      }
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.course-market {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: rgba(79, 70, 229, 0.1);
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --bg-page: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  padding: 24px;
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
}

.page-bg-decoration {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 160px;
  background: radial-gradient(ellipse at top, rgba(79, 70, 229, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 页面标题 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
  flex-shrink: 0;
}
.title-icon i { font-size: 22px; color: white; }

.title-content { display: flex; flex-direction: column; gap: 4px; }
.page-title {
  font-size: 22px; font-weight: 700;
  color: var(--text-primary); margin: 0;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-size: 13px; color: var(--text-secondary);
  margin: 0; font-weight: 500;
}

/* 搜索栏 */
.search-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.search-input { width: 240px; }
.search-input ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}
.search-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}
.search-actions { display: flex; gap: 8px; }

.btn-search {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none; padding: 9px 20px;
  border-radius: 10px; font-weight: 500;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}
.btn-reset {
  padding: 9px 18px; border-radius: 10px;
  border: 2px solid var(--border-color);
  font-weight: 500;
}
.btn-reset:hover {
  border-color: #94a3b8; background: #f8fafc;
}

/* ========== 课程统计栏 ========== */
.course-stats {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  margin: 0 20px 16px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  flex-wrap: wrap;
}
.stat-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 16px; min-width: 70px;
}
.stat-value {
  font-size: 20px; font-weight: 700;
  color: var(--text-primary);
}
.stat-value.available { color: var(--success); }
.stat-value.full { color: var(--danger); }
.stat-value.selected { color: var(--primary); }
.stat-label {
  font-size: 12px; color: var(--text-muted);
  margin-top: 2px;
}

/* ========== 课程网格 ========== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 0 20px 20px;
}

/* ========== 课程卡片 ========== */
.course-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}
.course-card.card-selected {
  border-left: 4px solid var(--success);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.03), transparent);
}
.course-card.card-queued {
  border-left: 4px solid var(--warning);
  opacity: 0.95;
}
.course-card.card-full {
  opacity: 0.9;
}

.card-decoration {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.card-decoration.decoration-available { background: linear-gradient(90deg, var(--success), #16a34a); }
.card-decoration.decoration-full { background: linear-gradient(90deg, var(--danger), #dc2626); }
.card-decoration.decoration-selected { background: linear-gradient(90deg, var(--success), #22c55e); }
.card-decoration.decoration-queued { background: linear-gradient(90deg, var(--warning), #d97706); }

.course-content { padding: 20px; }

/* 课程标题区 */
.course-header { margin-bottom: 16px; }
.header-main {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 10px; margin-bottom: 8px; flex-wrap: wrap;
}
.course-name {
  font-size: 16px; font-weight: 600;
  color: var(--text-primary); margin: 0;
  line-height: 1.4;
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.status-tag { font-weight: 500; flex-shrink: 0; }

.user-status { margin-top: 8px; }
.user-status-tag { font-weight: 500; }

/* 课程信息网格 */
.course-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}
.info-item {
  display: flex; flex-direction: column; gap: 4px;
  font-size: 12px;
}
.info-icon { font-size: 14px; color: var(--text-muted); }
.info-label { color: var(--text-muted); font-weight: 500; }
.info-value {
  font-size: 13px; color: var(--text-primary);
  font-weight: 500;
}
.info-value.credit {
  color: var(--primary); font-size: 16px; font-weight: 700;
}
.capacity-info {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.capacity-progress { flex: 1; min-width: 80px; }

/* 课程提示 */
.course-alert {
  margin-bottom: 16px; border-radius: 10px;
}
.course-alert ::v-deep .el-alert__content { padding-right: 0; }

/* 操作按钮区 */
.course-actions {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.action-btn.detail {
  color: var(--text-secondary); font-size: 13px;
}
.action-btn.detail:hover { color: var(--primary); }

.action-tag { font-weight: 500; }

.btn-select {
  display: flex; align-items: center; gap: 5px;
  border-radius: 10px; font-weight: 500;
  padding: 8px 18px;
}
.btn-select.btn-pulse {
  animation: btnPulse 2s infinite;
}
@keyframes btnPulse {
  0% { box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
  50% { box-shadow: 0 6px 18px rgba(79, 70, 229, 0.5); }
  100% { box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
}
.btn-select[type="warning"] {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid var(--warning);
  color: var(--warning);
}
.btn-select[type="warning"]:hover:not(:disabled) {
  background: var(--warning); color: white;
}

/* ========== 空状态 ========== */
.empty-state { margin: 60px 0; }
::v-deep .el-empty__description {
  color: var(--text-secondary); font-size: 14px;
}

/* ========== 分页 ========== */
.pagination-wrapper {
  padding: 0 20px 24px;
  display: flex; justify-content: flex-end;
}
.course-pagination ::v-deep .el-pagination {
  font-weight: 500;
}

/* ========== 详情弹窗 ========== */
.modal-custom ::v-deep .el-dialog {
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}
.modal-custom ::v-deep .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  margin: 0;
}
.modal-custom ::v-deep .el-dialog__title {
  font-size: 16px; font-weight: 600; color: var(--text-primary);
}
.modal-custom ::v-deep .el-dialog__body { padding: 20px 24px; }
.modal-custom ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.detail-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}
.detail-course-name {
  font-size: 18px; font-weight: 600;
  color: var(--text-primary); margin: 0;
}

.detail-descriptions ::v-deep .el-descriptions__label {
  font-weight: 500; color: var(--text-secondary);
  width: 90px;
}
.detail-descriptions ::v-deep .el-descriptions__content {
  color: var(--text-primary); font-size: 14px;
}
.credit-large {
  color: var(--primary); font-size: 20px; font-weight: 700;
}
.capacity-progress { margin-top: 6px; }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .course-market {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --border-color: #334155;
  }
  .course-card,
  .course-info-grid,
  .course-stats {
    background: var(--bg-card);
  }
  .search-input ::v-deep .el-input__inner {
    background: #334155; color: var(--text-primary);
  }
  .btn-reset:hover { background: #334155; }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .course-market { padding: 16px; }

  .page-header { flex-direction: column; align-items: flex-start; }
  .header-left { width: 100%; }

  .search-form { width: 100%; flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .search-actions { width: 100%; justify-content: flex-end; }

  .course-stats {
    flex-wrap: wrap; justify-content: space-around;
    margin: 0 16px 16px;
  }

  .course-grid {
    grid-template-columns: 1fr;
    padding: 0 16px 16px;
  }

  .course-info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .course-actions {
    flex-direction: column; align-items: stretch; gap: 8px;
  }
  .btn-select { width: 100%; justify-content: center; }

  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px; font-weight: 500;
}
::v-deep .el-progress { display: inline-flex; vertical-align: middle; }
::v-deep .el-descriptions__body {
  background: var(--bg-card);
}
::v-deep .el-dialog__headerbtn { top: 18px; right: 20px; }
::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}
</style>