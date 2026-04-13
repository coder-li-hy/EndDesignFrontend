<template>
  <div class="course-qa">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">课程问答</h2>
      <p class="course-info">
        课程：<el-tag size="mini">{{ courseName }}</el-tag>
      </p>
      <el-button type="primary" icon="el-icon-plus" @click="openAskDialog">
        发起提问
      </el-button>
    </div>

    <!-- 提问列表 -->
    <el-card class="qa-card" shadow="never" v-for="qa in qaList" :key="qa.qaId">
      <div class="qa-header">
        <div class="qa-meta">
          <span class="qa-time">{{ formatDateTime(qa.askTime) }}</span>
          <el-tag v-if="qa.isAnonymous" size="mini" type="info">匿名</el-tag>
          <el-tag :type="getAuditTagType(qa.auditStatus)" size="mini">
            {{ getAuditText(qa.auditStatus) }}
          </el-tag>
        </div>
      </div>

      <div class="qa-question">
        <strong>问：</strong>{{ qa.question }}
      </div>

      <!-- 教师回复（仅审核通过后显示） -->
      <div v-if="qa.auditStatus === 'PASS' && qa.answer" class="qa-answer">
        <strong style="color: #667eea">答：</strong>
        <span>{{ qa.answer }}</span>
        <span v-if="qa.answerTime" class="answer-time">
          （{{ formatDateTime(qa.answerTime) }}）
        </span>
      </div>
      <div v-else-if="qa.auditStatus === 'PASS' && !qa.answer" class="qa-answer">
        <strong style="color: #667eea">答：</strong>
        <span style="color: #909399">教师暂未回复</span>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="qaList.length === 0" description="暂无提问记录" />

    <!-- 发起提问弹窗 -->
    <el-dialog
        title="发起提问"
        :visible.sync="askDialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="askForm" :rules="askRules" ref="askFormRef" label-width="100px">

        <el-form-item label="问题内容" prop="question">
          <el-input
              v-model="askForm.question"
              type="textarea"
              :rows="5"
              placeholder="请输入您的问题，尽量描述清楚..."
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="匿名提问">
          <el-switch
              v-model="askForm.isAnonymous"
              active-text="是"
              inactive-text="否"
          />
          <span style="margin-left: 10px; font-size: 12px; color: #909399">
            匿名后教师端将不显示您的姓名
          </span>
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="askDialogVisible = false">取 消</el-button>
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
    // 获取路由参数
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    // 获取当前学生
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.courseId && this.studentId) {
      this.fetchQaList()
    }
  },

  methods: {
    async fetchQaList() {
      if (!this.courseId || !this.studentId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/student/qa', {
          params: {
            courseId: this.courseId,
            studentId: this.studentId
          }
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
      return dateTime
    },

    getAuditTagType(status) {
      const map = { 'PENDING': 'warning', 'PASS': 'success', 'REJECT': 'danger' }
      return map[status] || 'info'
    },

    getAuditText(status) {
      const map = { 'PENDING': '待审核', 'PASS': '已回复', 'REJECT': '已拒绝' }
      return map[status] || status
    },

    openAskDialog() {
      this.askForm = { question: '', isAnonymous: false }
      this.askDialogVisible = true
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
        this.$message.success('提问成功，等待审核')
        this.askDialogVisible = false
        this.fetchQaList()  // 刷新列表
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '提交失败')
      } finally {
        this.submitting = false
      }
    },

    handleDialogClose() {
      if (this.$refs.askFormRef) {
        this.$refs.askFormRef.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.course-qa {
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
  flex-wrap: wrap;
  gap: 10px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.course-info {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.qa-card {
  margin: 0 20px 20px 20px;
}

.qa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.qa-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #909399;
}

.qa-time {
  color: #909399;
}

.qa-question {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
}

.qa-answer {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.answer-time {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
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