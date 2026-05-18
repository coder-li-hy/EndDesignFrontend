<template>
  <div class="assignment-manage">

    <!-- 页面标题 + 创建按钮 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📋 作业管理</h2>
        <p class="course-info" v-if="courseName">
          当前课程：<el-tag size="mini" effect="dark">{{ courseName }}</el-tag>
        </p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog" class="btn-primary">
        发布作业
      </el-button>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="作业标题">
          <el-input
              v-model="searchForm.title"
              placeholder="输入标题搜索"
              clearable
              @keyup.enter.native="handleSearch"
              prefix-icon="el-icon-search"
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
    <el-card class="table-card" shadow="hover">
      <el-table
          :data="assignmentList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{background:'#f8f9fa',color:'#303133',fontWeight:'600'}"
          :row-style="{height:'60px'}"
      >
        <el-table-column prop="title" label="作业标题" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="assignment-title">{{ row.title }}</span>
          </template>
        </el-table-column>

        <el-table-column label="截止时间" width="160" align="center">
          <template #default="{ row }">
            <div class="deadline-cell">
              <div :class="['deadline-text', { 'expired': isExpired(row) }]">
                {{ formatDateTime(row.deadline) }}
              </div>
              <el-tag
                  size="mini"
                  :type="isExpired(row) ? 'danger' : 'success'"
                  :effect="isExpired(row) ? 'dark' : 'light'"
                  class="status-tag"
              >
                {{ isExpired(row) ? '已截止' : '进行中' }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="allowLate" label="迟交" width="80" align="center">
          <template #default="{ row }">
            <el-tag
                size="mini"
                :type="row.allowLate ? 'warning' : 'info'"
                :effect="row.allowLate ? 'dark' : 'plain'"
            >
              {{ row.allowLate ? '允许' : '禁止' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="提交统计" width="100" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="text"
                class="link-btn"
                @click="viewSubmissions(row)"
            >
              查看提交 <i class="el-icon-arrow-right"></i>
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="mini" type="text" class="action-edit" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button size="mini" type="text" class="action-grade" @click="viewSubmissions(row)">
              批改
            </el-button>
            <el-button size="mini" type="text" class="action-progress" @click="viewProgress(row)">
              进度
            </el-button>
            <el-button
                size="mini"
                type="text"
                class="action-delete"
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
            layout="total, prev, pager, next, jumper"
            background
            :pager-count="5"
        />
      </div>
    </el-card>

    <!-- 发布/编辑作业弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '✨ 发布新作业' : '✏️ 编辑作业'"
        :visible.sync="dialogVisible"
        width="580px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="dialog-custom"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="medium">

        <el-form-item label="作业标题" prop="title">
          <el-input
              v-model="form.title"
              placeholder="请输入作业标题，如：实验一：环境搭建"
              maxlength="100"
              show-word-limit
              clearable
          />
        </el-form-item>

        <el-form-item label="作业要求" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="5"
              placeholder="请输入作业具体要求、提交格式、评分标准等说明..."
              maxlength="500"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="允许迟交">
          <el-switch
              v-model="form.allowLate"
              active-text="允许"
              inactive-text="禁止"
              active-color="#13ce66"
              inactive-color="#ff4949"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            开启后学生可在截止后提交，但会标记为"迟交"，不影响正常提交流程
          </div>
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
        title="📝 作业提交列表"
        :visible.sync="submissionDialogVisible"
        width="850px"
        :close-on-click-modal="false"
        class="dialog-custom"
    >
      <div class="submission-header">
        <h4>{{ currentAssignment?.title }}</h4>
        <p class="submission-deadline">
          <i class="el-icon-time"></i>
          截止时间：{{ formatDateTime(currentAssignment?.deadline) }}
          <el-tag
              size="mini"
              :type="isExpired(currentAssignment) ? 'danger' : 'success'"
              :effect="isExpired(currentAssignment) ? 'dark' : 'light'"
              class="ml-2"
          >
            {{ isExpired(currentAssignment) ? '已截止' : '进行中' }}
          </el-tag>
          <el-tag
              size="mini"
              type="info"
              effect="plain"
              class="ml-2"
          >
            {{ currentAssignment?.allowLate ? '允许迟交' : '禁止迟交' }}
          </el-tag>
        </p>
      </div>

      <el-table
          :data="submissionList"
          v-loading="submissionLoading"
          border
          size="small"
          :header-cell-style="{background:'#f8f9fa',fontWeight:'600'}"
      >
        <el-table-column prop="studentName" label="学生" width="120">
          <template #default="{ row }">
            <el-avatar size="small" class="mr-2">{{ row.studentName?.charAt(0) }}</el-avatar>
            {{ row.studentName }}
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            <div class="submit-time-cell">
              <div>{{ formatDateTime(row.submitTime) }}</div>
              <el-tag
                  v-if="row.isLate"
                  size="mini"
                  type="danger"
                  effect="dark"
                  class="mt-1"
              >
                <i class="el-icon-warning"></i> 迟交
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="提交内容" min-width="180">
          <template #default="{ row }">
            <div class="content-cell">
              <!-- 文件类型 -->
              <div v-if="row.contentType === 'FILE'" class="content-item">
                <i class="el-icon-document"></i>
                <el-link type="primary" :href="row.filePath" target="_blank" class="file-link">
                  {{ getFileName(row.filePath) }}
                </el-link>
              </div>

              <!-- 文本类型 -->
              <div v-else-if="row.contentType === 'TEXT'" class="content-item">
                <i class="el-icon-tickets"></i>
                <el-popover placement="top" trigger="click" width="350">
                  <p class="text-content">{{ row.textContent }}</p>
                  <el-button size="mini" slot="reference" type="text" class="view-text-btn">
                    查看文本
                  </el-button>
                </el-popover>
              </div>

              <!-- 代码类型 -->
              <div v-else-if="row.contentType === 'CODE'" class="content-item">
                <i class="el-icon-connection"></i>
                <el-button size="mini" type="text" class="view-code-btn" @click="viewCode(row)">
                  查看代码
                </el-button>
              </div>

              <span v-else class="text-secondary">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="分数" width="100" align="center">
          <template #default="{ row }">
            <div class="score-cell">
              <span v-if="row.score !== null && row.score !== undefined"
                    :class="['score-value', getScoreClass(row.score)]">
                {{ row.score }}
              </span>
              <el-tag v-else size="mini" type="info" effect="plain">未批改</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                :type="row.score !== null ? 'warning' : 'primary'"
                @click="openGradeDialog(row)"
                class="grade-btn"
            >
              {{ row.score !== null ? '✏️ 重新批改' : '批改' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 查看代码的弹窗 -->
    <el-dialog
        title="💻 查看提交代码"
        :visible.sync="codeDialogVisible"
        width="75%"
        :close-on-click-modal="false"
        class="dialog-custom code-dialog"
    >
      <div class="code-header">
        <el-tag size="mini" effect="dark">👤 {{ currentSubmission?.studentName }}</el-tag>
        <el-tag size="mini" type="success" class="ml-2">
          🕐 {{ formatDateTime(currentSubmission?.submitTime) }}
        </el-tag>
        <el-tag
            size="mini"
            :type="currentSubmission?.isLate ? 'danger' : 'info'"
            :effect="currentSubmission?.isLate ? 'dark' : 'plain'"
            class="ml-2"
        >
          {{ currentSubmission?.isLate ? '⚠️ 迟交' : '✅ 按时' }}
        </el-tag>
        <el-tag size="mini" type="warning" effect="plain" class="ml-2">
          📄 {{ getCodeLanguage(currentSubmission?.contentType) }}
        </el-tag>
      </div>

      <div class="code-container">
        <pre v-highlight class="code-block">{{ currentSubmissionContent }}</pre>
      </div>

      <div slot="footer">
        <el-button @click="codeDialogVisible = false">关 闭</el-button>
        <el-button type="primary" icon="el-icon-document-copy" @click="copyCode">
          复制代码
        </el-button>
      </div>
    </el-dialog>

    <!-- 批改弹窗（支持重新批改） -->
    <el-dialog
        :title="gradeForm.score !== null ? '✏️ 重新批改作业' : '📝 批改作业'"
        :visible.sync="gradeDialogVisible"
        width="520px"
        :close-on-click-modal="false"
        class="dialog-custom grade-dialog"
    >
      <el-alert
          v-if="gradeForm.score !== null"
          title="⚠️ 重新批改将覆盖原有分数和评语"
          type="warning"
          :closable="false"
          show-icon
          class="mb-3"
      />

      <el-form :model="gradeForm" :rules="gradeRules" ref="gradeFormRef" label-width="100px" size="medium">

        <el-form-item label="学生">
          <el-input :value="gradeForm.studentName" disabled class="readonly-input">
            <i slot="prefix" class="el-icon-user"></i>
          </el-input>
        </el-form-item>

        <el-form-item label="提交内容">
          <!-- 文本内容 -->
          <div v-if="gradeForm.contentType === 'TEXT'" class="submission-content">
            <el-input
                type="textarea"
                :rows="4"
                :value="gradeForm.textContent"
                disabled
                class="readonly-input"
            />
          </div>

          <!-- 文件内容 -->
          <div v-else-if="gradeForm.contentType === 'FILE'" class="submission-content">
            <el-link :href="gradeForm.filePath" target="_blank" type="primary" class="file-download-link">
              <i class="el-icon-download"></i> 下载文件：{{ getFileName(gradeForm.filePath) }}
            </el-link>
          </div>

          <!-- 代码内容 -->
          <div v-else-if="gradeForm.contentType === 'CODE'" class="submission-content">
            <el-button size="mini" type="text" @click="viewCodeFromGrade" class="view-code-link">
              <i class="el-icon-connection"></i> 查看代码
            </el-button>
          </div>

          <span v-else class="text-secondary">无提交内容</span>
        </el-form-item>

        <!-- 原有批改信息（重新批改时显示） -->
        <el-form-item label="原批改" v-if="gradeForm.score !== null">
          <div class="original-grade">
            <span class="original-score" :class="getScoreClass(gradeForm.score)">
              {{ gradeForm.score }} 分
            </span>
            <span v-if="gradeForm.teacherComment" class="original-comment">
              | {{ gradeForm.teacherComment }}
            </span>
            <span class="original-time">
              ({{ formatDateTime(gradeForm.gradeTime) }})
            </span>
          </div>
        </el-form-item>

        <el-form-item label="新分数" prop="score">
          <el-input-number
              v-model="gradeForm.score"
              :min="0"
              :max="100"
              :step="0.5"
              :precision="1"
              style="width: 100%"
              placeholder="请输入 0-100 的分数"
          >
            <template #append>分</template>
          </el-input-number>
        </el-form-item>

        <el-form-item label="评语" prop="teacherComment">
          <el-input
              v-model="gradeForm.teacherComment"
              type="textarea"
              :rows="4"
              placeholder="请输入批改评语，如：逻辑清晰，代码规范，注意边界条件处理..."
              maxlength="200"
              show-word-limit
          />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="gradeDialogVisible = false">取 消</el-button>
        <el-button
            v-if="gradeForm.score !== null"
            type="warning"
            :loading="grading"
            @click="submitGrade"
            icon="el-icon-refresh"
        >
          {{ grading ? '提交中...' : '确认重新批改' }}
        </el-button>
        <el-button
            v-else
            type="primary"
            :loading="grading"
            @click="submitGrade"
            icon="el-icon-check"
        >
          {{ grading ? '提交中...' : '确认批改' }}
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
      // 课程信息
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
        ]
      },

      // 提交列表弹窗
      submissionDialogVisible: false,
      submissionLoading: false,
      currentAssignment: null,
      submissionList: [],

      // 查看代码弹窗
      codeDialogVisible: false,
      currentSubmission: null,
      currentSubmissionContent: '',

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
        teacherComment: '',
        gradeTime: null  // 新增：记录原批改时间
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
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.courseId) {
      this.fetchAssignments()
    } else {
      this.$message.warning('未选择课程，请先从"我的课程"进入')
    }
  },

  methods: {
    // ========== 工具方法 ==========

    // 获取文件名（从路径提取）
    getFileName(filePath) {
      if (!filePath) return '未知文件'
      const parts = filePath.split('/')
      return parts[parts.length - 1] || '未知文件'
    },

    // 根据分数返回样式类
    getScoreClass(score) {
      if (score >= 90) return 'score-excellent'
      if (score >= 75) return 'score-good'
      if (score >= 60) return 'score-pass'
      return 'score-fail'
    },

    // 根据提交类型返回语言标识
    getCodeLanguage(contentType) {
      const map = {
        'CODE': 'C/C++',
        'TEXT': '纯文本',
        'FILE': '文件'
      }
      return map[contentType] || '未知'
    },

    // 复制代码到剪贴板
    copyCode() {
      if (!this.currentSubmissionContent) return

      navigator.clipboard.writeText(this.currentSubmissionContent).then(() => {
        this.$message.success('✓ 代码已复制到剪贴板')
      }).catch(() => {
        // 兼容旧浏览器
        const textarea = document.createElement('textarea')
        textarea.value = this.currentSubmissionContent
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        this.$message.success('✓ 代码已复制')
      })
    },

    // 从批改弹窗查看代码
    viewCodeFromGrade() {
      if (this.gradeForm.textContent) {
        this.currentSubmissionContent = this.gradeForm.textContent
        this.codeDialogVisible = true
      } else {
        this.$message.info('该提交无代码内容')
      }
    },

    // ========== 查看代码 ==========

    viewCode(row) {
      this.currentSubmission = row
      this.currentSubmissionContent = row.textContent || ''
      this.codeDialogVisible = true
    },

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
    handlePageChange(p) {
      this.page = p
      this.fetchAssignments()
    },
    handleSizeChange(s) {
      this.size = s
      this.page = 1
      this.fetchAssignments()
    },

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
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      this.submitting = true
      try {
        const submitData = {
          ...this.form,
          courseId: this.courseId
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

    handleDialogClose() {
      this.resetForm()
    },

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
      return date.getTime() < Date.now() - 86400000
    },

    // 判断是否已截止
    isExpired(row) {
      if (!row?.deadline) return false
      return new Date(row.deadline) < new Date()
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime
    },

    // ========== 提交列表 & 批改 ==========

    async viewSubmissions(assignment) {
      this.currentAssignment = assignment
      this.submissionDialogVisible = true
      await this.fetchSubmissions(assignment.assignmentId)
    },

    async fetchSubmissions(assignmentId) {
      this.submissionLoading = true
      try {
        const resp = await axios.get(`/api/teacher/assignments/${assignmentId}/submissions`)
        if (resp.data.code === 1) {
          this.submissionList = resp.data.data.map(item => ({
            ...item,
            studentName: item.studentName || '未知学生'
          }))
        }
      } catch (e) {
        console.error('Fetch submissions error:', e)
        this.$message.error('加载提交列表失败')
      } finally {
        this.submissionLoading = false
      }
    },

    // 打开批改弹窗（支持重新批改）
    openGradeDialog(submission) {
      this.gradeForm = {
        submissionId: submission.submissionId,
        studentName: submission.studentName,
        contentType: submission.contentType,
        filePath: submission.filePath,
        textContent: submission.textContent,
        score: submission.score,
        teacherComment: submission.teacherComment || '',
        gradeTime: submission.gradeTime || null  // 保存原批改时间
      }
      this.gradeDialogVisible = true
    },

    // 提交批改（支持重新批改）
    async submitGrade() {
      try {
        await this.$refs.gradeFormRef.validate()
      } catch {
        return
      }

      this.grading = true
      try {
        await axios.put(`/api/teacher/submissions/${this.gradeForm.submissionId}/grade`, {
          score: this.gradeForm.score,
          teacherComment: this.gradeForm.teacherComment
        })

        const isRegrade = this.gradeForm.score !== null && this.gradeForm.gradeTime !== null
        this.$message.success(isRegrade ? '重新批改成功' : '批改成功')

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
    },

    // 查看作业学习进度
    viewProgress(row) {
      this.$router.push({
        path: '/teacher/progress',
        query: {
          assignmentId: row.assignmentId,
          assignmentTitle: row.title,
          courseId: this.courseId,
          courseName: this.courseName
        }
      })
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
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
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-info {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.btn-primary {
  padding: 12px 24px;
  font-weight: 500;
}

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

/* ========== 表格区 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

.assignment-title {
  font-weight: 500;
  color: #303133;
}

.deadline-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.deadline-text {
  font-size: 13px;
  color: #606266;
}

.deadline-text.expired {
  color: #f56c6c;
  font-weight: 500;
}

.status-tag {
  font-size: 11px;
}

.submit-time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.content-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.file-link,
.view-text-btn,
.view-code-btn {
  font-size: 12px;
}

.score-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.score-value {
  font-size: 16px;
  font-weight: 700;
}

.score-excellent { color: #67c23a; }
.score-good { color: #409eff; }
.score-pass { color: #e6a23c; }
.score-fail { color: #f56c6c; }

.grade-btn {
  font-size: 12px;
  padding: 4px 12px;
}

/* 操作按钮样式 */
.action-edit { color: #409eff; }
.action-grade { color: #67c23a; }
.action-progress { color: #909399; }
.action-delete { color: #f56c6c; }

.link-btn {
  color: #409eff;
  font-size: 12px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ========== 弹窗通用样式 ========== */
.dialog-custom ::v-deep .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-custom ::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #409eff, #1d7fe4);
  padding: 16px 20px;
  margin: 0;
}

.dialog-custom ::v-deep .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn {
  top: 14px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: white;
}

.dialog-custom ::v-deep .el-dialog__body {
  padding: 20px;
  background: #fff;
}

.dialog-custom ::v-deep .el-dialog__footer {
  padding: 12px 20px 20px;
  border-top: 1px solid #ebeef5;
}

/* ========== 提交列表弹窗 ========== */
.submission-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.submission-header h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

.submission-deadline {
  margin: 0;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-2 { margin-left: 8px; }
.mt-1 { margin-top: 4px; }
.mb-3 { margin-bottom: 12px; }
.mr-2 { margin-right: 8px; }

.text-secondary { color: #909399; }

.text-content {
  max-width: 320px;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

/* ========== 代码查看弹窗 ========== */
.code-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.code-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 15px;
  max-height: 500px;
  overflow: auto;
}

.code-block {
  background: #1e1e1e;
  margin: 0;
  color: #d4d4d4;
  font-family: 'Fira Code', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ========== 批改弹窗 ========== */
.grade-dialog ::v-deep .el-alert {
  padding: 10px 12px;
}

.readonly-input ::v-deep .el-input__inner {
  background: #f8f9fa;
  cursor: not-allowed;
}

.submission-content {
  min-height: 40px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.file-download-link,
.view-code-link {
  font-size: 13px;
}

.original-grade {
  padding: 10px 12px;
  background: #fdf6ec;
  border: 1px dashed #faecd8;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
}

.original-score {
  font-weight: 600;
  margin-right: 8px;
}
.original-score.score-excellent { color: #67c23a; }
.original-score.score-good { color: #409eff; }
.original-score.score-pass { color: #e6a23c; }
.original-score.score-fail { color: #f56c6c; }

.original-comment {
  color: #666;
}

.original-time {
  color: #909399;
  font-size: 12px;
}

/* ========== 表单提示 ========== */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .submission-deadline {
    flex-direction: column;
    align-items: flex-start;
  }

  .ml-2 { margin-left: 0; margin-top: 4px; }
}

/* ========== Element UI 深度定制 ========== */
.el-form-item__label {
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.el-input >>> .el-input__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  height: 40px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.el-input >>> .el-input__inner:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.el-textarea >>> .el-textarea__inner {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.el-message {
  z-index: 9999 !important;
}
</style>