<template>
  <div class="course-qa">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-chat-dot-round"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">课程问答</h2>
          <p class="page-subtitle">有疑问随时提问，老师在线解答</p>
        </div>
      </div>
      <div class="header-actions">
        <el-tag size="mini" effect="plain" class="course-tag">
          <i class="el-icon-reading"></i>
          {{ courseName || '加载中...' }}
        </el-tag>
        <el-button type="primary" icon="el-icon-plus" @click="openAskDialog" class="btn-ask">
          <i class="el-icon-edit"></i> 发起提问
        </el-button>
      </div>
    </div>

    <!-- 提问列表 -->
    <div class="qa-list" v-loading="loading">
      <el-card
          class="qa-card"
          shadow="hover"
          v-for="qa in qaList"
          :key="qa.qaId"
          :class="getQaCardClass(qa)"
      >
        <!-- 卡片左侧装饰条 -->
        <div class="card-decoration" :class="getCardDecorationClass(qa)"></div>

        <div class="qa-content">
          <!-- 提问头部 -->
          <div class="qa-header">
            <div class="qa-user">
              <div class="user-avatar" :class="qa.isAnonymous ? 'anonymous' : 'student'">
                <i :class="'el-icon-user'"></i>
              </div>
              <div class="user-info">
                <span class="username">{{ qa.isAnonymous ? '匿名提问' : ( '提问') }}</span>
<!--                <span class="user-role">{{ qa.isAnonymous ? '👤 匿名' : '🎓 学生' }}</span>-->
              </div>
            </div>
            <div class="qa-meta">
              <el-tag
                  :type="getAuditTagType(qa.auditStatus)"
                  size="mini"
                  effect="light"
                  class="audit-tag"
              >
                {{ getAuditText(qa.auditStatus) }}
              </el-tag>
              <span class="qa-time">
                <i class="el-icon-time"></i>
                {{ formatDateTime(qa.askTime) }}
              </span>
            </div>
          </div>

          <!-- 问题内容 -->
          <div class="qa-question">
            <div class="question-label">
              <i class="el-icon-question question-icon"></i>
              <span>问题</span>
            </div>
            <p class="question-content">{{ qa.question }}</p>
          </div>

          <!-- 教师回复区域 -->
          <div v-if="qa.auditStatus === 'PASS'" class="qa-answer-section">
            <div class="answer-header">
              <div class="teacher-info">
                <div class="teacher-avatar">
                  <i class="el-icon-user"></i>
                </div>
                <div class="teacher-name">
                  <span>👨‍🏫 教师回复</span>
                  <span v-if="qa.answerTime" class="answer-time">
                    · {{ formatDateTime(qa.answerTime) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="answer-content" v-if="qa.answer">
              <p class="answer-text">{{ qa.answer }}</p>
            </div>
            <div class="answer-content pending" v-else>
              <el-alert
                  title="教师暂未回复"
                  type="info"
                  :closable="false"
                  show-icon
                  effect="light"
                  class="pending-alert"
              >
                <template #default>
                  <p>老师正在处理您的问题，请耐心等待...</p>
                </template>
              </el-alert>
            </div>
          </div>

          <!-- 审核未通过提示 -->
          <div v-if="qa.auditStatus === 'REJECT'" class="qa-reject">
            <el-alert
                title="❌ 提问未通过审核"
                type="error"
                :closable="false"
                show-icon
                effect="light"
            >
              <template #default>
                <p v-if="qa.rejectReason"><strong>原因：</strong>{{ qa.rejectReason }}</p>
                <p v-else>问题内容可能不符合规范，请修改后重新提问</p>
                <el-button
                    size="small"
                    type="primary"
                    plain
                    @click="reopenQuestion(qa)"
                    style="margin-top: 8px"
                >
                  <i class="el-icon-refresh"></i> 重新提问
                </el-button>
              </template>
            </el-alert>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
        v-if="!loading && qaList.length === 0"
        description="暂无提问记录，快来提出你的第一个问题吧！"
        :image-size="120"
        class="empty-state"
    >
      <template #extra>
        <el-button type="primary" @click="openAskDialog" icon="el-icon-plus">
          发起第一个提问
        </el-button>
      </template>
    </el-empty>

    <!-- 发起提问弹窗 -->
    <el-dialog
        title="💬 发起提问"
        :visible="askDialogVisible"
        @close="askDialogVisible = false"
        width="580px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="ask-dialog"
        custom-class="modal-custom"
    >
      <!-- 提问提示 -->
      <el-alert
          title="💡 提问小贴士"
          type="info"
          :closable="false"
          show-icon
          class="dialog-tip"
          effect="light"
      >
        <template #default>
          <div class="tip-list">
            <div class="tip-item">
              <i class="el-icon-check"></i>
              <span>问题描述尽量清晰具体，便于老师准确解答</span>
            </div>
            <div class="tip-item">
              <i class="el-icon-check"></i>
              <span>可附上相关截图或代码片段（文字描述）</span>
            </div>
            <div class="tip-item">
              <i class="el-icon-check"></i>
              <span>匿名提问将隐藏您的姓名，但老师仍能看到问题内容</span>
            </div>
          </div>
        </template>
      </el-alert>

      <el-form
          :model="askForm"
          :rules="askRules"
          ref="askFormRef"
          label-width="95px"
          class="ask-form"
      >
        <!-- 问题内容 -->
        <el-form-item label="问题内容" prop="question">
          <el-input
              v-model="askForm.question"
              type="textarea"
              :rows="6"
              placeholder="请输入您的问题，例如：&#10;• 这个知识点不太理解...&#10;• 作业提交后多久能出成绩？&#10;• 课程资料在哪里下载？"
              maxlength="500"
              show-word-limit
              class="form-textarea"
              ref="questionRef"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            建议分段描述，重点内容可用 **加粗** 标记
          </div>
        </el-form-item>

        <!-- 匿名选项 -->
        <el-form-item label="匿名提问" prop="isAnonymous">
          <el-switch
              v-model="askForm.isAnonymous"
              active-text="是"
              inactive-text="否"
              active-color="#4f46e5"
              inactive-color="#cbd5e1"
              class="anonymous-switch"
          />
          <span class="anonymous-tip">
            <i class="el-icon-lock"></i>
            匿名后教师端将不显示您的姓名，问题内容正常展示
          </span>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="askDialogVisible = false" :disabled="submitting">
            取 消
          </el-button>
          <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              class="btn-submit"
          >
            {{ submitting ? '提交中...' : '🚀 发 送 提 问' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentCourseQa',

  data() {
    return {
      courseId: null,
      courseName: '',
      studentId: null,

      qaList: [],
      loading: false,

      // 提问弹窗
      askDialogVisible: false,
      submitting: false,
      askForm: {
        question: '',
        isAnonymous: false
      },
      askRules: {
        question: [
          { required: true, message: '请输入问题内容', trigger: 'blur' },
          { min: 5, max: 500, message: '问题长度在 5 到 500 个字符', trigger: 'blur' }
        ]
      }
    }
  },

  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.courseId && this.studentId) {
      this.fetchQaList()
    }
  },

  methods: {
    // 获取问答卡片类名
    getQaCardClass(qa) {
      if (!qa) return ''
      const classes = []
      if (qa.auditStatus === 'PASS' && qa.answer) classes.push('card-answered')
      if (qa.auditStatus === 'PASS' && !qa.answer) classes.push('card-pending')
      if (qa.auditStatus === 'REJECT') classes.push('card-rejected')
      if (qa.isAnonymous) classes.push('card-anonymous')
      return classes.join(' ')
    },

    // 获取卡片装饰条类名
    getCardDecorationClass(qa) {
      if (!qa) return 'decoration-pending'
      if (qa.auditStatus === 'PASS' && qa.answer) return 'decoration-answered'
      if (qa.auditStatus === 'PASS') return 'decoration-pending'
      if (qa.auditStatus === 'REJECT') return 'decoration-rejected'
      return 'decoration-pending'
    },

    async fetchQaList() {
      if (!this.courseId || !this.studentId) return
      this.loading = true
      try {
        const resp = await axios.get('/api/student/qa', {
          params: { courseId: this.courseId, studentId: this.studentId }
        })
        if (resp.data.code === 1) {
          this.qaList = resp.data.data || []
        }
      } catch (e) {
        console.error('Fetch QA error:', e)
        this.$message.error('加载提问列表失败')
      } finally {
        this.loading = false
      }
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      // 支持多种时间格式
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) return dateTime.substring(0, 16)

      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      const isThisYear = date.getFullYear() === now.getFullYear()

      if (isToday) {
        return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      if (isThisYear) {
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    getAuditTagType(status) {
      const map = { 'PENDING': 'warning', 'PASS': 'success', 'REJECT': 'danger' }
      return map[status] || 'info'
    },

    getAuditText(status) {
      const map = { 'PENDING': '待审核', 'PASS': '审核通过', 'REJECT': '已拒绝' }
      return map[status] || status
    },

    // 重新提问
    reopenQuestion(qa) {
      this.askForm = {
        question: qa.question,  // 保留原问题内容供修改
        isAnonymous: qa.isAnonymous
      }
      this.askDialogVisible = true
      this.$nextTick(() => {
        this.$refs.questionRef?.focus?.()
      })
    },

    openAskDialog() {
      this.askForm = { question: '', isAnonymous: false }
      this.askDialogVisible = true
      // 自动聚焦
      this.$nextTick(() => {
        this.$refs.questionRef?.focus?.()
      })
    },

    async handleSubmit() {
      try {
        await this.$refs.askFormRef.validate()
      } catch {
        return
      }

      this.submitting = true
      try {
        const submitData = {
          ...this.askForm,
          courseId: this.courseId,
          studentId: this.studentId
        }
        await axios.post('/api/student/qa', submitData)
        this.$message.success('✅ 提问成功，等待老师审核')
        this.askDialogVisible = false
        this.fetchQaList()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '❌ 提交失败')
      } finally {
        this.submitting = false
      }
    },

    handleDialogClose() {
      this.$refs.askFormRef?.resetFields?.()
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.course-qa {
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
  --bg-answer: #f8fafc;
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

.header-actions {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}

.course-tag {
  display: flex; align-items: center; gap: 5px;
  font-weight: 500; padding: 6px 14px;
}
.course-tag i { color: var(--primary); }

.btn-ask {
  display: flex; align-items: center; gap: 5px;
  padding: 10px 22px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s;
}
.btn-ask:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
}

/* ========== 问答列表 ========== */
.qa-list {
  display: flex; flex-direction: column; gap: 16px;
  padding: 0 0 20px;
}

/* 问答卡片 */
.qa-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.qa-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* 卡片状态样式 */
.qa-card.card-answered {
  border-left: 4px solid var(--success);
}
.qa-card.card-pending {
  border-left: 4px solid var(--warning);
}
.qa-card.card-rejected {
  border-left: 4px solid var(--danger);
  opacity: 0.9;
}
.qa-card.card-anonymous {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.03), transparent);
}

/* 卡片装饰条 */
.card-decoration {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
}
.card-decoration.decoration-answered { background: linear-gradient(180deg, var(--success), #16a34a); }
.card-decoration.decoration-pending { background: linear-gradient(180deg, var(--warning), #d97706); }
.card-decoration.decoration-rejected { background: linear-gradient(180deg, var(--danger), #dc2626); }

.qa-content { padding: 20px; }

/* 提问头部 */
.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.qa-user {
  display: flex; align-items: center; gap: 10px;
}

.user-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: white;
  flex-shrink: 0;
}
.user-avatar.student {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
}
.user-avatar.anonymous {
  background: linear-gradient(135deg, #64748b, #475569);
}

.user-info {
  display: flex; flex-direction: column; gap: 2px;
}
.username {
  font-size: 14px; font-weight: 500;
  color: var(--text-primary);
}
.user-role {
  font-size: 11px; color: var(--text-muted);
}

.qa-meta {
  display: flex; align-items: center; gap: 10px;
  flex-wrap: wrap;
}
.audit-tag { font-weight: 500; }
.qa-time {
  font-size: 12px; color: var(--text-muted);
  display: flex; align-items: center; gap: 4px;
}

/* 问题内容 */
.qa-question {
  margin-bottom: 16px;
}
.question-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--text-primary); margin-bottom: 8px;
}
.question-icon {
  color: var(--primary); font-size: 14px;
}
.question-content {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.6; margin: 0;
  white-space: pre-wrap; word-break: break-word;
}

/* 教师回复区域 */
.qa-answer-section {
  padding: 14px;
  background: var(--bg-answer);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  margin-top: 8px;
}
.answer-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.teacher-info {
  display: flex; align-items: center; gap: 8px;
}
.teacher-avatar {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--success), #16a34a);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 12px;
}
.teacher-name {
  font-size: 13px; font-weight: 500;
  color: var(--text-primary);
  display: flex; align-items: center; gap: 4px;
}
.answer-time {
  font-size: 11px; color: var(--text-muted);
  font-weight: normal;
}

.answer-content {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.6;
}
.answer-content.pending {
  padding: 0;
}
.pending-alert {
  border-radius: 8px; margin: 0;
}
.pending-alert ::v-deep .el-alert__content {
  padding-right: 0;
}
.pending-alert p {
  margin: 4px 0 0; font-size: 13px;
  color: var(--text-secondary);
}

/* 审核未通过 */
.qa-reject {
  margin-top: 8px;
}
.qa-reject ::v-deep .el-alert {
  border-radius: 10px;
}
.qa-reject ::v-deep .el-alert__content {
  padding-right: 0;
}
.qa-reject p {
  margin: 4px 0; font-size: 13px;
  color: var(--text-secondary);
}
.qa-reject p:first-child {
  font-weight: 500; color: var(--text-primary);
}

/* ========== 空状态 ========== */
.empty-state { margin: 60px 0; }
::v-deep .el-empty__description {
  color: var(--text-secondary); font-size: 14px;
}

/* ========== 提问弹窗 ========== */
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

.dialog-tip {
  border-radius: 10px; margin-bottom: 16px;
}
.dialog-tip ::v-deep .el-alert__content { padding-right: 0; }

.tip-list {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 4px;
}
.tip-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--text-secondary);
}
.tip-item i {
  color: var(--success); font-size: 14px;
  margin-top: 2px; flex-shrink: 0;
}

.ask-form { margin-top: 8px; }

.form-textarea ::v-deep .el-textarea__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
  font-family: inherit;
}
.form-textarea ::v-deep .el-textarea__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.form-tip {
  font-size: 12px; color: var(--text-muted);
  margin-top: 6px;
  display: flex; align-items: flex-start; gap: 5px;
}
.form-tip i { font-size: 13px; margin-top: 1px; }

/* 匿名开关 */
.anonymous-switch {
  margin-right: 8px;
}
.anonymous-tip {
  font-size: 12px; color: var(--text-muted);
  display: flex; align-items: center; gap: 4px;
}
.anonymous-tip i { color: var(--warning); }

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}
.btn-submit {
  padding: 10px 28px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .course-qa {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --bg-answer: #334155;
    --border-color: #334155;
  }

  .qa-card,
  .qa-answer-section {
    background: var(--bg-card);
  }

  .form-textarea ::v-deep .el-textarea__inner {
    background: #334155; color: var(--text-primary);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .course-qa { padding: 16px; }

  .page-header { flex-direction: column; align-items: flex-start; }
  .header-left { width: 100%; }
  .header-actions { width: 100%; justify-content: space-between; }

  .qa-header { flex-direction: column; align-items: flex-start; }
  .qa-meta { margin-top: 8px; width: 100%; justify-content: space-between; }

  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px; font-weight: 500;
}
::v-deep .el-switch__core { border-radius: 10px; }
::v-deep .el-dialog__headerbtn { top: 18px; right: 20px; }
::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}
</style>