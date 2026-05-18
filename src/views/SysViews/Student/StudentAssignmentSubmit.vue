<template>
  <div class="assignment-submit">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-edit-outline"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">作业提交</h2>
          <p class="page-subtitle">按时提交作业，巩固学习成果</p>
        </div>
      </div>
      <div class="course-badge">
        <i class="el-icon-reading"></i>
        <span>{{ courseName || '加载中...' }}</span>
      </div>
    </div>

    <!-- 作业列表 -->
    <div class="assignment-list" v-loading="loading">

      <!-- 单个作业卡片 -->
      <el-card
          v-for="assignment in assignmentList"
          :key="assignment.assignmentId"
          class="assignment-card"
          shadow="hover"
          :class="{
          'card-expired': isExpired(assignment),
          'card-submitted': assignment.mySubmission?.auditStatus === 'PASS'
        }"
      >
        <!-- 卡片顶部装饰条 -->
        <div class="card-decoration" :class="getCardDecorationClass(assignment)"></div>

        <div class="assignment-content">
          <!-- 作业标题区 -->
          <div class="assignment-header">
            <div class="header-main">
              <h3 class="assignment-title">{{ assignment.title }}</h3>
              <div class="header-badges">
                <el-tag
                    :type="isExpired(assignment) ? 'danger' : 'success'"
                    size="mini"
                    effect="dark"
                    class="status-tag"
                >
                  <i :class="isExpired(assignment) ? 'el-icon-time' : 'el-icon-clock'"></i>
                  {{ isExpired(assignment) ? '已截止' : '进行中' }}
                </el-tag>
                <el-tag
                    v-if="assignment.allowLate"
                    size="mini"
                    effect="plain"
                    class="late-tag"
                >
                  可迟交
                </el-tag>
              </div>
            </div>

            <!-- 截止时间 -->
            <div class="deadline-info" v-if="!isExpired(assignment)">
              <i class="el-icon-alarm-clock"></i>
              <span>截止：</span>
              <strong>{{ formatDeadline(assignment.deadline) }}</strong>
              <span class="countdown" v-if="getCountdown(assignment)">
                · 剩余 {{ getCountdown(assignment) }}
              </span>
            </div>
            <div class="deadline-info expired" v-else>
              <i class="el-icon-warning-outline"></i>
              <span>已截止：{{ formatDateTime(assignment.deadline) }}</span>
            </div>
          </div>

          <!-- 作业要求 -->
          <div class="assignment-description">
            <div class="desc-label">
              <i class="el-icon-document"></i>
              <span>作业要求</span>
            </div>
            <p class="desc-content">{{ assignment.description || '暂无详细说明' }}</p>
          </div>

          <!-- 提交状态区域 -->
          <div class="submission-area" v-if="assignment.mySubmission">
            <div class="submission-header">
              <span class="submission-label">我的提交</span>
              <el-tag
                  :type="getAuditTagType(assignment.mySubmission.auditStatus)"
                  size="mini"
                  effect="light"
                  class="audit-tag"
              >
                {{ getAuditText(assignment.mySubmission.auditStatus) }}
              </el-tag>
            </div>

            <div class="submission-details">
              <!-- 审核通过 -->
              <div v-if="assignment.mySubmission.auditStatus === 'PASS'" class="detail-passed">
                <div class="detail-item">
                  <i class="el-icon-s-flag"></i>
                  <span>得分：<strong class="score">{{ assignment.mySubmission.score }}</strong> 分</span>
                </div>
                <div v-if="assignment.mySubmission.teacherComment" class="detail-item">
                  <i class="el-icon-chat-line-square"></i>
                  <span>评语：{{ assignment.mySubmission.teacherComment }}</span>
                </div>
                <div class="detail-item">
                  <i class="el-icon-time"></i>
                  <span>提交：{{ formatDateTime(assignment.mySubmission.submitTime) }}</span>
                </div>
              </div>

              <!-- 待审核/已拒绝 -->
              <div v-else class="detail-pending">
                <div class="detail-item">
                  <i class="el-icon-time"></i>
                  <span>提交时间：{{ formatDateTime(assignment.mySubmission.submitTime) }}</span>
                </div>
                <div v-if="assignment.mySubmission.isLate" class="detail-item late">
                  <i class="el-icon-warning"></i>
                  <span>迟交提交</span>
                </div>
                <div v-if="assignment.mySubmission.auditStatus === 'REJECT'" class="detail-item reject">
                  <i class="el-icon-close"></i>
                  <span>拒绝原因：{{ assignment.mySubmission.rejectReason || '未填写' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮区 -->
          <div class="assignment-actions">
            <!-- 已提交：查看提交 -->
            <el-button
                v-if="assignment.mySubmission"
                size="small"
                type="text"
                @click="openViewDialog(assignment.mySubmission)"
                class="action-btn view"
            >
              <i class="el-icon-view"></i> 查看提交
            </el-button>

            <!-- 未提交/未通过：提交按钮 -->
            <el-button
                v-else
                size="small"
                :type="getSubmitButtonType(assignment)"
                :disabled="isExpired(assignment) && !assignment.allowLate"
                @click="openSubmitDialog(assignment)"
                class="action-btn submit"
                :class="{ 'btn-pulse': !assignment.mySubmission && !isExpired(assignment) }"
            >
              <i :class="getSubmitButtonIcon(assignment)"></i>
              {{ getSubmitButtonText(assignment) }}
            </el-button>

            <!-- 迟交提示 -->
            <span
                v-if="isExpired(assignment) && assignment.allowLate && !assignment.mySubmission"
                class="late-notice"
            >
              <i class="el-icon-warning-outline"></i> 迟交需填写理由
            </span>
          </div>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty
          v-if="!loading && assignmentList.length === 0"
          description="该课程暂无作业"
          :image-size="120"
      >
        <template #extra>
          <el-button type="primary" plain @click="$router.back()">
            <i class="el-icon-back"></i> 返回课程
          </el-button>
        </template>
      </el-empty>
    </div>

    <!-- 提交作业弹窗 -->
    <el-dialog
        :title="getSubmitDialogTitle()"
        :visible="submitDialogVisible"
        @close="submitDialogVisible = false"
        width="580px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="submit-dialog"
        custom-class="modal-custom"
    >
      <!-- 迟交提醒 -->
      <el-alert
          v-if="isExpired(currentAssignment) && currentAssignment?.allowLate"
          title="⚠️ 迟交提醒"
          type="warning"
          :closable="false"
          show-icon
          class="dialog-tip"
          effect="light"
      >
        <template #default>
          <p>您正在迟交作业，请务必填写迟交理由，老师将据此评分</p>
        </template>
      </el-alert>

      <el-form
          :model="submitForm"
          :rules="submitRules"
          ref="submitFormRef"
          label-width="95px"
          class="submit-form"
      >
        <!-- 作业标题 -->
        <el-form-item label="作业" prop="assignmentTitle">
          <el-input
              v-model="submitForm.assignmentTitle"
              disabled
              class="form-input readonly"
              prefix-icon="el-icon-document"
          />
        </el-form-item>

        <!-- 提交类型 -->
        <el-form-item label="提交方式" prop="contentType">
          <el-radio-group
              v-model="submitForm.contentType"
              @change="handleContentTypeChange"
              class="content-type-radio"
          >
            <el-radio label="TEXT" border class="radio-option text">
              <i class="el-icon-edit"></i> 文本
            </el-radio>
            <el-radio label="FILE" border class="radio-option file">
              <i class="el-icon-upload"></i> 文件
            </el-radio>
            <el-radio label="CODE" border class="radio-option code">
              <i class="el-icon-connection"></i> 代码
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 文本内容输入 -->
        <el-form-item
            v-if="submitForm.contentType === 'TEXT'"
            label="作业内容"
            prop="textContent"
        >
          <el-input
              v-model="submitForm.textContent"
              type="textarea"
              :rows="8"
              placeholder="请输入您的作业内容，支持换行排版..."
              maxlength="2000"
              show-word-limit
              class="form-textarea"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            建议分段清晰，重点内容可使用 **加粗** 标记
          </div>
        </el-form-item>

        <!-- 代码内容输入 -->
        <el-form-item
            v-else-if="submitForm.contentType === 'CODE'"
            label="代码内容"
            prop="textContent"
        >
          <el-input
              v-model="submitForm.textContent"
              type="textarea"
              :rows="10"
              placeholder="// 请输入您的代码..."
              class="form-textarea code-editor"
          />
          <div class="form-tip code-tip">
            <i class="el-icon-lightbulb"></i>
            建议添加必要注释，便于老师理解代码逻辑
          </div>
        </el-form-item>

        <!-- 文件上传 -->
        <el-form-item
            v-else
            label="上传文件"
            prop="filePath"
        >
          <el-upload
              ref="uploadRef"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :on-progress="handleUploadProgress"
              :file-list="fileList"
              :limit="1"
              accept=".pdf,.doc,.docx,.txt,.zip,.rar,.py,.java,.cpp,.js"
              :auto-upload="true"
              class="file-upload"
          >
            <el-button size="small" type="primary" icon="el-icon-folder-opened">
              选择文件
            </el-button>
            <div slot="tip" class="upload-tip">
              支持 pdf/doc/txt/zip/代码文件等，最大 50MB
            </div>
          </el-upload>

          <!-- 上传进度 -->
          <el-progress
              v-if="uploading"
              :percentage="uploadProgress"
              :status="uploadProgress === 100 ? 'success' : ''"
              class="upload-progress"
          />
        </el-form-item>

        <!-- 迟交理由 -->
        <el-form-item
            v-if="isExpired(currentAssignment) && currentAssignment?.allowLate"
            label="迟交理由"
            prop="lateReason"
            class="late-reason-item"
        >
          <el-input
              v-model="submitForm.lateReason"
              type="textarea"
              :rows="3"
              placeholder="请简要说明迟交原因，这将影响作业评分..."
              maxlength="200"
              show-word-limit
              class="form-textarea"
          />
          <div class="form-tip required">
            <i class="el-icon-warning"></i>
            迟交作业必须填写理由，否则无法提交
          </div>
        </el-form-item>

      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="submitDialogVisible = false" :disabled="submitting">
            取 消
          </el-button>
          <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              class="btn-submit"
          >
            {{ submitting ? '提交中...' : '🚀 确 定 提 交' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 🎯 查看提交详情弹窗（参考教师端完善） -->
    <el-dialog
        title="📋 提交详情"
        :visible="viewDialogVisible"
        @close="viewDialogVisible = false"
        width="650px"
        :close-on-click-modal="false"
        class="view-dialog"
        custom-class="modal-custom"
    >
      <!-- 提交基本信息 -->
      <div class="view-header">
        <div class="view-badges">
          <el-tag :type="getAuditTagType(viewSubmission.auditStatus)" effect="dark">
            {{ getAuditText(viewSubmission.auditStatus) }}
          </el-tag>
          <el-tag v-if="viewSubmission.isLate" type="danger" effect="plain" style="margin-left: 8px">
            <i class="el-icon-warning"></i> 迟交
          </el-tag>
        </div>
        <div class="view-meta">
          <span><i class="el-icon-time"></i> {{ formatDateTime(viewSubmission.submitTime) }}</span>
        </div>
      </div>

      <!-- 提交内容展示 -->
      <div class="view-content">
        <!-- 文本内容 -->
        <div v-if="viewSubmission.contentType === 'TEXT'" class="content-text">
          <div class="content-label">
            <i class="el-icon-edit"></i>
            <span>作业内容</span>
          </div>
          <pre class="text-preview">{{ viewSubmission.textContent }}</pre>
        </div>

        <!-- 文件内容 -->
        <div v-else-if="viewSubmission.contentType === 'FILE'" class="content-file">
          <div class="content-label">
            <i class="el-icon-document"></i>
            <span>提交文件</span>
          </div>
          <div class="file-preview">
            <i class="el-icon-folder-opened file-icon"></i>
            <div class="file-info">
              <span class="file-name">{{ getFileName(viewSubmission.filePath) }}</span>
              <span class="file-size">{{ formatFileSize(viewSubmission.fileSize) }}</span>
            </div>
            <el-button
                type="primary"
                size="small"
                :href="viewSubmission.filePath"
                target="_blank"
                class="btn-download"
            >
              <i class="el-icon-download"></i> 下载文件
            </el-button>
          </div>
        </div>

        <!-- 代码内容 -->
        <div v-else-if="viewSubmission.contentType === 'CODE'" class="content-code">
          <div class="content-label">
            <i class="el-icon-connection"></i>
            <span>提交代码</span>
          </div>
          <pre
              class="code-preview"
              :class="{ 'code-wrap': codeWrap }"
              v-highlight="getCodeLanguage(viewSubmission.contentType)"
          >{{ viewSubmission.textContent }}</pre>
          <div class="code-tip">
            <i class="el-icon-info"></i>
            代码仅供参考，最终以老师批改为准
          </div>
        </div>
      </div>

      <!-- 批改结果（仅审核通过时显示） -->
      <div v-if="viewSubmission.auditStatus === 'PASS'" class="view-grade">
        <div class="grade-header">
          <i class="el-icon-s-flag"></i>
          <span>批改结果</span>
        </div>
        <div class="grade-body">
          <div class="grade-score">
            <span class="score-label">得分</span>
            <span class="score-value">{{ viewSubmission.score }}</span>
            <span class="score-unit">/ 100</span>
          </div>
          <div v-if="viewSubmission.teacherComment" class="grade-comment">
            <span class="comment-label">评语</span>
            <p class="comment-content">{{ viewSubmission.teacherComment }}</p>
          </div>
        </div>
      </div>

      <!-- 拒绝原因（仅被拒绝时显示） -->
      <div v-if="viewSubmission.auditStatus === 'REJECT'" class="view-reject">
        <el-alert
            title="❌ 提交被拒绝"
            type="error"
            :closable="false"
            show-icon
            effect="light"
        >
          <template #default>
            <p><strong>拒绝原因：</strong>{{ viewSubmission.rejectReason || '老师未填写具体原因' }}</p>
            <p style="margin-top: 8px">
              <el-button size="small" type="primary" @click="resubmitAssignment">
                <i class="el-icon-refresh"></i> 重新提交
              </el-button>
            </p>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="viewDialogVisible = false">
            关 闭
          </el-button>
          <el-button
              v-if="viewSubmission.auditStatus !== 'PASS'"
              type="primary"
              @click="resubmitFromView"
          >
            <i class="el-icon-refresh"></i> 重新提交
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 🔍 代码全屏查看弹窗 -->
    <el-dialog
        title="🔍 代码预览"
        :visible="codeFullDialogVisible"
        @close="codeFullDialogVisible = false"
        width="80%"
        :close-on-click-modal="false"
        class="code-full-dialog"
        custom-class="modal-custom"
    >
      <div class="code-full-header">
        <el-tag size="mini" effect="plain">
          <i class="el-icon-connection"></i> {{ getCodeLanguageName(viewSubmission.contentType) }}
        </el-tag>
        <span class="code-full-meta">
          <i class="el-icon-time"></i> {{ formatDateTime(viewSubmission.submitTime) }}
        </span>
      </div>
      <pre
          class="code-full-preview"
          v-highlight="getCodeLanguage(viewSubmission.contentType)"
      >{{ viewSubmission.textContent }}</pre>
      <div class="code-full-footer">
        <el-button size="small" @click="copyCode">
          <i class="el-icon-document-copy"></i> 复制代码
        </el-button>
        <el-button size="small" @click="downloadCode">
          <i class="el-icon-download"></i> 下载代码
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentAssignmentSubmit',

  data() {
    const validateLateReason = (rule, value, callback) => {
      if (this.isExpired(this.currentAssignment) && this.currentAssignment?.allowLate) {
        if (!value || value.trim() === '') {
          callback(new Error('迟交作业必须填写理由'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }

    return {
      courseId: null,
      courseName: '',
      studentId: null,

      assignmentList: [],
      loading: false,

      // 提交弹窗
      submitDialogVisible: false,
      submitting: false,
      currentAssignment: null,
      submitForm: {
        assignmentId: null,
        assignmentTitle: '',
        contentType: 'TEXT',
        textContent: '',
        filePath: '',
        lateReason: ''
      },
      submitRules: {
        textContent: [{ required: true, message: '请输入作业内容', trigger: 'blur' }],
        filePath: [{ required: true, message: '请上传文件', trigger: 'change' }],
        lateReason: [{ validator: validateLateReason, trigger: 'blur' }]
      },

      // 文件上传
      fileList: [],
      uploading: false,
      uploadProgress: 0,
      uploadUrl: '/api/common/upload',
      uploadHeaders: {},

      // 🎯 查看提交详情（新增）
      viewDialogVisible: false,
      viewSubmission: {},
      codeWrap: false,
      codeFullDialogVisible: false
    }
  },

  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.courseId && this.studentId) {
      this.fetchAssignments()
    }
  },

  methods: {
    async fetchAssignments() {
      if (!this.courseId || !this.studentId) return
      this.loading = true
      try {
        const resp = await axios.get('/api/student/assignments', {
          params: { courseId: this.courseId, studentId: this.studentId }
        })
        if (resp.data.code === 1) {
          this.assignmentList = resp.data.data || []
        }
      } catch (e) {
        console.error('Fetch assignments error:', e)
        this.$message.error('加载作业列表失败')
      } finally {
        this.loading = false
      }
    },

    isExpired(assignment) {
      if (!assignment?.deadline) return false
      return new Date(assignment.deadline) < new Date()
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime.replace('T', ' ').substring(0, 16)
    },

    formatDeadline(deadline) {
      if (!deadline) return '-'
      const date = new Date(deadline)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) {
        return `今天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
      }
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    getCountdown(assignment) {
      if (!assignment?.deadline || this.isExpired(assignment)) return null
      const diff = new Date(assignment.deadline) - new Date()
      if (diff <= 0) return null
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      if (hours > 24) {
        const days = Math.floor(hours / 24)
        return `${days}天${hours % 24}小时`
      }
      return `${hours}小时${minutes}分`
    },

    getCardDecorationClass(assignment) {
      if (assignment.mySubmission?.auditStatus === 'PASS') return 'decoration-passed'
      if (this.isExpired(assignment)) return 'decoration-expired'
      return 'decoration-active'
    },

    getAuditTagType(status) {
      const map = { 'PENDING': 'warning', 'PASS': 'success', 'REJECT': 'danger' }
      return map[status] || 'info'
    },

    getAuditText(status) {
      const map = { 'PENDING': '待审核', 'PASS': '已通过', 'REJECT': '已拒绝' }
      return map[status] || status
    },

    getSubmitButtonType(assignment) {
      if (this.isExpired(assignment) && !assignment.allowLate) return 'info'
      if (assignment.mySubmission?.auditStatus === 'REJECT') return 'warning'
      return 'primary'
    },

    getSubmitButtonIcon(assignment) {
      if (assignment.mySubmission?.auditStatus === 'REJECT') return 'el-icon-refresh'
      return 'el-icon-upload'
    },

    getSubmitButtonText(assignment) {
      if (assignment.mySubmission?.auditStatus === 'REJECT') return '重新提交'
      if (this.isExpired(assignment) && assignment.allowLate) return '迟交提交'
      return assignment.mySubmission ? '重新提交' : '提交作业'
    },

    // 🎯 完善：查看提交详情（参考教师端方式）
    openViewDialog(submission) {
      this.viewSubmission = { ...submission }
      this.codeWrap = false
      this.viewDialogVisible = true
    },

    // 切换代码换行
    toggleCodeWrap() {
      this.codeWrap = !this.codeWrap
    },

    // 从查看弹窗重新提交
    resubmitFromView() {
      this.viewDialogVisible = false
      // 找到对应的作业并打开提交弹窗
      const assignment = this.assignmentList.find(a =>
          a.mySubmission?.submissionId === this.viewSubmission.submissionId
      )
      if (assignment) {
        this.openSubmitDialog(assignment)
      }
    },

    // 重新提交作业
    resubmitAssignment() {
      this.viewDialogVisible = false
      const assignment = this.assignmentList.find(a =>
          a.mySubmission?.submissionId === this.viewSubmission.submissionId
      )
      if (assignment) {
        this.openSubmitDialog(assignment)
      }
    },

    // 获取文件名
    getFileName(filePath) {
      if (!filePath) return '未知文件'
      const parts = filePath.split('/')
      return parts[parts.length - 1]
    },

    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes) return ''
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    },

    // 获取代码语言标识（用于高亮）
    getCodeLanguage(contentType) {
      const map = { 'CODE': 'javascript', 'TEXT': 'plaintext', 'FILE': 'plaintext' }
      return map[contentType] || 'plaintext'
    },

    // 获取代码语言名称（用于显示）
    getCodeLanguageName(contentType) {
      const map = {
        'CODE': '💻 代码',
        'TEXT': '📝 文本',
        'FILE': '📎 文件'
      }
      return map[contentType] || '内容'
    },

    // 复制代码
    copyCode() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.viewSubmission.textContent || '')
            .then(() => this.$message.success('✅ 代码已复制'))
            .catch(() => this.fallbackCopy())
      } else {
        this.fallbackCopy()
      }
    },

    fallbackCopy() {
      const textarea = document.createElement('textarea')
      textarea.value = this.viewSubmission.textContent || ''
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        this.$message.success('✅ 代码已复制')
      } catch (e) {
        this.$message.error('❌ 复制失败')
      }
      document.body.removeChild(textarea)
    },

    // 下载代码
    downloadCode() {
      const content = this.viewSubmission.textContent || ''
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submission_${this.viewSubmission.submissionId}.txt`
      a.click()
      URL.revokeObjectURL(url)
      this.$message.success('✅ 代码已下载')
    },

    getSubmitDialogTitle() {
      if (!this.currentAssignment) return '提交作业'
      const prefix = this.currentAssignment.mySubmission ? '重新' : ''
      const suffix = this.isExpired(this.currentAssignment) && this.currentAssignment.allowLate ? '（迟交）' : ''
      return `${prefix}提交作业${suffix}`
    },

    openSubmitDialog(assignment) {
      this.currentAssignment = assignment
      this.submitForm = {
        assignmentId: assignment.assignmentId,
        assignmentTitle: assignment.title,
        contentType: 'TEXT',
        textContent: '',
        filePath: '',
        lateReason: ''
      }
      this.fileList = []
      this.uploadProgress = 0
      this.submitDialogVisible = true

      this.$nextTick(() => {
        const input = this.$refs.submitFormRef?.$el?.querySelector('input, textarea')
        if (input) input.focus()
      })
    },

    handleContentTypeChange() {
      if (this.submitForm.contentType === 'TEXT' || this.submitForm.contentType === 'CODE') {
        this.submitForm.filePath = ''
        this.fileList = []
      } else {
        this.submitForm.textContent = ''
      }
    },

    beforeUpload(file) {
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        this.$message.error('❌ 文件大小不能超过 50MB!')
        return false
      }
      const ext = file.name.split('.').pop().toLowerCase()
      const allowed = ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'py', 'java', 'cpp', 'js', 'c', 'h']
      if (!allowed.includes(ext)) {
        this.$message.error('❌ 不支持的文件类型')
        return false
      }
      this.uploading = true
      this.uploadProgress = 0
      return true
    },

    handleUploadProgress(event) {
      this.uploadProgress = Math.round(event.percent)
    },

    handleUploadSuccess(response) {
      this.uploading = false
      if (response.code === 1) {
        this.submitForm.filePath = response.data.filePath
        this.submitForm.fileSize = response.data.fileSize
        this.$message.success('✅ 文件上传成功')
      } else {
        this.$message.error(response.msg || '❌ 上传失败')
      }
    },

    handleUploadError() {
      this.uploading = false
      this.$message.error('❌ 文件上传失败，请检查网络')
    },

    async handleSubmit() {
      try {
        await this.$refs.submitFormRef.validate()
      } catch {
        return
      }

      if (this.submitForm.contentType === 'FILE' && !this.submitForm.filePath) {
        this.$message.warning('请先上传文件')
        return
      }

      this.submitting = true
      try {
        const submitData = {
          ...this.submitForm,
          studentId: this.studentId,
          isLate: this.isExpired(this.currentAssignment)
        }
        await axios.post('/api/student/submissions', submitData)
        this.$message.success('✅ 提交成功，等待老师审核')
        this.submitDialogVisible = false
        this.fetchAssignments()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '❌ 提交失败')
      } finally {
        this.submitting = false
      }
    },

    handleDialogClose() {
      this.$refs.submitFormRef?.resetFields()
      this.$refs.uploadRef?.clearFiles()
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.assignment-submit {
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

.course-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: white;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  font-size: 13px; font-weight: 500;
  color: var(--text-primary);
}
.course-badge i { color: var(--primary); }

/* ========== 作业列表 ========== */
.assignment-list {
  display: flex; flex-direction: column; gap: 16px;
}

.assignment-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.assignment-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
.assignment-card.card-expired { opacity: 0.85; }
.assignment-card.card-submitted {
  border-left: 4px solid var(--success);
}

.card-decoration {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.card-decoration.decoration-active { background: linear-gradient(90deg, var(--success), #16a34a); }
.card-decoration.decoration-expired { background: linear-gradient(90deg, var(--danger), #dc2626); }
.card-decoration.decoration-passed { background: linear-gradient(90deg, var(--primary), var(--primary-hover)); }

.assignment-content { padding: 20px; }

/* 作业标题区 */
.assignment-header { margin-bottom: 16px; }
.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.assignment-title {
  font-size: 17px; font-weight: 600;
  color: var(--text-primary); margin: 0;
  line-height: 1.4;
}
.header-badges { display: flex; gap: 8px; flex-shrink: 0; }
.status-tag { font-weight: 500; }
.late-tag { font-size: 11px; }

/* 截止时间 */
.deadline-info {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary);
  padding: 8px 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}
.deadline-info i { color: var(--warning); font-size: 14px; }
.deadline-info strong { color: var(--text-primary); font-weight: 600; }
.deadline-info .countdown { color: var(--primary); font-weight: 500; }
.deadline-info.expired {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.2);
}
.deadline-info.expired i { color: var(--danger); }

/* 作业要求 */
.assignment-description {
  margin-bottom: 16px;
  padding: 12px 14px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}
.desc-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--text-primary); margin-bottom: 8px;
}
.desc-label i { color: var(--primary); }
.desc-content {
  font-size: 14px; color: var(--text-secondary);
  line-height: 1.6; margin: 0;
  white-space: pre-wrap;
}

/* 提交状态区域 */
.submission-area {
  margin-bottom: 16px;
  padding: 14px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 10px;
  border: 1px solid var(--border-color);
}
.submission-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.submission-label {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary);
}
.audit-tag { font-weight: 500; }

.submission-details {
  display: flex; flex-direction: column; gap: 6px;
}
.detail-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--text-secondary);
}
.detail-item i { font-size: 13px; color: var(--text-muted); }
.detail-item strong { font-weight: 600; }
.detail-passed .score {
  color: var(--primary); font-size: 16px;
}
.detail-item.late { color: var(--warning); }
.detail-item.late i { color: var(--warning); }
.detail-item.reject { color: var(--danger); }
.detail-item.reject i { color: var(--danger); }

/* 操作按钮区 */
.assignment-actions {
  display: flex; align-items: center; gap: 12px;
  flex-wrap: wrap;
}
.action-btn {
  font-size: 13px; padding: 8px 16px;
  border-radius: 8px; font-weight: 500;
  transition: all 0.15s;
}
.action-btn.view { color: var(--primary); }
.action-btn.view:hover { background: var(--primary-light); }
.action-btn.submit {
  display: flex; align-items: center; gap: 5px;
}
.btn-pulse {
  animation: btnPulse 2s infinite;
}
@keyframes btnPulse {
  0% { box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
  50% { box-shadow: 0 6px 18px rgba(79, 70, 229, 0.5); }
  100% { box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
}
.late-notice {
  font-size: 12px; color: var(--warning);
  display: flex; align-items: center; gap: 4px;
}
.late-notice i { font-size: 13px; }

/* ========== 提交弹窗 ========== */
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
.dialog-tip p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); }

.submit-form { margin-top: 8px; }
.form-input ::v-deep .el-input__inner {
  border-radius: 10px; border: 2px solid var(--border-color);
  transition: all 0.2s;
}
.form-input.readonly ::v-deep .el-input__inner {
  background: #f8fafc; cursor: not-allowed;
}
.form-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* 提交类型单选 */
.content-type-radio {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.content-type-radio ::v-deep .el-radio { margin-right: 0; }
.content-type-radio ::v-deep .el-radio__label {
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; font-weight: 500;
}
.content-type-radio ::v-deep .el-radio.is-bordered {
  border-radius: 10px; border: 2px solid var(--border-color);
  padding: 10px 16px; transition: all 0.2s;
}
.content-type-radio ::v-deep .el-radio.is-bordered:hover {
  border-color: var(--primary);
}
.content-type-radio ::v-deep .el-radio.is-bordered.is-checked {
  border-color: var(--primary);
  background: var(--primary-light);
}
.radio-option.text ::v-deep .el-radio__label i { color: var(--primary); }
.radio-option.file ::v-deep .el-radio__label i { color: var(--success); }
.radio-option.code ::v-deep .el-radio__label i { color: var(--warning); }

/* 文本域 */
.form-textarea ::v-deep .el-textarea__inner {
  border-radius: 10px; border: 2px solid var(--border-color);
  transition: all 0.2s; font-family: inherit;
}
.form-textarea ::v-deep .el-textarea__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}
.form-textarea.code-editor ::v-deep .el-textarea__inner {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px; line-height: 1.5;
}
.form-tip {
  font-size: 12px; color: var(--text-muted);
  margin-top: 6px; display: flex; align-items: flex-start; gap: 5px;
}
.form-tip i { font-size: 13px; margin-top: 1px; }
.form-tip.required { color: var(--danger); }
.form-tip.code-tip { color: var(--warning); }

/* 文件上传 */
.file-upload { width: 100%; }
.upload-tip { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
.upload-progress { margin-top: 10px; }

/* 迟交理由 */
.late-reason-item ::v-deep .el-form-item__label {
  color: var(--danger); font-weight: 600;
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}
.btn-submit {
  padding: 10px 28px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
}

/* ========== 🎯 查看提交详情弹窗 ========== */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}
.view-badges { display: flex; align-items: center; }
.view-meta {
  font-size: 13px; color: var(--text-muted);
}
.view-meta i { margin-right: 4px; }

.view-content {
  margin-bottom: 20px;
}

.content-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--text-primary); margin-bottom: 10px;
}
.content-label i { color: var(--primary); }
.content-label .btn-wrap {
  margin-left: auto; font-size: 12px;
}

/* 文本预览 */
.text-preview {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  font-size: 14px; line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

/* 文件预览 */
.file-preview {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}
.file-icon {
  font-size: 28px; color: var(--primary);
}
.file-info {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
}
.file-name {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
}
.file-size {
  font-size: 12px; color: var(--text-muted);
}
.btn-download {
  border-radius: 8px;
}

/* 代码预览 */
.code-preview {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 16px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px; line-height: 1.5;
  color: #e2e8f0;
  max-height: 350px;
  overflow: auto;
  white-space: pre;
}
.code-preview.code-wrap {
  white-space: pre-wrap;
  word-break: break-all;
}
.code-tip {
  margin-top: 8px;
  font-size: 12px; color: var(--text-muted);
  display: flex; align-items: center; gap: 4px;
}

/* 批改结果 */
.view-grade {
  padding: 16px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(22, 163, 74, 0.08));
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
}
.grade-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600;
  color: var(--success); margin-bottom: 12px;
}
.grade-body {
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
}
.grade-score {
  display: flex; align-items: baseline; gap: 4px;
}
.score-label { font-size: 13px; color: var(--text-secondary); }
.score-value {
  font-size: 28px; font-weight: 700;
  color: var(--primary);
}
.score-unit { font-size: 14px; color: var(--text-muted); }
.grade-comment { flex: 1; min-width: 200px; }
.comment-label {
  font-size: 13px; color: var(--text-secondary);
  margin-bottom: 4px; display: block;
}
.comment-content {
  font-size: 14px; color: var(--text-primary);
  line-height: 1.5; margin: 0;
}

/* 拒绝原因 */
.view-reject { margin-bottom: 16px; }
.view-reject ::v-deep .el-alert {
  border-radius: 10px;
}
.view-reject ::v-deep .el-alert__content {
  padding-right: 0;
}
.view-reject p {
  margin: 4px 0; font-size: 13px;
  color: var(--text-secondary);
}
.view-reject p:first-child {
  font-weight: 500; color: var(--text-primary);
}

/* ========== 🔍 代码全屏弹窗 ========== */
.code-full-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 12px; margin-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}
.code-full-meta {
  font-size: 12px; color: var(--text-muted);
}
.code-full-preview {
  background: #1e293b;
  border-radius: 10px;
  padding: 20px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px; line-height: 1.6;
  color: #e2e8f0;
  max-height: 60vh;
  overflow: auto;
  white-space: pre;
}
.code-full-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  margin-top: 16px; padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .assignment-submit {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --border-color: #334155;
  }
  .course-badge,
  .assignment-card,
  .assignment-description,
  .submission-area,
  .text-preview,
  .file-preview {
    background: var(--bg-card);
  }
  .form-input ::v-deep .el-input__inner,
  .form-textarea ::v-deep .el-textarea__inner {
    background: #334155; color: var(--text-primary);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .assignment-submit { padding: 16px; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-left { width: 100%; }
  .header-main { flex-direction: column; align-items: flex-start; }
  .header-badges { margin-top: 8px; }
  .assignment-actions { flex-direction: column; align-items: flex-start; }
  .action-btn { width: 100%; justify-content: center; }
  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
  .view-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .grade-body { flex-direction: column; align-items: flex-start; gap: 12px; }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px; font-weight: 500;
}
::v-deep .el-empty__description { color: var(--text-secondary); }
::v-deep .el-dialog__headerbtn { top: 18px; right: 20px; }
::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}
</style>