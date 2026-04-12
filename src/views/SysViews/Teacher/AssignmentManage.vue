<template>
  <div class="assignment-manage">

    <!-- 页面标题 + 创建按钮 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">作业管理</h2>
        <p class="course-info" v-if="courseName">
          当前课程：<el-tag size="mini">{{ courseName }}</el-tag>
        </p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
        发布作业
      </el-button>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="作业标题">
          <el-input
              v-model="searchForm.title"
              placeholder="输入标题搜索"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
              v-model="searchForm.deadline"
              type="date"
              placeholder="选择截止日期"
              value-format="yyyy-MM-dd"
              style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 作业列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="assignmentList" v-loading="loading" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column prop="title" label="作业标题" min-width="180" show-overflow-tooltip />

        <el-table-column label="截止时间" width="160" align="center">
          <template #default="{ row }">
            <div>
              <div :class="{ 'text-danger': isExpired(row) }">
                {{ formatDateTime(row.deadline) }}
              </div>
              <el-tag
                  size="mini"
                  :type="isExpired(row) ? 'danger' : 'success'"
                  style="margin-top: 4px"
              >
                {{ isExpired(row) ? '已截止' : '进行中' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="allowLate" label="迟交" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="mini" :type="row.allowLate ? 'warning' : 'info'">
              {{ row.allowLate ? '允许' : '禁止' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 提交统计（需要关联查询，简化版先显示占位） -->
        <el-table-column label="提交情况" width="120" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="text"
                @click="viewSubmissions(row)"
            >
              查看提交 ({{ row.submitCount || 0 }})
            </el-button>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="mini" type="text" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button size="mini" type="text" @click="viewSubmissions(row)">
              批改
            </el-button>
            <el-button
                size="mini"
                type="text"
                style="color: #f56c6c"
                @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
            :current-page="page"
            :page-size="size"
            :total="total"
            layout="total, prev, pager, next"
            background
        />
      </div>
    </el-card>

    <!-- 发布/编辑作业弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '发布作业' : '编辑作业'"
        :visible.sync="dialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">

        <el-form-item label="作业标题" prop="title">
          <el-input
              v-model="form.title"
              placeholder="请输入作业标题"
              maxlength="100"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="作业要求" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入作业具体要求、提交格式等说明"
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
              v-model="form.deadline"
              type="datetime"
              placeholder="选择截止日期时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%"
              :disabled-date="disabledDate"
          />
        </el-form-item>

        <el-form-item label="允许迟交">
          <el-switch
              v-model="form.allowLate"
              active-text="允许"
              inactive-text="禁止"
          />
          <div class="form-tip">开启后学生可在截止后提交，但会标记为迟交</div>
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 作业提交列表弹窗（批改入口） -->
    <el-dialog
        title="作业提交列表"
        :visible.sync="submissionDialogVisible"
        width="700px"
        :close-on-click-modal="false"
    >
      <div class="submission-header">
        <h4>{{ currentAssignment?.title }}</h4>
        <p class="submission-deadline">
          截止时间：{{ formatDateTime(currentAssignment?.deadline) }}
          <el-tag size="mini" :type="isExpired(currentAssignment) ? 'danger' : 'success'" style="margin-left: 10px">
            {{ isExpired(currentAssignment) ? '已截止' : '进行中' }}
          </el-tag>
        </p>
      </div>

      <el-table :data="submissionList" v-loading="submissionLoading" border size="small">
        <el-table-column prop="studentName" label="学生" width="120" />

        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            <div>
              {{ formatDateTime(row.submitTime) }}
              <el-tag
                  v-if="row.isLate"
                  size="mini"
                  type="danger"
                  style="margin-top: 4px"
              >
                迟交
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提交内容" min-width="150">
          <template #default="{ row }">
            <div v-if="row.contentType === 'FILE'">
              <el-link type="primary" :href="row.filePath" target="_blank">
                <i class="el-icon-download"></i> 下载文件
              </el-link>
            </div>
            <div v-else-if="row.contentType === 'TEXT'">
              <el-popover placement="top" trigger="click">
                <p style="max-width: 300px; white-space: pre-wrap; margin: 0">{{ row.textContent }}</p>
                <el-button size="mini" slot="reference" type="text">查看文本</el-button>
              </el-popover>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="分数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.score !== null && row.score !== undefined" class="score-text">
              {{ row.score }}
            </span>
            <el-tag v-else size="mini" type="info">未批改</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="primary"
                @click="openGradeDialog(row)"
            >
              {{ row.score !== null ? '修改' : '批改' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 批改弹窗 -->
    <el-dialog
        title="批改作业"
        :visible.sync="gradeDialogVisible"
        width="450px"
        :close-on-click-modal="false"
    >
      <el-form :model="gradeForm" :rules="gradeRules" ref="gradeFormRef" label-width="100px">

        <el-form-item label="学生">
          <el-input :value="gradeForm.studentName" disabled />
        </el-form-item>

        <el-form-item label="提交内容" v-if="gradeForm.contentType === 'TEXT'">
          <el-input
              type="textarea"
              :rows="3"
              :value="gradeForm.textContent"
              disabled
          />
        </el-form-item>

        <el-form-item label="提交内容" v-else-if="gradeForm.contentType === 'FILE'">
          <el-link :href="gradeForm.filePath" target="_blank" type="primary">
            <i class="el-icon-download"></i> 下载查看文件
          </el-link>
        </el-form-item>

        <el-form-item label="分数" prop="score">
          <el-input-number
              v-model="gradeForm.score"
              :min="0"
              :max="100"
              :step="0.5"
              :precision="1"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="评语" prop="teacherComment">
          <el-input
              v-model="gradeForm.teacherComment"
              type="textarea"
              :rows="3"
              placeholder="请输入批改评语（可选）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="gradeDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="grading" @click="submitGrade">
          {{ grading ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AssignmentManage',

  data() {
    return {
      // 课程信息（从路由参数获取）
      courseId: null,
      courseName: '',

      // 搜索条件
      searchForm: {
        title: '',
        deadline: ''
      },

      // 作业列表
      loading: false,
      assignmentList: [],
      page: 1,
      size: 10,
      total: 0,

      // 发布/编辑弹窗
      dialogVisible: false,
      dialogType: 'add',
      submitting: false,
      form: {
        assignmentId: null,
        title: '',
        description: '',
        deadline: '',
        allowLate: true
      },
      rules: {
        title: [
          { required: true, message: '请输入作业标题', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入作业要求', trigger: 'blur' }
        ],
        deadline: [
          { required: true, message: '请选择截止时间', trigger: 'change' }
        ]
      },

      // 提交列表弹窗
      submissionDialogVisible: false,
      submissionLoading: false,
      currentAssignment: null,
      submissionList: [],

      // 批改弹窗
      gradeDialogVisible: false,
      grading: false,
      gradeForm: {
        submissionId: null,
        studentName: '',
        contentType: '',
        filePath: '',
        textContent: '',
        score: null,
        teacherComment: ''
      },
      gradeRules: {
        score: [
          { required: true, message: '请输入分数', trigger: 'blur' },
          { type: 'number', min: 0, max: 100, message: '分数范围 0-100', trigger: 'blur' }
        ]
      }
    }
  },

  created() {
    // 获取课程参数（从"我的课程"页面跳转时携带）
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.courseId) {
      this.fetchAssignments()
    } else {
      this.$message.warning('未选择课程，请先从"我的课程"进入')
    }
  },

  methods: {
    // ========== 数据加载 ==========

    async fetchAssignments() {
      if (!this.courseId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/assignments', {
          params: {
            courseId: this.courseId,
            title: this.searchForm.title,
            deadline: this.searchForm.deadline,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.assignmentList = resp.data.data.records || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch assignments error:', e)
        this.$message.error('加载作业列表失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索
    handleSearch() {
      this.page = 1
      this.fetchAssignments()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = { title: '', deadline: '' }
      this.handleSearch()
    },

    // 分页
    handlePageChange(p) { this.page = p; this.fetchAssignments() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchAssignments() },

    // ========== 作业管理 ==========

    openAddDialog() {
      this.dialogType = 'add'
      this.resetForm()
      this.dialogVisible = true
    },

    openEditDialog(row) {
      this.dialogType = 'edit'
      this.form = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },

    async handleSubmit() {
      try { await this.$refs.formRef.validate() } catch { return }

      this.submitting = true
      try {
        const submitData = {
          ...this.form,
          courseId: this.courseId  // 关联当前课程
        }

        if (this.dialogType === 'add') {
          await axios.post('/api/teacher/assignments', submitData)
          this.$message.success('作业发布成功')
        } else {
          await axios.put(`/api/teacher/assignments/${this.form.assignmentId}`, submitData)
          this.$message.success('作业更新成功')
        }
        this.dialogVisible = false
        this.fetchAssignments()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.form = {
        assignmentId: null,
        title: '',
        description: '',
        deadline: '',
        allowLate: true
      }
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },

    handleDialogClose() { this.resetForm() },

    // 删除作业
    handleDelete(row) {
      this.$confirm(`确定要删除作业「${row.title}」吗？删除后学生将无法提交`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete(`/api/teacher/assignments/${row.assignmentId}`)
          this.$message.success('删除成功')
          this.fetchAssignments()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '删除失败')
        }
      })
    },

    // 禁用过去日期
    disabledDate(date) {
      return date.getTime() < Date.now() - 86400000  // 不能选昨天及之前
    },

    // 判断是否已截止
    isExpired(row) {
      if (!row?.deadline) return false
      return new Date(row.deadline) < new Date()
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      // 后端返回格式: "2026-04-09 22:41:18"
      return dateTime
    },

    // ========== 提交列表 & 批改 ==========

    // 查看某作业的提交列表
    async viewSubmissions(assignment) {
      this.currentAssignment = assignment
      this.submissionDialogVisible = true
      this.fetchSubmissions(assignment.assignmentId)
    },

    async fetchSubmissions(assignmentId) {
      this.submissionLoading = true
      try {
        const resp = await axios.get(`/api/teacher/assignments/${assignmentId}/submissions`)
        if (resp.data.code === 1) {
          // 简化：后端直接返回带学生姓名的列表
          this.submissionList = resp.data.data.map(item => ({
            ...item,
            studentName: item.studentName || '未知学生'  // 假设后端返回了关联的学生信息
          }))
        }
      } catch (e) {
        console.error('Fetch submissions error:', e)
        this.$message.error('加载提交列表失败')
      } finally {
        this.submissionLoading = false
      }
    },

    // 打开批改弹窗
    openGradeDialog(submission) {
      this.gradeForm = {
        submissionId: submission.submissionId,
        studentName: submission.studentName,
        contentType: submission.contentType,
        filePath: submission.filePath,
        textContent: submission.textContent,
        score: submission.score,
        teacherComment: submission.teacherComment || ''
      }
      this.gradeDialogVisible = true
    },

    // 提交批改
    async submitGrade() {
      try { await this.$refs.gradeFormRef.validate() } catch { return }

      this.grading = true
      try {
        await axios.put(`/api/teacher/submissions/${this.gradeForm.submissionId}/grade`, {
          score: this.gradeForm.score,
          teacherComment: this.gradeForm.teacherComment
        })
        this.$message.success('批改成功')
        this.gradeDialogVisible = false
        // 刷新提交列表
        if (this.currentAssignment) {
          this.fetchSubmissions(this.currentAssignment.assignmentId)
        }
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '批改失败')
      } finally {
        this.grading = false
      }
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式（复用 LoginView 风格）========== */
.assignment-manage {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

/* ========== 表格区 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.score-text {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ========== 弹窗样式 ========== */
.submission-header {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.submission-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

.submission-deadline {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

/* Element UI 组件深度定制（复用 LoginView 风格） */
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
  transition: all 0.3s ease;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.el-message {
  z-index: 9999 !important;
}
</style>