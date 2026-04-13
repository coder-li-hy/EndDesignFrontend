<template>
  <div class="my-courses">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">我的课程</h2>
      <p class="user-info" v-if="studentName">
        欢迎，{{ studentName }}
      </p>
    </div>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabChange">

      <!-- 已选课程 -->
      <el-tab-pane label="已选课程" name="selected">
        <el-card class="course-card" shadow="never" v-for="course in selectedList" :key="course.courseId">
          <div class="course-header">
            <h3 class="course-name">{{ course.courseName }}</h3>
            <el-tag size="mini" type="success">已选</el-tag>
          </div>
          <div class="course-info">
            <span><i class="el-icon-user"></i> 教师：{{ course.teacherName }}</span>
            <span><i class="el-icon-time"></i> {{ course.startDate }} 至 {{ course.endDate }}</span>
            <span><i class="el-icon-s-data"></i> 学分：{{ course.credits }}</span>
            <span><i class="el-icon-s-order"></i> 人数：{{ course.currentCount }}/{{ course.maxCapacity }}</span>
          </div>
          <div class="course-actions">
            <el-button size="mini" type="text" @click="viewCourseDetail(course)">查看详情</el-button>
            <el-button size="mini" type="danger" @click="confirmCancel(course)">取消选课</el-button>
            <!-- 在 course-actions 区域添加按钮 -->
            <el-button
                size="mini"
                type="primary"
                @click="submitAssignment(course)"
            >
              提交作业
            </el-button>
            <!-- 在 course-actions 区域添加按钮（已选课程） -->
            <el-button
                size="mini"
                type="success"
                @click="openQa(course)"
            >
              问答
            </el-button>
          </div>
        </el-card>

        <!-- 空状态 -->
        <el-empty v-if="selectedList.length === 0" description="暂无已选课程" />
      </el-tab-pane>

      <!-- 排队课程 -->
      <el-tab-pane label="排队课程" name="queued">
        <el-card class="course-card" shadow="never" v-for="course in queuedList" :key="course.courseId">
          <div class="course-header">
            <h3 class="course-name">{{ course.courseName }}</h3>
            <el-tag size="mini" type="warning">排队中</el-tag>
          </div>
          <div class="course-info">
            <span><i class="el-icon-user"></i> 教师：{{ course.teacherName }}</span>
            <span><i class="el-icon-time"></i> {{ course.startDate }} 至 {{ course.endDate }}</span>
            <span><i class="el-icon-s-data"></i> 学分：{{ course.credits }}</span>
            <span><i class="el-icon-s-order"></i> 排队位置：{{ course.queuePosition || '-' }}</span>
          </div>
          <div class="course-actions">
            <el-button size="mini" type="text" @click="viewCourseDetail(course)">查看详情</el-button>
            <el-button size="mini" type="warning" @click="confirmCancel(course)">取消排队</el-button>
          </div>
        </el-card>

        <!-- 空状态 -->
        <el-empty v-if="queuedList.length === 0" description="暂无排队课程" />
      </el-tab-pane>

    </el-tabs>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentMyCourses',

  data() {
    return {
      studentId: null,
      studentName: '',
      activeTab: 'selected',

      selectedList: [],
      queuedList: [],
      loading: false
    }
  },

  created() {
    // 获取当前学生信息
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId
    this.studentName = userInfo.username

    if (this.studentId) {
      this.fetchMyCourses()
    }
  },

  methods: {
    // 跳转到课程提问页面
    openQa(course) {
      this.$router.push({
        path: '/student/courseQA',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },
    // 跳转到作业提交页面
    submitAssignment(course) {
      this.$router.push({
        path: '/student/submit',
        query: {
          courseId: course.courseId,
          courseName: course.courseName
        }
      })
    },
    async fetchMyCourses(status = 'SELECTED') {
      if (!this.studentId) return

      this.loading = true
      try {
        const resp = await axios.get('/api/student/courses/my', {
          params: {
            studentId: this.studentId,
            status: status
          }
        })
        if (resp.data.code === 1) {
          if (status === 'SELECTED') {
            this.selectedList = resp.data.data || []
          } else {
            this.queuedList = resp.data.data || []
          }
        }
      } catch (e) {
        console.error('Fetch my courses error:', e)
        this.$message.error('加载课程列表失败')
      } finally {
        this.loading = false
      }
    },

    handleTabChange(tab) {
      const status = tab.name === 'selected' ? 'SELECTED' : 'QUEUED'
      this.fetchMyCourses(status)
    },

    viewCourseDetail(course) {
      // 简化：弹窗显示课程详情
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

    async confirmCancel(course) {
      // 二次确认
      const action = this.activeTab === 'selected' ? '取消选课' : '取消排队'
      await this.$confirm(`确定要${action}「${course.courseName}」吗？${action === '取消选课' ? '取消后该课程将不再显示在"已选课程"中' : ''}`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      // 调用取消接口
      try {
        await axios.post(`/api/student/courses/${course.courseId}/cancel`, {
          studentId: this.studentId
        })
        this.$message.success(`${action}成功`)
        // 刷新当前列表
        const status = this.activeTab === 'selected' ? 'SELECTED' : 'QUEUED'
        this.fetchMyCourses(status)
      } catch (e) {
        this.$message.error(e.response?.data?.msg || `${action}失败`)
      }
    }
  }
}
</script>

<style scoped>
.my-courses {
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

.user-info {
  margin: 0;
  font-size: 14px;
  color: #666;
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
  gap: 12px;
}

/* Element UI 定制 */
.el-tabs {
  margin: 0 20px;
}

.el-empty {
  margin: 40px 0;
}
</style>