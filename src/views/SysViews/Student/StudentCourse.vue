<template>
  <div class="my-courses">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-reading"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">我的课程</h2>
          <p class="page-subtitle">管理已选课程，开启学习之旅</p>
        </div>
      </div>
      <div class="user-welcome" v-if="studentName">
        <div class="user-avatar">
          {{ getAvatarInitials(studentName) }}
        </div>
        <span class="welcome-text">欢迎，<strong>{{ studentName }}</strong></span>
      </div>
    </div>

    <!-- Tab 切换 -->
    <el-tabs
        v-model="activeTab"
        @tab-click="handleTabChange"
        class="course-tabs"
        type="card"
    >
      <!-- 已选课程 -->
      <el-tab-pane label="📚 已选课程" name="selected">
        <div class="tab-header">
          <span class="tab-count">
            共 <strong>{{ selectedList.length }}</strong> 门课程
          </span>
          <el-button
              size="small"
              type="text"
              @click="refreshList"
              class="btn-refresh"
          >
            <i class="el-icon-refresh"></i> 刷新
          </el-button>
        </div>

        <div class="course-grid" v-loading="loading">
          <el-card
              class="course-card"
              shadow="hover"
              v-for="course in selectedList"
              :key="course.courseId"
              :class="{ 'card-urgent': isCourseUrgent(course) }"
          >
            <!-- 卡片顶部装饰 -->
            <div class="card-decoration selected"></div>

            <div class="course-content">
              <!-- 课程标题区 -->
              <div class="course-header">
                <div class="header-main">
                  <h3 class="course-name" :title="course.courseName">
                    {{ course.courseName }}
                  </h3>
                  <el-tag size="mini" type="success" effect="dark" class="status-tag">
                    <i class="el-icon-check"></i> 已选
                  </el-tag>
                </div>
                <!-- 课程进度提示 -->
                <div class="course-progress" v-if="getCourseProgress(course)">
                  <el-progress
                      :percentage="getCourseProgress(course)"
                      :show-text="false"
                      stroke-width="3"
                      class="progress-mini"
                  />
                  <span class="progress-text">{{ getCourseProgress(course) }}%</span>
                </div>
              </div>

              <!-- 课程信息网格 -->
              <div class="course-info-grid">
                <div class="info-item">
                  <i class="el-icon-user info-icon"></i>
                  <span class="info-label">教师</span>
                  <span class="info-value">{{ course.teacherName }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-calendar info-icon"></i>
                  <span class="info-label">时间</span>
                  <span class="info-value">{{ formatCourseDate(course) }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-s-data info-icon"></i>
                  <span class="info-label">学分</span>
                  <span class="info-value credit">{{ course.credits }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-s-order info-icon"></i>
                  <span class="info-label">容量</span>
                  <span class="info-value">
                    {{ course.currentCount }}/{{ course.maxCapacity }}
                    <el-tag
                        v-if="getCapacityStatus(course) === 'full'"
                        size="mini"
                        type="danger"
                        effect="plain"
                        class="capacity-tag"
                    >
                      已满
                    </el-tag>
                    <el-tag
                        v-else-if="getCapacityStatus(course) === 'almost'"
                        size="mini"
                        type="warning"
                        effect="plain"
                        class="capacity-tag"
                    >
                      紧张
                    </el-tag>
                  </span>
                </div>
              </div>

              <!-- 快捷操作按钮 -->
              <div class="quick-actions">
                <el-button
                    size="small"
                    type="primary"
                    plain
                    @click="submitAssignment(course)"
                    class="action-btn assignment"
                >
                  <i class="el-icon-edit-outline"></i> 作业
                </el-button>

                <!-- 🔥 新增：课程资源入口 -->
                <el-button
                    size="small"
                    type="info"
                    plain
                    @click="goToResources(course)"
                    class="action-btn resource"
                >
                  <i class="el-icon-folder-opened"></i> 资源
                </el-button>

                <el-button
                    size="small"
                    type="success"
                    plain
                    @click="openQa(course)"
                    class="action-btn qa"
                >
                  <i class="el-icon-chat-dot-square"></i> 问答
                </el-button>
                <el-button
                    size="small"
                    type="info"
                    plain
                    @click="viewCourseDetail(course)"
                    class="action-btn detail"
                >
                  <i class="el-icon-view"></i> 详情
                </el-button>
              </div>

              <!-- 底部操作栏 -->
              <div class="course-footer">
                <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="confirmCancel(course)"
                    class="btn-cancel"
                >
                  <i class="el-icon-close"></i> 取消选课
                </el-button>
                <span class="course-status" v-if="course.status !== 'OPEN'">
                  <el-tag size="mini" type="info" effect="plain">已结课</el-tag>
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 空状态 -->
        <el-empty
            v-if="!loading && selectedList.length === 0"
            description="暂无已选课程，快去选课吧！"
            :image-size="120"
        >
          <template #extra>
            <el-button type="primary" @click="$router.push('/student/courses')">
              <i class="el-icon-plus"></i> 去选课
            </el-button>
          </template>
        </el-empty>
      </el-tab-pane>

      <!-- 排队课程 -->
      <el-tab-pane label="⏳ 排队课程" name="queued">
        <div class="tab-header">
          <span class="tab-count">
            共 <strong>{{ queuedList.length }}</strong> 门排队中
          </span>
        </div>

        <div class="course-grid" v-loading="loading">
          <el-card
              class="course-card queued"
              shadow="hover"
              v-for="course in queuedList"
              :key="course.courseId"
          >
            <!-- 卡片顶部装饰 -->
            <div class="card-decoration queued"></div>

            <div class="course-content">
              <!-- 课程标题区 -->
              <div class="course-header">
                <div class="header-main">
                  <h3 class="course-name" :title="course.courseName">
                    {{ course.courseName }}
                  </h3>
                  <el-tag size="mini" type="warning" effect="dark" class="status-tag">
                    <i class="el-icon-time"></i> 排队中
                  </el-tag>
                </div>
                <!-- 排队位置 -->
                <div class="queue-position">
                  <i class="el-icon-rank"></i>
                  <span>当前排队位置：</span>
                  <strong class="position-number">{{ course.queuePosition || '-' }}</strong>
                  <span v-if="course.queuePosition && course.queuePosition <= 3" class="position-tip">
                    🎉 即将入选！
                  </span>
                </div>
              </div>

              <!-- 课程信息网格 -->
              <div class="course-info-grid">
                <div class="info-item">
                  <i class="el-icon-user info-icon"></i>
                  <span class="info-label">教师</span>
                  <span class="info-value">{{ course.teacherName }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-calendar info-icon"></i>
                  <span class="info-label">时间</span>
                  <span class="info-value">{{ formatCourseDate(course) }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-s-data info-icon"></i>
                  <span class="info-label">学分</span>
                  <span class="info-value credit">{{ course.credits }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-s-order info-icon"></i>
                  <span class="info-label">剩余名额</span>
                  <span class="info-value">
                    {{ Math.max(0, course.maxCapacity - course.currentCount) }}
                    <el-tag size="mini" effect="plain">
                      总容量 {{ course.maxCapacity }}
                    </el-tag>
                  </span>
                </div>
              </div>

              <!-- 排队提示 -->
              <el-alert
                  title="排队说明"
                  type="info"
                  :closable="false"
                  show-icon
                  class="queue-tip"
                  effect="light"
              >
                <template #default>
                  <p>• 有名额释放时将按排队顺序自动入选</p>
                  <p>• 请保持在线，入选后将收到系统通知</p>
                </template>
              </el-alert>

              <!-- 底部操作栏 -->
              <div class="course-footer">
                <el-button
                    size="small"
                    type="warning"
                    plain
                    @click="confirmCancel(course)"
                    class="btn-cancel"
                >
                  <i class="el-icon-close"></i> 取消排队
                </el-button>
                <el-button
                    size="small"
                    type="info"
                    plain
                    @click="viewCourseDetail(course)"
                >
                  <i class="el-icon-view"></i> 详情
                </el-button>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 空状态 -->
        <el-empty
            v-if="!loading && queuedList.length === 0"
            description="暂无排队课程"
            :image-size="100"
        />
      </el-tab-pane>
    </el-tabs>

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
      <div class="detail-header">
        <h3 class="detail-course-name">{{ currentCourse?.courseName }}</h3>
        <el-tag :type="currentCourse?.status === 'OPEN' ? 'success' : 'info'" effect="dark">
          {{ currentCourse?.status === 'OPEN' ? '🟢 开放中' : '⚪ 已结课' }}
        </el-tag>
      </div>

      <el-descriptions :column="1" border class="detail-descriptions">
        <el-descriptions-item label="授课教师">
          <i class="el-icon-user"></i> {{ currentCourse?.teacherName }}
        </el-descriptions-item>
        <el-descriptions-item label="课程时间">
          <i class="el-icon-calendar"></i> {{ currentCourse?.startDate }} 至 {{ currentCourse?.endDate }}
        </el-descriptions-item>
        <el-descriptions-item label="学分">
          <i class="el-icon-s-data"></i> <strong class="credit-large">{{ currentCourse?.credits }}</strong> 学分
        </el-descriptions-item>
        <el-descriptions-item label="课程容量">
          <i class="el-icon-s-order"></i>
          {{ currentCourse?.currentCount }} / {{ currentCourse?.maxCapacity }}
          <el-progress
              :percentage="Math.round((currentCourse?.currentCount / currentCourse?.maxCapacity) * 100)"
              :show-text="false"
              stroke-width="6"
              class="capacity-progress"
          />
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag
              :type="activeTab === 'selected' ? 'success' : 'warning'"
              effect="light"
          >
            {{ activeTab === 'selected' ? '✅ 已选课' : '⏳ 排队中' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">
            关 闭
          </el-button>
          <el-button
              v-if="activeTab === 'selected'"
              type="primary"
              @click="submitAssignment(currentCourse); detailDialogVisible = false"
          >
            <i class="el-icon-edit-outline"></i> 提交作业
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentMyCourses',

  data() {
    return {
      studentId: null,
      studentName: '',
      activeTab: 'selected',

      selectedList: [],
      queuedList: [],
      loading: false,

      // 详情弹窗
      detailDialogVisible: false,
      currentCourse: null
    }
  },

  created() {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId
    this.studentName = userInfo.username

    if (this.studentId) {
      this.fetchMyCourses()
    }
  },

  methods: {
    // 获取头像缩写
    getAvatarInitials(name) {
      if (!name) return '?'
      const chars = name.split('').filter(c => /[\u4e00-\u9fa5a-zA-Z]/.test(c))
      return chars.slice(0, 2).join('').toUpperCase() || '?'
    },

    // 格式化课程日期
    formatCourseDate(course) {
      if (!course.startDate || !course.endDate) return '-'
      const start = new Date(course.startDate)
      const end = new Date(course.endDate)
      const now = new Date()

      // 如果今年，简化显示
      if (start.getFullYear() === now.getFullYear()) {
        return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`
      }
      return `${course.startDate} ~ ${course.endDate}`
    },

    // 获取容量状态
    getCapacityStatus(course) {
      if (!course.maxCapacity) return 'unknown'
      const ratio = course.currentCount / course.maxCapacity
      if (ratio >= 1) return 'full'
      if (ratio >= 0.9) return 'almost'
      return 'available'
    },

    // 获取课程进度（模拟，实际可从后端获取）
    getCourseProgress(course) {
      // 简化：根据时间计算进度
      if (!course.startDate || !course.endDate) return null
      const start = new Date(course.startDate)
      const end = new Date(course.endDate)
      const now = new Date()

      if (now < start) return 0
      if (now > end) return 100

      const total = end - start
      const elapsed = now - start
      return Math.min(100, Math.round((elapsed / total) * 100))
    },

    // 判断课程是否紧急（即将截止）
    isCourseUrgent(course) {
      if (!course.endDate) return false
      const end = new Date(course.endDate)
      const now = new Date()
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      return diffDays <= 7 && diffDays > 0 && course.status === 'OPEN'
    },

    // 刷新列表
    refreshList() {
      const status = this.activeTab === 'selected' ? 'SELECTED' : 'QUEUED'
      this.fetchMyCourses(status)
      this.$message.success('🔄 列表已刷新')
    },

    async fetchMyCourses(status = 'SELECTED') {
      if (!this.studentId) return
      this.loading = true
      try {
        const resp = await axios.get('/api/student/courses/my', {
          params: { studentId: this.studentId, status }
        })
        if (resp.data.code === 1) {
          if (status === 'SELECTED') {
            this.selectedList = resp.data.data || []
          } else {
            this.queuedList = resp.data.data || []
          }
        }
      } catch (e) {
        console.error('Fetch my courses error:', e)
        this.$message.error('加载课程列表失败')
      } finally {
        this.loading = false
      }
    },

    handleTabChange(tab) {
      const status = tab.name === 'selected' ? 'SELECTED' : 'QUEUED'
      this.fetchMyCourses(status)
    },

    viewCourseDetail(course) {
      this.currentCourse = { ...course }
      this.detailDialogVisible = true
    },

    openQa(course) {
      this.$router.push({
        path: '/student/courseQA',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },

    // 🔥 新增：跳转到课程资源页面
    goToResources(course) {
      this.$router.push({
        path: '/student/courseResource',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },

    submitAssignment(course) {
      this.$router.push({
        path: '/student/submit',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },

    async confirmCancel(course) {
      const action = this.activeTab === 'selected' ? '取消选课' : '取消排队'
      const tip = action === '取消选课'
          ? '取消后该课程将不再显示在"已选课程"中'
          : '取消后将退出排队队列'

      try {
        await this.$confirm(
            `确定要${action}「${course.courseName}」吗？\n${tip}`,
            '⚠️ 确认操作',
            {
              type: 'warning',
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              distinguishCancelAndClose: true
            }
        )

        await axios.post(`/api/student/courses/${course.courseId}/cancel`, {
          studentId: this.studentId
        })
        this.$message.success(`✅ ${action}成功`)
        const status = this.activeTab === 'selected' ? 'SELECTED' : 'QUEUED'
        this.fetchMyCourses(status)
      } catch (e) {
        if (e !== 'cancel') {
          this.$message.error(`❌ ${e.response?.data?.msg || action + '失败'}`)
        }
      }
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.my-courses {
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
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
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

.user-welcome {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}
.user-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
}
.welcome-text {
  font-size: 13px; color: var(--text-secondary);
}
.welcome-text strong {
  color: var(--text-primary); font-weight: 600;
}

/* ========== Tab 样式 ========== */
.course-tabs {
  margin: 0 0 20px 0;
}
.course-tabs ::v-deep .el-tabs__nav-wrap {
  padding: 0 20px;
}
.course-tabs ::v-deep .el-tabs__item {
  font-size: 14px; font-weight: 500;
  padding: 0 24px; height: 44px; line-height: 44px;
  border-radius: 10px 10px 0 0;
  transition: all 0.2s;
}
.course-tabs ::v-deep .el-tabs__item.is-active {
  background: var(--bg-card);
  color: var(--primary); font-weight: 600;
  border: 1px solid var(--border-color);
  border-bottom-color: transparent;
  box-shadow: 0 -2px 8px rgba(79, 70, 229, 0.1);
}
.course-tabs ::v-deep .el-tabs__content {
  padding: 0;
}

.tab-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px 8px;
  margin: 0 20px;
  border-bottom: 1px solid var(--border-color);
}
.tab-count {
  font-size: 13px; color: var(--text-secondary);
}
.tab-count strong { color: var(--text-primary); font-weight: 600; }
.btn-refresh {
  font-size: 12px; color: var(--text-muted);
  padding: 4px 8px;
}
.btn-refresh:hover { color: var(--primary); }

/* ========== 课程网格 ========== */
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 16px 20px 20px;
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
.course-card.queued {
  opacity: 0.95;
}
.course-card.card-urgent {
  border-left: 4px solid var(--warning);
  animation: pulseBorder 3s infinite;
}
@keyframes pulseBorder {
  0%, 100% { box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1); }
  50% { box-shadow: 0 4px 16px rgba(245, 158, 11, 0.25); }
}

.card-decoration {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.card-decoration.selected { background: linear-gradient(90deg, var(--success), #16a34a); }
.card-decoration.queued { background: linear-gradient(90deg, var(--warning), #d97706); }

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

.course-progress {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text-muted);
}
.progress-mini { flex: 1; }
.progress-mini ::v-deep .el-progress-bar__inner {
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
}
.progress-text { font-weight: 500; color: var(--primary); }

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
.info-icon {
  font-size: 14px; color: var(--text-muted);
}
.info-label {
  color: var(--text-muted); font-weight: 500;
}
.info-value {
  font-size: 13px; color: var(--text-primary);
  font-weight: 500;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.info-value.credit {
  color: var(--primary); font-size: 16px; font-weight: 700;
}
.capacity-tag { font-size: 10px; padding: 1px 6px; }

/* 快捷操作按钮 */
.quick-actions {
  display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
}
.action-btn {
  flex: 1; min-width: 70px;
  border-radius: 8px; font-weight: 500; font-size: 12px;
  padding: 8px 12px;
  transition: all 0.15s;
}
.action-btn.assignment {
  border-color: var(--primary); color: var(--primary);
}
.action-btn.assignment:hover {
  background: var(--primary); color: white;
}
.action-btn.resource {
  border-color: var(--text-muted); color: var(--text-secondary);
}
.action-btn.resource:hover {
  border-color: var(--primary); color: var(--primary);
}
.action-btn.qa {
  border-color: var(--success); color: var(--success);
}
.action-btn.qa:hover {
  background: var(--success); color: white;
}
.action-btn.detail {
  border-color: var(--text-muted); color: var(--text-secondary);
}
.action-btn.detail:hover {
  border-color: var(--primary); color: var(--primary);
}

/* 底部操作栏 */
.course-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 12px; border-top: 1px dashed var(--border-color);
}
.btn-cancel {
  border-radius: 8px; font-weight: 500; font-size: 12px;
  padding: 8px 16px;
}
.btn-cancel:hover {
  background: var(--danger); color: white; border-color: var(--danger);
}
.course-status { font-size: 12px; }

/* 排队位置 */
.queue-position {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary);
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 8px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.queue-position i { color: var(--warning); }
.position-number {
  color: var(--warning); font-weight: 700; font-size: 16px;
}
.position-tip {
  color: var(--success); font-weight: 500; margin-left: 4px;
}

/* 排队提示 */
.queue-tip {
  margin-bottom: 16px; border-radius: 10px;
}
.queue-tip ::v-deep .el-alert__content { padding-right: 0; }
.queue-tip p {
  margin: 4px 0; font-size: 12px; color: var(--text-secondary);
}

/* ========== 空状态 ========== */
::v-deep .el-empty {
  margin: 40px 0;
}
::v-deep .el-empty__description {
  color: var(--text-secondary); font-size: 14px;
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
.capacity-progress {
  margin-top: 6px;
}
.capacity-progress ::v-deep .el-progress-bar__inner {
  background: linear-gradient(90deg, var(--success), var(--primary));
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .my-courses {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --border-color: #334155;
  }
  .course-card,
  .course-info-grid,
  .user-welcome,
  .queue-position {
    background: var(--bg-card);
  }
  .course-tabs ::v-deep .el-tabs__item.is-active {
    background: var(--bg-card);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .my-courses { padding: 16px; }

  .page-header { flex-direction: column; align-items: flex-start; }
  .header-left { width: 100%; }

  .course-grid {
    grid-template-columns: 1fr;
    padding: 12px 16px 16px;
  }

  .course-info-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .quick-actions {
    flex-direction: column;
  }
  .action-btn { width: 100%; }

  .course-footer {
    flex-direction: column; gap: 10px; align-items: flex-start;
  }

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