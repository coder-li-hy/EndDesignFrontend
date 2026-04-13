<template>
  <div class="course-market">

    <!-- 页面标题 + 搜索 -->
    <div class="page-header">
      <h2 class="page-title">选课超市</h2>
      <el-form :inline="true" :model="searchForm" size="small" style="margin-top: 10px">
        <el-form-item>
          <el-input
              v-model="searchForm.courseName"
              placeholder="课程名称"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 课程列表 -->
    <el-card class="course-card" shadow="never" v-for="course in courseList" :key="course.courseId">
      <div class="course-header">
        <h3 class="course-name">{{ course.courseName }}</h3>
        <el-tag size="mini" :type="course.isFull ? 'danger' : 'success'">
          {{ course.isFull ? '已满' : '可选' }}
        </el-tag>
      </div>
      <div class="course-info">
        <span><i class="el-icon-user"></i> 教师：{{ course.teacherName }}</span>
        <span><i class="el-icon-time"></i> {{ course.startDate }} 至 {{ course.endDate }}</span>
        <span><i class="el-icon-s-data"></i> 学分：{{ course.credits }}</span>
        <span><i class="el-icon-s-order"></i> 容量：{{ course.currentCount }}/{{ course.maxCapacity }}</span>
      </div>
      <div class="course-actions">
        <el-button size="mini" type="text" @click="viewCourseDetail(course)">详情</el-button>
        <!-- 已选/排队状态显示 -->
        <el-tag v-if="course.userStatus === 'SELECTED'" size="mini" type="success">已选</el-tag>
        <el-tag v-else-if="course.userStatus === 'QUEUED'" size="mini" type="warning">排队中</el-tag>
        <!-- 选课按钮 -->
        <el-button
            v-else
            size="mini"
            :type="course.isFull ? 'warning' : 'primary'"
            :loading="course.selecting"
            @click="handleSelect(course)"
        >
          {{ course.isFull ? '加入排队' : '立即选课' }}
        </el-button>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-if="courseList.length === 0" description="暂无可选课程" />

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

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentCourseMarket',

  data() {
    return {
      studentId: null,
      searchForm: { courseName: '' },

      page: 1,
      size: 10,
      total: 0,
      courseList: [],
      loading: false
    }
  },

  created() {
    // 获取当前学生信息
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.studentId) {
      this.fetchCourseMarket()
    }
  },

  methods: {
    async fetchCourseMarket() {
      if (!this.studentId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/student/courses/market', {
          params: {
            studentId: this.studentId,
            courseName: this.searchForm.courseName,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.courseList = resp.data.data.list || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch course market error:', e)
        this.$message.error('加载课程列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchCourseMarket() },
    handleReset() { this.searchForm = { courseName: '' }; this.handleSearch() },
    handlePageChange(p) { this.page = p; this.fetchCourseMarket() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchCourseMarket() },

    viewCourseDetail(course) {
      this.$alert(`
        <strong>课程名称：</strong>${course.courseName}<br>
        <strong>授课教师：</strong>${course.teacherName}<br>
        <strong>学分：</strong>${course.credits}<br>
        <strong>时间：</strong>${course.startDate} 至 ${course.endDate}<br>
        <strong>容量：</strong>${course.currentCount}/${course.maxCapacity}<br>
        <strong>状态：</strong>${course.status === 'OPEN' ? '开放中' : '已结课'}
      `, '课程详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      })
    },

    async handleSelect(course) {
      // 防止重复点击
      if (course.selecting) return

      course.selecting = true
      try {
        const resp = await axios.post(`/api/student/courses/${course.courseId}/select`, {
          studentId: this.studentId
        })

        if (resp.data.code === 1) {
          this.$message.success(resp.data.msg || '操作成功')
          // 刷新列表
          this.fetchCourseMarket()
        } else {
          this.$message.error(resp.data.msg || '操作失败')
        }
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '网络请求失败')
      } finally {
        course.selecting = false
      }
    }
  }
}
</script>

<style scoped>
.course-market {
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

.course-card {
  margin: 0 20px 20px 20px;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.course-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #666;
}

.course-info i {
  margin-right: 4px;
  color: #909399;
}

.course-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.pagination-wrapper {
  margin: 0 20px 20px 20px;
  display: flex;
  justify-content: flex-end;
}

/* Element UI 定制 */
.el-empty {
  margin: 40px 0;
}
</style>