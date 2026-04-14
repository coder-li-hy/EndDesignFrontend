<template>
  <div class="teacher-qa">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">课程问答</h2>
      <p class="course-info">
        课程：<el-tag size="mini">{{ courseName }}</el-tag>
      </p>
    </div>

    <!-- 提问列表 -->
    <el-card class="qa-card" shadow="never" v-for="qa in qaList" :key="qa.qaId">
      <div class="qa-header">
        <div class="qa-meta">
          <span class="qa-time">{{ formatDateTime(qa.askTime) }}</span>
          <el-tag v-if="qa.isAnonymous" size="mini" type="info">匿名提问</el-tag>
          <el-tag v-else size="mini" type="primary">学生：{{ qa.studentName }}</el-tag>
        </div>
      </div>

      <div class="qa-question">
        <strong>问：</strong>{{ qa.question }}
      </div>

      <!-- 教师回复区域 -->
      <div v-if="qa.answer" class="qa-answer">
        <strong style="color: #667eea">答：</strong>
        <span>{{ qa.answer }}</span>
        <span v-if="qa.answerTime" class="answer-time">
          （{{ formatDateTime(qa.answerTime) }}）
        </span>
        <el-button size="mini" type="text" @click="openReplyDialog(qa)">
          修改回复
        </el-button>
      </div>
      <div v-else class="qa-answer">
        <strong style="color: #667eea">答：</strong>
        <el-button size="mini" type="primary" @click="openReplyDialog(qa)">
          回复此问题
        </el-button>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="qaList.length === 0" description="暂无待回复的提问" />

    <!-- 回复弹窗 -->
    <el-dialog
        title="回复提问"
        :visible.sync="replyDialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="100px">

        <el-form-item label="问题" prop="question">
          <el-input v-model="replyForm.question" type="textarea" :rows="3" disabled />
        </el-form-item>

        <el-form-item label="回复内容" prop="answer">
          <el-input
              v-model="replyForm.answer"
              type="textarea"
              :rows="5"
              placeholder="请输入您的回复..."
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="replyDialogVisible = false">取 消</el-button>
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
  name: 'TeacherCourseQa',

  data() {
    return {
      courseId: null,
      courseName: '',
      teacherId: null,

      qaList: [],
      loading: false,

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
    // 获取路由参数
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    // 获取当前教师
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.teacherId = userInfo.userId

    if (this.courseId && this.teacherId) {
      this.fetchQaList()
    }
  },

  methods: {
    async fetchQaList() {
      if (!this.courseId || !this.teacherId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/qa', {
          params: {
            courseId: this.courseId,
            teacherId: this.teacherId
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

    openReplyDialog(qa) {
      this.replyForm = {
        qaId: qa.qaId,
        question: qa.question,
        answer: qa.answer || ''
      }
      this.replyDialogVisible = true
    },

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
          teacherId: this.teacherId
        })
        this.$message.success('回复成功')
        this.replyDialogVisible = false
        this.fetchQaList()  // 刷新列表
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '回复失败')
      } finally {
        this.submitting = false
      }
    },

    handleDialogClose() {
      if (this.$refs.replyFormRef) {
        this.$refs.replyFormRef.resetFields()
      }
    }
  }
}
</script>

<style scoped>
.teacher-qa {
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
  display: flex;
  align-items: flex-start;
  gap: 8px;
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