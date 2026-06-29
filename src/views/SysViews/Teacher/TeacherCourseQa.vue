<template>
  <div class="teacher-qa">

    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">💬 课程问答</h2>
        <p class="page-subtitle">查看并回复学生提问，支持匿名提问保护隐私</p>
      </div>
      <div class="header-actions">
        <el-tag size="mini" effect="dark" type="primary" class="course-tag">
          📚 {{ courseName }}
        </el-tag>
        <el-button
            size="small"
            icon="el-icon-refresh"
            @click="fetchQaList"
            :loading="loading"
            class="refresh-btn"
        >
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="qa-stats" v-if="qaList.length > 0">
      <el-tag size="mini" effect="dark" class="stat-tag">
        📊 共 {{ qaList.length }} 条提问
      </el-tag>
      <el-tag size="mini" type="success" effect="plain" class="stat-tag">
        ✅ 已回复 {{ qaList.filter(q => q.answer).length }}
      </el-tag>
      <el-tag size="mini" type="warning" effect="plain" class="stat-tag">
        ⏳ 待回复 {{ qaList.filter(q => !q.answer).length }}
      </el-tag>
      <el-tag size="mini" type="info" effect="plain" class="stat-tag">
        👤 匿名提问 {{ qaList.filter(q => q.isAnonymous).length }}
      </el-tag>
    </div>

    <!-- 提问列表 -->
    <div class="qa-list" v-loading="loading">

      <!-- 单个问答卡片 -->
      <el-card
          class="qa-card"
          shadow="hover"
          v-for="qa in qaList"
          :key="qa.qaId"
          :class="{ 'unanswered': !qa.answer, 'answered': qa.answer }"
      >
        <!-- 卡片头部：提问信息 -->
        <div class="qa-header">
          <div class="qa-user">
            <el-avatar
                :size="32"
                :icon="qa.isAnonymous ? 'el-icon-user' : 'el-icon-s-custom'"
                :class="{ 'anonymous': qa.isAnonymous }"
            />
            <div class="user-info">
              <span class="user-name">
                {{ qa.isAnonymous ? '👤 匿名同学' : qa.studentName }}
                <el-tag
                    v-if="qa.isAnonymous"
                    size="mini"
                    type="info"
                    effect="plain"
                    class="anon-tag"
                >
                  匿名
                </el-tag>
              </span>
              <span class="ask-time">
                <i class="el-icon-time"></i>
                {{ formatDateTime(qa.askTime) }}
              </span>
            </div>
          </div>

          <!-- 状态标签 -->
          <el-tag
              :type="qa.answer ? 'success' : 'warning'"
              :effect="qa.answer ? 'dark' : 'light'"
              size="mini"
              class="status-tag"
          >
            {{ qa.answer ? '✅ 已回复' : '⏳ 待回复' }}
          </el-tag>
        </div>

        <!-- 提问内容 -->
        <div class="qa-content">
          <div class="question-bubble">
            <span class="question-label">❓ 问：</span>
            <span class="question-text">{{ qa.question }}</span>
          </div>
        </div>

        <!-- 教师回复区域 -->
        <div class="answer-section">
          <!-- 已回复：显示回复内容 -->
          <div v-if="qa.answer" class="answer-bubble">
            <div class="answer-header">
              <span class="answer-label">👨‍🏫 教师回复：</span>
              <span class="answer-time" v-if="qa.answerTime">
                {{ formatDateTime(qa.answerTime) }}
              </span>
            </div>
            <p class="answer-text">{{ qa.answer }}</p>
            <div class="answer-actions">
              <el-button
                  size="mini"
                  type="text"
                  icon="el-icon-edit"
                  @click="openReplyDialog(qa)"
                  class="edit-btn"
              >
                修改回复
              </el-button>
            </div>
          </div>

          <!-- 未回复：显示回复按钮 -->
          <div v-else class="no-answer">
            <el-button
                type="primary"
                icon="el-icon-chat-dot-round"
                @click="openReplyDialog(qa)"
                class="reply-btn"
            >
              ✍️ 回复此问题
            </el-button>
            <span class="reply-hint">点击回复学生提问</span>
          </div>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty
          v-if="qaList.length === 0 && !loading"
          :image-size="150"
          description="暂无学生提问，好好享受安静的教学时光～ ☕"
          class="empty-state"
      >
        <el-button type="primary" @click="fetchQaList" icon="el-icon-refresh">
          刷新列表
        </el-button>
      </el-empty>

    </div>

    <!-- 分页（如果有后端支持） -->
    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
          @current-change="handlePageChange"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          background
      />
    </div>

    <!-- 回复弹窗 -->
    <el-dialog
        :title="replyForm.answer ? '✏️ 修改回复' : '💬 回复学生提问'"
        :visible.sync="replyDialogVisible"
        width="580px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="dialog-custom"
    >
      <!-- 问题预览 -->
      <div class="question-preview">
        <div class="preview-label">
          <i class="el-icon-question"></i> 学生提问：
        </div>
        <div class="preview-content">
          {{ replyForm.question }}
        </div>
        <div class="preview-meta" v-if="currentQa">
          <el-tag size="mini" :type="currentQa.isAnonymous ? 'info' : 'primary'" effect="plain">
            {{ currentQa.isAnonymous ? '匿名提问' : currentQa.studentName }}
          </el-tag>
          <span class="preview-time">
            <i class="el-icon-time"></i> {{ formatDateTime(currentQa.askTime) }}
          </span>
        </div>
      </div>

      <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="0">
        <el-form-item prop="answer">
          <el-input
              v-model="replyForm.answer"
              type="textarea"
              :rows="6"
              placeholder="请输入您的专业回复，建议：
• 先肯定学生的思考
• 清晰解答核心问题
• 必要时提供参考资料
• 保持友好鼓励的语气"
              maxlength="500"
              show-word-limit
              class="reply-input"
          />
        </el-form-item>
      </el-form>

      <!-- 回复建议（可选） -->
      <div class="reply-tips">
        <el-alert
            title="💡 回复小技巧"
            type="info"
            :closable="false"
            show-icon
            class="tip-alert"
        >
          <template #default>
            <p>• 回复尽量简洁明了，避免长篇大论</p>
            <p>• 涉及代码可用 \`反引号\` 包裹，便于阅读</p>
            <p>• 复杂问题可建议学生课后单独沟通</p>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="replyDialogVisible = false">取 消</el-button>
        <el-button
            v-if="replyForm.answer"
            type="warning"
            :loading="submitting"
            @click="handleSubmit"
            icon="el-icon-refresh"
        >
          {{ submitting ? '提交中...' : '更新回复' }}
        </el-button>
        <el-button
            v-else
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
            icon="el-icon-check"
        >
          {{ submitting ? '提交中...' : '发送回复' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TeacherCourseQa',

  data() {
    return {
      courseId: null,
      courseName: '',
      teacherId: null,

      qaList: [],
      loading: false,
      page: 1,
      pageSize: 20,
      total: 0,

      // 当前操作的问答
      currentQa: null,

      // 回复弹窗
      replyDialogVisible: false,
      submitting: false,
      replyForm: {
        qaId: null,
        question: '',
        answer: ''
      },
      replyRules: {
        answer: [
          { required: true, message: '请输入回复内容', trigger: 'blur' },
          { min: 1, max: 500, message: '回复长度在 1 到 500 个字符', trigger: 'blur' }
        ]
      }
    }
  },

  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.teacherId = userInfo.userId

    if (this.courseId && this.teacherId) {
      this.fetchQaList()
    }
  },

  methods: {
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()

      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')

      return isToday ? `今天 ${h}:${m}` : `${date.getMonth()+1}-${date.getDate()} ${h}:${m}`
    },

    // 获取问答列表
    async fetchQaList() {
      if (!this.courseId || !this.teacherId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/qa', {
          params: {
            courseId: this.courseId,
            teacherId: this.teacherId,
            page: this.page,
            size: this.pageSize
          }
        })
        if (resp.data.code === 1) {
          // 兼容后端可能返回 records 或直接数组
          const data = resp.data.data
          this.qaList = data.records || data || []
          this.total = resp.data.data.total || this.qaList.length
        }
      } catch (e) {
        console.error('Fetch QA error:', e)
        this.$message.error('加载提问列表失败')
      } finally {
        this.loading = false
      }
    },

    // 分页处理
    handlePageChange(newPage) {
      this.page = newPage
      this.fetchQaList()
    },

    // 打开回复弹窗
    openReplyDialog(qa) {
      this.currentQa = qa
      this.replyForm = {
        qaId: qa.qaId,
        question: qa.question,
        answer: qa.answer || ''
      }
      this.replyDialogVisible = true

      // 聚焦输入框（延迟确保弹窗渲染完成）
      this.$nextTick(() => {
        const textarea = this.$el.querySelector('.reply-input textarea')
        if (textarea) textarea.focus()
      })
    },

    // 提交回复
    async handleSubmit() {
      try {
        await this.$refs.replyFormRef.validate()
      } catch {
        return
      }

      this.submitting = true
      try {
        await axios.put(`/api/teacher/qa/${this.replyForm.qaId}/answer`, {
          answer: this.replyForm.answer,
          teacherId: Number(this.teacherId)
        })

        const isUpdate = !!this.replyForm.answer
        this.$message.success(isUpdate ? '✓ 回复已更新' : '🎉 回复发送成功')

        this.replyDialogVisible = false
        this.fetchQaList()  // 刷新列表
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '回复失败')
      } finally {
        this.submitting = false
      }
    },

    // 弹窗关闭回调
    handleDialogClose() {
      if (this.$refs.replyFormRef) {
        this.$refs.replyFormRef.resetFields()
      }
      this.currentQa = null
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.teacher-qa {
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
}

.course-tag {
  font-size: 13px;
}

.refresh-btn {
  padding: 8px 16px;
}

/* ========== 统计信息 ========== */
.qa-stats {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  margin: 0 20px 20px;
  border-radius: 8px;
  flex-wrap: wrap;
}

.stat-tag {
  font-size: 12px;
}

/* ========== 问答列表 ========== */
.qa-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 20px 20px;
}

.qa-card {
  border-radius: 12px;
  border-left: 4px solid #409eff;
  transition: all 0.2s ease;
}

.qa-card.unanswered {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, #fff 0%, #fffbf0 100%);
}

.qa-card.answered {
  border-left-color: #67c23a;
}

.qa-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

/* 卡片头部 */
.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #ebeef5;
}

.qa-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qa-user .el-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.qa-user .el-avatar.anonymous {
  background: linear-gradient(135deg, #909399 0%, #c0c4cc 100%);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.anon-tag {
  font-size: 10px;
  padding: 0 6px;
}

.ask-time {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-tag {
  font-size: 12px;
  padding: 4px 12px;
}

/* 提问内容 */
.qa-content {
  margin-bottom: 16px;
}

.question-bubble {
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f4ff 100%);
  border: 1px solid #dcdfe6;
  border-radius: 12px 12px 12px 4px;
  padding: 14px 18px;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  position: relative;
}

.question-bubble::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #dcdfe6;
}

.question-label {
  font-weight: 600;
  color: #409eff;
  margin-right: 4px;
}

/* 回复区域 */
.answer-section {
  border-top: 1px dashed #ebeef5;
  padding-top: 16px;
}

/* 已回复样式 */
.answer-bubble {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #b3d8ff;
  border-radius: 12px 12px 4px 12px;
  padding: 14px 18px;
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  position: relative;
}

.answer-bubble::before {
  content: '';
  position: absolute;
  right: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-left: 8px solid #b3d8ff;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.answer-label {
  font-weight: 600;
  color: #667eea;
}

.answer-time {
  color: #909399;
  font-size: 12px;
}

.answer-text {
  margin: 0 0 10px 0;
  white-space: pre-wrap;
}

.answer-actions {
  text-align: right;
}

.edit-btn {
  font-size: 12px;
  color: #909399;
  padding: 4px 8px;
}

.edit-btn:hover {
  color: #409eff;
}

/* 未回复样式 */
.no-answer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #fffbf0;
  border: 1px dashed #e6a23c;
  border-radius: 8px;
}

.reply-btn {
  padding: 10px 24px;
  font-weight: 500;
}

.reply-hint {
  font-size: 12px;
  color: #909399;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

.empty-state ::v-deep .el-empty__description {
  font-size: 14px;
  color: #909399;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
}

/* ========== 回复弹窗 ========== */
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

/* 问题预览 */
.question-preview {
  background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%);
  border: 1px solid #dcdfe6;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 20px;
}

.preview-label {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 10px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.preview-time {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 回复输入框 */
.reply-input ::v-deep .el-textarea__inner {
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
  min-height: 120px;
}

/* 回复建议 */
.reply-tips {
  margin-top: 16px;
}

.tip-alert {
  padding: 10px 14px;
  font-size: 12px;
}

.tip-alert ::v-deep .el-alert__content {
  line-height: 1.6;
}

.tip-alert p {
  margin: 4px 0;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .qa-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .qa-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .question-bubble,
  .answer-bubble {
    border-radius: 12px;
  }

  .question-bubble::before,
  .answer-bubble::before {
    display: none;
  }
}

.el-form-item__label {
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.el-input >>> .el-input__inner {
  border-radius: 10px;
  border: 1px solid #dcdfe6;
  height: 40px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.el-textarea >>> .el-textarea__inner {
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.el-message {
  z-index: 9999 !important;
}
</style>