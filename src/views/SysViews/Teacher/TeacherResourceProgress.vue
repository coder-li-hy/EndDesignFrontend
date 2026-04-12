<template>
  <div class="resource-progress">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">资源学习进度</h2>
      <p class="course-info" v-if="courseName">课程：{{ courseName }}</p>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="学生">
          <el-input
              v-model="searchForm.studentName"
              placeholder="学生姓名"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.isCompleted" placeholder="全部" clearable @change="handleSearch">
            <el-option label="已学习" :value="true" />
            <el-option label="未学习" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 进度表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="progressList" v-loading="loading" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学生" width="120" />
        <el-table-column prop="resourceTitle" label="资源" min-width="180" show-overflow-tooltip />
        <el-table-column prop="resourceType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="mini" :type="getTypeTagType(row.resourceType)">
              {{ getTypeText(row.resourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isCompleted" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isCompleted ? 'success' : 'warning'" size="mini">
              {{ row.isCompleted ? '已学习' : '未学习' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewTime" label="学习时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.viewTime ? formatDateTime(row.viewTime) : '-' }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 简化分页 -->
      <div class="pagination-wrapper">
        <span style="color: #666; font-size: 14px">共 {{ total }} 条</span>
      </div>
    </el-card>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TeacherResourceProgress',

  data() {
    return {
      courseId: null,
      courseName: '',

      searchForm: {
        studentName: '',
        isCompleted: null
      },

      loading: false,
      progressList: [],
      total: 0
    }
  },

  mounted() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.courseId) {
      this.fetchProgressList()
    }else{
      this.$message.warning('未选择课程 请返回选择课程')
    }
  },
  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName
    console.log(this.courseId)

    if (this.courseId) {
      this.fetchProgressList()
    }
  },

  methods: {
    async fetchProgressList() {
      if (!this.courseId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/resources/progress', {
          params: {
            courseId: this.courseId,
            studentName: this.searchForm.studentName,
            isCompleted: this.searchForm.isCompleted
          }
        })
        if (resp.data.code === 1) {
          this.progressList = resp.data.data.list || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        // 简化：异常时返回空列表，不弹窗
        console.error('Fetch progress error:', e)
        this.progressList = []
        this.total = 0
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.fetchProgressList() },
    handleReset() {
      this.searchForm = { studentName: '', isCompleted: null }
      this.fetchProgressList()
    },

    getTypeTagType(type) {
      const map = { 'PPT': 'primary', 'VIDEO': 'success', 'FILE': 'warning', 'LINK': 'info' }
      return map[type] || 'info'
    },

    getTypeText(type) {
      const map = { 'PPT': 'PPT', 'VIDEO': '视频', 'FILE': '文档', 'LINK': '链接' }
      return map[type] || type
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime
    }
  }
}
</script>

<style scoped>
.resource-progress {
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

.filter-card, .table-card {
  margin: 0 20px 20px 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

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