<template>
  <div class="assignment-submit">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">作业提交</h2>
      <p class="course-info">
        课程：<el-tag size="mini">{{ courseName }}</el-tag>
      </p>
    </div>

    <!-- 作业列表 -->
    <el-card class="assignment-card" shadow="never" v-for="assignment in assignmentList" :key="assignment.assignmentId">
      <div class="assignment-header">
        <h3 class="assignment-title">{{ assignment.title }}</h3>
        <el-tag :type="isExpired(assignment) ? 'danger' : 'success'" size="mini">
          {{ isExpired(assignment) ? '已截止' : '进行中' }}
        </el-tag>
      </div>

      <div class="assignment-info">
        <p><strong>要求：</strong>{{ assignment.description }}</p>
        <p><strong>截止时间：</strong>{{ formatDateTime(assignment.deadline) }}</p>
        <p><strong>允许迟交：</strong>{{ assignment.allowLate ? '是' : '否' }}</p>
      </div>

      <!-- 提交状态 -->
      <div class="submission-status" v-if="assignment.mySubmission">
        <el-tag :type="getAuditTagType(assignment.mySubmission.auditStatus)" size="mini">
          {{ getAuditText(assignment.mySubmission.auditStatus) }}
        </el-tag>
        <span v-if="assignment.mySubmission.auditStatus === 'PASS'" class="score">
          分数：{{ assignment.mySubmission.score }}
        </span>
        <span v-if="assignment.mySubmission.teacherComment" class="comment">
          评语：{{ assignment.mySubmission.teacherComment }}
        </span>
      </div>

      <!-- 操作区 -->
      <div class="assignment-actions">
        <!-- 已提交且审核通过：显示查看 -->
        <el-button
            v-if="assignment.mySubmission?.auditStatus === 'PASS'"
            size="mini"
            type="text"
            @click="viewSubmission(assignment.mySubmission)"
        >
          查看提交
        </el-button>

        <!-- 未提交或审核未通过：显示提交按钮 -->
        <el-button
            v-else
            size="mini"
            :type="isExpired(assignment) && !assignment.allowLate ? 'info' : 'primary'"
            :disabled="isExpired(assignment) && !assignment.allowLate"
            @click="openSubmitDialog(assignment)"
        >
          {{ assignment.mySubmission ? '重新提交' : '提交作业' }}
        </el-button>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="assignmentList.length === 0" description="该课程暂无作业" />

    <!-- 提交作业弹窗 - 标题动态显示 -->
    <el-dialog
        :title="getSubmitDialogTitle()"
        :visible.sync="submitDialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="submitForm" :rules="submitRules" ref="submitFormRef" label-width="100px">

        <el-form-item label="作业" prop="assignmentTitle">
          <el-input v-model="submitForm.assignmentTitle" disabled />
        </el-form-item>

        <el-form-item label="提交类型" prop="contentType">
          <el-radio-group v-model="submitForm.contentType" @change="handleContentTypeChange">
            <el-radio label="TEXT">文本内容</el-radio>
            <el-radio label="FILE">上传文件</el-radio>
            <el-radio label="CODE">代码</el-radio>
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
              :rows="6"
              placeholder="请输入作业内容..."
              maxlength="2000"
              show-word-limit
          />
        </el-form-item>

        <!-- 代码内容输入 -->
        <el-form-item
            v-else-if="submitForm.contentType === 'CODE'"
            label="代码"
            prop="textContent"
        >
          <el-input
              v-model="submitForm.textContent"
              type="textarea"
              :rows="6"
              placeholder="请输入代码内容..."
              show-word-limit
          />
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
              :file-list="fileList"
              :limit="1"
              accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              :auto-upload="true"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">
              支持 pdf/doc/txt/zip 等格式，最大 50MB
            </div>
          </el-upload>
        </el-form-item>

        <!-- 迟交理由表单项下方添加提示 -->
        <el-form-item
            v-if="isExpired(currentAssignment) && currentAssignment?.allowLate"
            label="迟交理由"
            prop="lateReason"
        >
          <el-input
              v-model="submitForm.lateReason"
              type="textarea"
              :rows="2"
              placeholder="请输入迟交原因（必填）"
              maxlength="200"
              show-word-limit
          />
          <!-- ⭐ 醒目提示 -->
          <div class="form-tip" style="color: #f56c6c; margin-top: 4px">
            <i class="el-icon-warning"></i> 迟交作业必须填写理由，否则无法提交
          </div>
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="submitDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentAssignmentSubmit',

  data() {
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
        contentType: 'TEXT',  // TEXT 或 FILE
        textContent: '',
        filePath: '',
        lateReason: ''
      },
      submitRules: {
        textContent: [
          { required: true, message: '请输入作业内容', trigger: 'blur' }
        ],
        filePath: [
          { required: true, message: '请上传文件', trigger: 'change' }
        ],
        // ⭐ 新增：迟交理由动态校验
        lateReason: [
          {
            validator: (rule, value, callback) => {
              // 只有已截止且允许迟交时，理由才必填
              if (this.isExpired(this.currentAssignment) &&
                  this.currentAssignment?.allowLate) {
                if (!value || value.trim() === '') {
                  callback(new Error('迟交作业必须填写理由'))
                } else {
                  callback()
                }
              } else {
                callback()  // 非迟交情况不校验
              }
            },
            trigger: 'blur'
          }
        ]
      },

      // 文件上传
      fileList: [],
      uploadUrl: '/api/common/upload',
      uploadHeaders: {}
    }
  },

  created() {
    // 获取路由参数
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    // 获取当前学生
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
          params: {
            courseId: this.courseId,
            studentId: this.studentId
          }
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
      return dateTime
    },

    getAuditTagType(status) {
      const map = { 'PENDING': 'warning', 'PASS': 'success', 'REJECT': 'danger' }
      return map[status] || 'info'
    },

    getAuditText(status) {
      const map = { 'PENDING': '待审核', 'PASS': '已通过', 'REJECT': '已拒绝' }
      return map[status] || status
    },

    viewSubmission(submission) {
      // 简化：弹窗显示提交内容
      const content = submission.contentType === 'TEXT'
          ? submission.textContent
          : `<a href="${submission.filePath}" target="_blank">下载文件</a>`

      this.$alert(`
        <strong>提交时间：</strong>${this.formatDateTime(submission.submitTime)}<br>
        <strong>是否迟交：</strong>${submission.isLate ? '是' : '否'}<br>
        <strong>内容：</strong><br>${content}
      `, '查看提交', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      })
    },

// 动态获取弹窗标题
    getSubmitDialogTitle() {
      if (!this.currentAssignment) return '提交作业'

      const prefix = this.currentAssignment.mySubmission ? '重新' : ''
      const suffix = this.isExpired(this.currentAssignment) && this.currentAssignment.allowLate
          ? '（迟交）'
          : ''

      return `${prefix}提交作业${suffix}`
    },

    // 改善：打开弹窗时自动聚焦
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
      this.submitDialogVisible = true

      // ⭐ 自动聚焦：弹窗打开后聚焦到第一个输入框
      this.$nextTick(() => {
        const firstInput = this.$refs.submitFormRef?.$el?.querySelector('input, textarea')
        if (firstInput) {
          firstInput.focus()
        }
      })
    },

    handleContentTypeChange() {
      // 切换类型时清空另一类型的值
      if (this.submitForm.contentType === 'TEXT') {
        this.submitForm.filePath = ''
        this.fileList = []
      } else {
        this.submitForm.textContent = ''
      }
    },

    beforeUpload(file) {
      // 文件大小校验（50MB）
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        this.$message.error('文件大小不能超过 50MB!')
        return false
      }
      // 文件类型校验（简化）
      const ext = file.name.split('.').pop().toLowerCase()
      const allowed = ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar']
      if (!allowed.includes(ext)) {
        this.$message.error('不支持的文件类型')
        return false
      }
      return true
    },

    handleUploadSuccess(response) {
      if (response.code === 1) {
        this.submitForm.filePath = response.data.filePath
        this.$message.success('文件上传成功')
      } else {
        this.$message.error(response.msg || '上传失败')
      }
    },


    handleUploadError() {
      this.$message.error('文件上传失败，请检查网络')
    },

    async handleSubmit() {
      try {
        await this.$refs.submitFormRef.validate()
      } catch {
        return
      }

      // 文件类型校验
      if (this.submitForm.contentType === 'FILE' && !this.submitForm.filePath) {
        this.$message.warning('请先上传文件')
        return
      }

      this.submitting = true
      try {
        const submitData = {
          ...this.submitForm,
          studentId: this.studentId,
          // 自动判断是否迟交
          isLate: this.isExpired(this.currentAssignment)
        }

        await axios.post('/api/student/submissions', submitData)
        this.$message.success('提交成功，等待审核')
        this.submitDialogVisible = false
        this.fetchAssignments()  // 刷新列表
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '提交失败')
      } finally {
        this.submitting = false
      }
    },

    handleDialogClose() {
      if (this.$refs.submitFormRef) {
        this.$refs.submitFormRef.resetFields()
      }
      if (this.$refs.uploadRef) {
        this.$refs.uploadRef.clearFiles()
      }
    }
  }
}
</script>

<style scoped>
.assignment-submit {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  margin: 20px;
  padding: 0 10px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.course-info {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.assignment-card {
  margin: 0 20px 20px 20px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.assignment-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.assignment-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.assignment-info p {
  margin: 4px 0;
}

.submission-status {
  margin-bottom: 12px;
  font-size: 13px;
  color: #666;
}

.score {
  margin-left: 10px;
  color: #667eea;
  font-weight: 500;
}

.comment {
  display: block;
  margin-top: 4px;
  color: #909399;
}

.assignment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
}

/* Element UI 定制 */
.el-form-item__label {
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.el-input >>> .el-input__inner {
  border-radius: 10px;
  border: 2px solid #e8e8e8;
  height: 40px;
  font-size: 14px;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}
</style>