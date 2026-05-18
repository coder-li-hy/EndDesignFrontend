<template>
  <div class="course-manage">

    <!-- 页面标题 + 创建按钮 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📚 我的课程</h2>
        <p class="page-subtitle">管理您创建的所有课程，快速进入作业/资源/问答等模块</p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog" class="btn-primary">
        创建课程
      </el-button>
    </div>

    <!-- 搜索区 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="课程名称">
          <el-input
              v-model="searchForm.courseName"
              placeholder="输入名称搜索"
              clearable
              @keyup.enter.native="handleSearch"
              prefix-icon="el-icon-search"
              class="search-input"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
              v-model="searchForm.status"
              placeholder="全部"
              clearable
              class="status-select"
          >
            <el-option label="🟢 开放中" value="OPEN" />
            <el-option label="🟡 已结课" value="CLOSED" />
            <el-option label="⚫ 已结束" value="ENDED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 课程列表（卡片式布局） -->
    <el-card class="table-card" shadow="hover">
      <!-- 统计信息 -->
      <div class="course-stats" v-if="courseList.length > 0">
        <el-tag size="mini" type="success" effect="dark" class="stat-tag">
          📊 共 {{ total }} 门课程
        </el-tag>
        <el-tag size="mini" type="primary" effect="plain" class="stat-tag">
          🟢 开放中 {{ courseList.filter(c => c.status === 'OPEN').length }} 门
        </el-tag>
        <el-tag size="mini" type="info" effect="plain" class="stat-tag">
          🟡 已结课 {{ courseList.filter(c => c.status === 'CLOSED').length }} 门
        </el-tag>
      </div>

      <el-table
          :data="courseList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: '600'}"
          :row-style="{height: '72px'}"
          class="course-table"
      >
        <!-- 课程名称 + 描述 -->
        <el-table-column label="课程信息" min-width="200">
          <template #default="{ row }">
            <div class="course-info-cell">
              <div class="course-name" :title="row.courseName">{{ row.courseName }}</div>
              <div class="course-meta">
                <el-tag size="mini" :type="getCreditTagType(row.credits)" effect="plain">
                  {{ row.credits }} 学分
                </el-tag>
                <span class="meta-dot">•</span>
                <span class="meta-text">{{ getPeriodText(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 人数进度 -->
        <el-table-column label="选课人数" width="140" align="center">
          <template #default="{ row }">
            <div class="capacity-cell">
              <div class="capacity-text">
                <span :class="{ 'text-warning': isFull(row) }">
                  {{ row.currentCount }} / {{ row.maxCapacity }}
                </span>
              </div>
              <el-progress
                  :percentage="getCapacityPercent(row)"
                  :status="getCapacityStatus(row)"
                  :show-text="false"
                  :stroke-width="4"
                  class="capacity-progress"
              />
            </div>
          </template>
        </el-table-column>

        <!-- 状态标签 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getStatusType(row.status)"
                :effect="getStatusEffect(row.status)"
                size="mini"
                class="status-tag"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 时间范围 -->
        <el-table-column label="课程周期" width="160" align="center">
          <template #default="{ row }">
            <div class="date-range">
              <div class="date-item">
                <i class="el-icon-date"></i>
                {{ row.startDate || '-' }}
              </div>
              <div class="date-item">
                <i class="el-icon-date"></i>
                {{ row.endDate || '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 选课开关 -->
        <el-table-column label="选课" width="80" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.selectionOpen"
                :active-value="true"
                :inactive-value="false"
                active-color="#13ce66"
                inactive-color="#ff4949"
                :disabled="row.status !== 'OPEN'"
                @change="handleSelectionOpenChange(row)"
                :title="row.status !== 'OPEN' ? '仅开放中的课程可设置' : ''"
            />
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-group">
              <!-- 基础操作 -->
              <el-button size="mini" type="text" class="action-edit" @click.stop="openEditDialog(row)">
                ✏️ 编辑
              </el-button>
              <el-button
                  size="mini"
                  type="text"
                  :class="row.status === 'OPEN' ? 'action-close' : 'action-open'"
                  @click.stop="toggleCourseStatus(row)"
              >
                {{ row.status === 'OPEN' ? '🔒 结课' : '🔓 开放' }}
              </el-button>

              <!-- 分隔线 -->
              <el-divider direction="vertical" class="action-divider" />

              <!-- 模块入口 -->
              <el-tooltip content="作业管理" placement="top">
                <el-button size="mini" type="text" class="action-module" @click.stop="goToAssignments(row)">
                  📝
                </el-button>
              </el-tooltip>
              <el-tooltip content="课程资源" placement="top">
                <el-button size="mini" type="text" class="action-module" @click.stop="goToResources(row)">
                  📁
                </el-button>
              </el-tooltip>
              <el-tooltip content="课程问答" placement="top">
                <el-button size="mini" type="text" class="action-module" @click.stop="goToQa(row)">
                  💬
                </el-button>
              </el-tooltip>
              <el-tooltip content="发送通知" placement="top">
                <el-button size="mini" type="text" class="action-notify" @click.stop="sendNotification(row)">
                  🔔
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
          v-if="courseList.length === 0 && !loading"
          description="暂无课程，点击右上角「创建课程」开始吧～"
          :image-size="120"
          class="empty-state"
      >
        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
          创建第一门课程
        </el-button>
      </el-empty>

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

    <!-- 创建/编辑课程弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '✨ 创建新课程' : '✏️ 编辑课程信息'"
        :visible.sync="dialogVisible"
        width="520px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="dialog-custom"
    >
      <el-alert
          v-if="dialogType === 'add'"
          title="💡 创建课程后，可在课程详情页添加作业、上传资源、管理学生"
          type="info"
          :closable="false"
          show-icon
          class="mb-3"
      />

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="medium">
        <el-form-item label="课程名称" prop="courseName">
          <el-input
              v-model="form.courseName"
              placeholder="如：数据结构与算法、数据库原理"
              maxlength="50"
              show-word-limit
              clearable
          >
            <i slot="prefix" class="el-icon-school"></i>
          </el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学分" prop="credits">
              <el-input-number
                  v-model="form.credits"
                  :min="0.5" :max="10" :step="0.5" :precision="1"
                  style="width: 100%"
                  controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大人数" prop="maxCapacity">
              <el-input-number
                  v-model="form.maxCapacity"
                  :min="1" :max="500"
                  style="width: 100%"
                  controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                  v-model="form.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  :disabled-date="disabledStartDate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                  v-model="form.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                  :disabled-date="disabledEndDate"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="开放选课">
          <el-switch
              v-model="form.selectionOpen"
              active-text="允许学生选课"
              inactive-text="禁止选课"
              active-color="#13ce66"
              inactive-color="#ff4949"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            关闭后学生无法新选该课程，已选学生不受影响
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

    <!-- 发送通知弹窗 -->
    <el-dialog
        title="🔔 发送课程通知"
        :visible.sync="notifyDialogVisible"
        width="500px"
        :close-on-click-modal="false"
        class="dialog-custom"
    >
      <el-form :model="notifyForm" :rules="notifyRules" ref="notifyFormRef" label-width="100px">
        <el-form-item label="课程" prop="courseName">
          <el-input :value="notifyForm.courseName" disabled class="readonly-input">
            <i slot="prefix" class="el-icon-school"></i>
          </el-input>
        </el-form-item>

        <el-form-item label="通知标题" prop="title">
          <el-input
              v-model="notifyForm.title"
              placeholder="请输入通知标题，如：作业提交提醒"
              maxlength="50"
              show-word-limit
              clearable
          />
        </el-form-item>

        <el-form-item label="通知内容" prop="content">
          <el-input
              v-model="notifyForm.content"
              type="textarea"
              :rows="5"
              placeholder="请输入通知详细内容..."
              maxlength="500"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="notifyDialogVisible = false">取 消</el-button>
        <el-button type="success" :loading="sendingNotify" @click="submitNotificationForm">
          {{ sendingNotify ? '发送中...' : '📤 发送通知' }}
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
        maxCapacity: [{ required: true, message: '请输入最大人数', trigger: 'blur' }],
        startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
      },

      // 通知弹窗
      notifyDialogVisible: false,
      sendingNotify: false,
      notifyForm: {
        courseId: null,
        courseName: '',
        title: '',
        content: ''
      },
      notifyRules: {
        title: [
          { required: true, message: '请输入通知标题', trigger: 'blur' },
          { min: 1, max: 50, message: '标题长度 1-50 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入通知内容', trigger: 'blur' },
          { min: 1, max: 500, message: '内容长度 1-500 个字符', trigger: 'blur' }
        ]
      }
    }
  },

  created() {
    this.fetchCourses()
  },

  methods: {
    // ========== 工具方法 ==========

    // 学分标签类型
    getCreditTagType(credits) {
      if (credits >= 4) return 'danger'
      if (credits >= 3) return 'warning'
      return 'info'
    },

    // 获取周期文本
    getPeriodText(row) {
      if (!row.startDate || !row.endDate) return '未设置'
      const start = new Date(row.startDate)
      const end = new Date(row.endDate)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      return `${days} 天`
    },

    // 判断是否满员
    isFull(row) {
      return row.currentCount >= row.maxCapacity
    },

    // 获取容量百分比
    getCapacityPercent(row) {
      return Math.min(Math.round((row.currentCount / row.maxCapacity) * 100), 100)
    },

    // 获取容量进度条状态
    getCapacityStatus(row) {
      const percent = this.getCapacityPercent(row)
      if (percent >= 100) return 'exception'
      if (percent >= 80) return 'warning'
      return ''
    },

    // 获取状态标签类型
    getStatusType(status) {
      const map = { 'OPEN': 'success', 'CLOSED': 'warning', 'ENDED': 'info' }
      return map[status] || 'info'
    },

    // 获取状态标签效果
    getStatusEffect(status) {
      return status === 'OPEN' ? 'dark' : 'light'
    },

    // 获取状态文本
    getStatusText(status) {
      const map = { 'OPEN': '开放中', 'CLOSED': '已结课', 'ENDED': '已结束' }
      return map[status] || status
    },

    // 日期选择限制
    disabledStartDate(date) {
      return date > new Date()
    },
    disabledEndDate(date) {
      const start = this.form.startDate ? new Date(this.form.startDate) : null
      return start ? date < start : false
    },

    // ========== 事件处理 ==========

    // 行点击：进入课程详情（可选）
    // handleRowClick(row) {
    //   // 如果希望点击行进入课程详情页，可取消注释
    //   // this.$router.push({
    //   //   path: '/teacher/course-detail',
    //   //   query: { courseId: row.courseId, courseName: row.courseName }
    //   // })
    // },

    // 选课开关变更
    async handleSelectionOpenChange(row) {
      const action = row.selectionOpen ? '开放' : '禁止'
      try {
        await axios.put(`/api/teacher/courses/${row.courseId}/selection`, {
          selectionOpen: row.selectionOpen
        })
        this.$message.success(`已${action}选课`)
      } catch (e) {
        // 失败则恢复原状态
        row.selectionOpen = !row.selectionOpen
        this.$message.error(e.response?.data?.msg || '操作失败')
      }
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
        // 日期格式处理
        const submitData = {
          ...this.form,
          startDate: this.form.startDate || null,
          endDate: this.form.endDate || null
        }

        if (this.dialogType === 'add') {
          await axios.post('/api/teacher/courses', submitData)
          this.$message.success('课程创建成功')
        } else {
          await axios.put(`/api/teacher/courses/${this.form.courseId}`, submitData)
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
      const confirmText = row.status === 'OPEN'
          ? `确定要结课「${row.courseName}」吗？结课后学生将无法提交作业。`
          : `确定要重新开放「${row.courseName}」吗？`

      await this.$confirm(confirmText, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

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

    // ========== 模块跳转 ==========

    goToAssignments(course) {
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

    goToQa(course) {
      this.$router.push({
        path: '/teacher/courseQA',
        query: { courseId: course.courseId, courseName: course.courseName }
      })
    },

    // goToStudents(course) {
    //   this.$message.info('👥 学生管理功能开发中，敬请期待...')
    // },

    // ========== 发送通知 ==========

    // 打开通知弹窗
    sendNotification(course) {
      this.notifyForm = {
        courseId: course.courseId,
        courseName: course.courseName,
        title: '',
        content: ''
      }
      this.notifyDialogVisible = true
    },

    // 提交通知
    async submitNotificationForm() {
      try {
        await this.$refs.notifyFormRef.validate()
      } catch {
        return
      }

      this.sendingNotify = true
      try {
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
        const teacherId = userInfo.userId

        await axios.post('/api/teacher/notifications/send', {
          courseId: this.notifyForm.courseId,
          teacherId,
          title: this.notifyForm.title,
          content: this.notifyForm.content
        })

        this.$message.success('🎉 通知发送成功，该课程所有学生将收到通知')
        this.notifyDialogVisible = false
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '发送失败')
      } finally {
        this.sendingNotify = false
      }
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.course-manage {
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
  flex-wrap: wrap;
  gap: 12px;
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

.btn-primary {
  padding: 12px 28px;
  font-weight: 500;
  border-radius: 8px;
}

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

.search-input,
.status-select {
  width: 200px;
}

/* ========== 统计信息 ========== */
.course-stats {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
}

.stat-tag {
  font-size: 12px;
}

/* ========== 表格样式 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

.course-table ::v-deep .el-table__row {
  transition: all 0.2s ease;
  cursor: pointer;
}

.course-table ::v-deep .el-table__row:hover {
  background: #f8f9fa !important;
  transform: translateX(4px);
}

/* 课程信息单元格 */
.course-info-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.course-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.meta-dot {
  color: #dcdfe6;
}

.meta-text {
  color: #666;
}

/* 人数进度单元格 */
.capacity-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.capacity-text {
  font-size: 13px;
  font-weight: 500;
}

.text-warning {
  color: #e6a23c;
}

.capacity-progress {
  width: 100px;
}

/* 状态标签 */
.status-tag {
  font-size: 12px;
  padding: 2px 10px;
}

/* 日期范围 */
.date-range {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-item i {
  color: #909399;
  font-size: 11px;
}

/* 操作组 */
.action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-wrap: wrap;
}

.action-edit { color: #409eff; }
.action-close { color: #f56c6c; }
.action-open { color: #67c23a; }
.action-module {
  color: #909399;
  padding: 4px 6px;
  font-size: 14px;
}
.action-module:hover { color: #409eff; }
.action-notify {
  color: #e6a23c;
  padding: 4px 6px;
  font-size: 14px;
}
.action-notify:hover { color: #f56c6c; }

.action-divider {
  margin: 0 4px;
  height: 16px;
}

/* 空状态 */
.empty-state {
  padding: 40px 0;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 20px;
}

/* ========== 弹窗样式 ========== */
.dialog-custom ::v-deep .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-custom ::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.mb-3 { margin-bottom: 12px; }

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.readonly-input ::v-deep .el-input__inner {
  background: #f8f9fa;
  cursor: not-allowed;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .course-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-group {
    justify-content: flex-start;
  }
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
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.el-textarea >>> .el-textarea__inner {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.el-progress-bar__outer {
  border-radius: 2px;
}

.el-message {
  z-index: 9999 !important;
}
</style>