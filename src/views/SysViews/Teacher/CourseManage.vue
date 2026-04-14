<template>
  <div class="course-manage">

    <!-- 页面标题 + 创建按钮 -->
    <div class="page-header">
      <h2 class="page-title">我的课程</h2>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
        创建课程
      </el-button>
    </div>

    <!-- 搜索区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="课程名称">
          <el-input
              v-model="searchForm.courseName"
              placeholder="输入名称搜索"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="开放中" value="OPEN" />
            <el-option label="已结课" value="CLOSED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 课程列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="courseList" v-loading="loading" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="courseName" label="课程名称" min-width="150" />

        <el-table-column prop="credits" label="学分" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="mini" type="info">{{ row.credits }} 分</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="人数" width="120" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-warning': isFull(row) }">
              {{ row.currentCount }} / {{ row.maxCapacity }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'OPEN' ? 'success' : 'info'" size="mini">
              {{ row.status === 'OPEN' ? '开放中' : '已结课' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="startDate" label="开始日期" width="120" align="center" />
        <el-table-column prop="endDate" label="结束日期" width="120" align="center" />

        <!-- 操作列：编辑 + 结课 + 关联模块入口 -->
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="mini" type="text" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button
                size="mini"
                type="text"
                :style="row.status === 'OPEN' ? 'danger' : 'success'"
                @click="toggleCourseStatus(row)"
            >
              {{ row.status === 'OPEN' ? '结课' : '开放' }}
            </el-button>

            <!-- ⭐ 关联模块入口（跳转独立页面） -->
            <el-divider direction="vertical" />
            <el-button size="mini" type="text" @click="goToAssignments(row)">
              作业
            </el-button>
            <el-button size="mini" type="text" @click="goToResources(row)">
              资源
            </el-button>
            <el-button size="mini" type="text" @click="goToStudents(row)">
              学生
            </el-button>
            <!-- 在课程操作列添加"问答"按钮 -->
            <el-button size="mini" type="text" @click="goToQa(row)">
              问答
            </el-button>
            <!-- 在课程操作列添加"发送通知"按钮 -->
            <el-button size="mini" type="success" @click="sendNotification(row)">
              发送通知
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

    <!-- 创建/编辑课程弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '创建课程' : '编辑课程'"
        :visible.sync="dialogVisible"
        width="500px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="form.courseName" placeholder="请输入课程名称" />
        </el-form-item>

        <el-form-item label="学分" prop="credits">
          <el-input-number
              v-model="form.credits"
              :min="0.5" :max="10" :step="0.5" :precision="1"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="最大人数" prop="maxCapacity">
          <el-input-number
              v-model="form.maxCapacity"
              :min="1" :max="200"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
              v-model="form.startDate"
              type="date"
              placeholder="选择开始日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
              v-model="form.endDate"
              type="date"
              placeholder="选择结束日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="开放选课">
          <el-switch
              v-model="form.selectionOpen"
              active-text="允许"
              inactive-text="禁止"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
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
  name: 'CourseManage',

  data() {
    return {
      // 搜索条件
      searchForm: { courseName: '', status: '' },

      // 表格数据
      loading: false,
      courseList: [],
      page: 1,
      size: 10,
      total: 0,

      // 弹窗相关
      dialogVisible: false,
      dialogType: 'add',
      submitting: false,
      form: {
        courseId: null,
        courseName: '',
        credits: 2.0,
        maxCapacity: 30,
        startDate: '',
        endDate: '',
        selectionOpen: true
      },
      rules: {
        courseName: [
          { required: true, message: '请输入课程名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        credits: [{ required: true, message: '请输入学分', trigger: 'blur' }],
        maxCapacity: [{ required: true, message: '请输入最大人数', trigger: 'blur' }]
      }
    }
  },

  created() {
    this.fetchCourses()
  },

  methods: {
    // 发送课程通知
    sendNotification(course) {
      this.$prompt('请输入通知标题', '发送课程通知', {
        confirmButtonText: '下一步',
        cancelButtonText: '取消',
        inputPattern: /^.{1,50}$/,
        inputErrorMessage: '标题长度 1-50 个字符'
      }).then(({ value: title }) => {
        this.$prompt('请输入通知内容', '发送课程通知', {
          confirmButtonText: '发送',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPattern: /^.{1,500}$/,
          inputErrorMessage: '内容长度 1-500 个字符'
        }).then(({ value: content }) => {
          this.submitNotification(course.courseId, title, content)
        }).catch(() => {
          this.$message.info('已取消发送')
        })
      }).catch(() => {
        this.$message.info('已取消')
      })
    },

    async submitNotification(courseId, title, content) {
      try {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
        const teacherId = userInfo.userId

        await axios.post('/api/teacher/notifications/send', {
          courseId,
          teacherId,
          title,
          content
        })

        this.$message.success('通知发送成功')
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '发送失败')
      }
    },
    // 跳转到课程问答页面
    goToQa(course) {
      this.$router.push({
        path: '/teacher/courseQA',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },
    // ========== 数据加载 ==========

    async fetchCourses() {
      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/courses', {
          params: {
            courseName: this.searchForm.courseName,
            status: this.searchForm.status,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.courseList = resp.data.data.records || []
          this.total = resp.data.data.total || 0
        }
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchCourses() },
    handleReset() { this.searchForm = { courseName: '', status: '' }; this.handleSearch() },
    handlePageChange(p) { this.page = p; this.fetchCourses() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchCourses() },

    // ========== 课程操作 ==========

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
        if (this.dialogType === 'add') {
          await axios.post('/api/teacher/courses', this.form)
          this.$message.success('课程创建成功')
        } else {
          await axios.put(`/api/teacher/courses/${this.form.courseId}`, this.form)
          this.$message.success('课程更新成功')
        }
        this.dialogVisible = false
        await this.fetchCourses()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.form = {
        courseId: null, courseName: '', credits: 2.0, maxCapacity: 30,
        startDate: '', endDate: '', selectionOpen: true
      }
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
    },

    handleDialogClose() { this.resetForm() },

    // 结课/开放课程
    async toggleCourseStatus(row) {
      const action = row.status === 'OPEN' ? '结课' : '开放'
      await this.$confirm(`确定要${action}课程「${row.courseName}」吗？`, '提示', { type: 'warning' })

      try {
        await axios.put(`/api/teacher/courses/${row.courseId}/status`, {
          status: row.status === 'OPEN' ? 'CLOSED' : 'OPEN'
        })
        this.$message.success(`${action}成功`)
        this.fetchCourses()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      }
    },

    // 判断是否满员
    isFull(row) { return row.currentCount >= row.maxCapacity },

    // ========== 关联模块跳转（核心！）==========

    goToAssignments(course) {
      // 跳转到作业管理页面，携带课程 ID
      this.$router.push({
        path: '/teacher/assignments',
        query: { courseId: course.courseId, courseName: course.courseName }
      })
    },

    goToResources(course) {
      this.$router.push({
        path: '/teacher/resources',
        query: { courseId: course.courseId, courseName: course.courseName }
      })
    },
    goToProgress(course) {
      this.$router.push({
        path: '/teacher/progress',
        query: { courseId: course.courseId, courseName: course.courseName }
      })
    },

    // eslint-disable-next-line no-unused-vars
    goToStudents(course) {
      this.$message.info('👥 学生管理功能开发中，敬请期待...')
      // 后续实现：
      // this.$router.push({ path: '/teacher/students', query: { courseId: course.courseId } })
    }
  }
}
</script>

<style scoped>
/* 复用你的 LoginView 风格 */
.course-manage { padding: 0; min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
.page-header { display: flex; justify-content: space-between; align-items: center; margin: 20px; }
.page-title { font-size: 20px; font-weight: 600; color: #303133; margin: 0; }
.filter-card, .table-card { margin: 0 20px 20px 20px; }
.text-warning { color: #e6a23c; font-weight: 500; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>