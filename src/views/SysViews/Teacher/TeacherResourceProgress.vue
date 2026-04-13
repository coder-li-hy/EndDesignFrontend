<template>
  <div class="assignment-progress">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">作业学习进度</h2>
      <p class="course-info">
        <el-tag size="mini">{{ courseName }}</el-tag>
        <span style="margin: 0 10px">/</span>
        <el-tag size="mini" type="primary">{{ assignmentTitle }}</el-tag>
      </p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">应交份数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ stats.submitted }}</div>
          <div class="stat-label">已交份数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ stats.lateRate }}%</div>
          <div class="stat-label">迟交率</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ stats.passRate }}%</div>
          <div class="stat-label">及格率</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-card class="chart-card" shadow="never">
      <div ref="chartRef" style="width: 100%; height: 300px"></div>
    </el-card>

    <!-- 提交列表 -->
    <el-card class="table-card" shadow="never" style="margin-top: 20px">
      <el-table :data="submissionList" v-loading="loading" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学生" width="120" />
        <el-table-column prop="submitTime" label="提交时间" width="160" align="center">
          <template #default="{ row }">
            {{ row.submitTime ? formatDateTime(row.submitTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="isLate" label="是否迟交" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isLate ? 'danger' : 'success'" size="mini">
              {{ row.isLate ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.score !== null" :class="{ 'text-success': row.score >= 60 }">
              {{ row.score }}
            </span>
            <el-tag v-else size="mini" type="info">未批改</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button size="mini" type="text" @click="viewSubmission(row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'

export default {
  name: 'TeacherResourceProgress',

  data() {
    return {
      assignmentId: null,
      assignmentTitle: '',
      courseId: null,
      courseName: '',

      loading: false,
      stats: {
        total: 0,      // 应交份数（选课人数）
        submitted: 0,  // 已交份数
        lateRate: 0,   // 迟交率
        passRate: 0    // 及格率
      },
      submissionList: [],

      chart: null
    }
  },

  created() {
    // 获取路由参数
    this.assignmentId = this.$route.query.assignmentId
    this.assignmentTitle = this.$route.query.assignmentTitle
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.assignmentId && this.courseId) {
      this.fetchProgress()
    }
  },

  mounted() {
    // 初始化图表
    this.initChart()
  },

  beforeDestroy() {
    // 销毁图表实例
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },

  methods: {
    async fetchProgress() {
      if (!this.assignmentId) return

      this.loading = true
      try {
        const resp = await axios.get(`/api/teacher/assignments/${this.assignmentId}/progress`)
        if (resp.data.code === 1) {
          this.stats = resp.data.data.stats || {}
          this.submissionList = resp.data.data.submissions || []
          this.updateChart()
        }
      } catch (e) {
        console.error('Fetch progress error:', e)
        // 容错：异常时显示空数据
        this.stats = { total: 0, submitted: 0, lateRate: 0, passRate: 0 }
        this.submissionList = []
      } finally {
        this.loading = false
      }
    },

    initChart() {
      if (this.$refs.chartRef) {
        this.chart = echarts.init(this.$refs.chartRef)
        this.updateChart()
      }
    },

    updateChart() {
      if (!this.chart) return

      const option = {
        tooltip: { trigger: 'item' },
        legend: { top: '5%', left: 'center' },
        series: [
          {
            name: '提交状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: { show: false, position: 'center' },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold' }
            },
            data: [
              { value: this.stats.submitted, name: '已提交', itemStyle: { color: '#67c23a' } },
              { value: Math.max(0, this.stats.total - this.stats.submitted), name: '未提交', itemStyle: { color: '#909399' } }
            ]
          }
        ]
      }

      this.chart.setOption(option)
    },

    viewSubmission(row) {
      // 简化：弹窗显示提交详情
      this.$alert(`
        <strong>学生：</strong>${row.studentName}<br>
        <strong>提交时间：</strong>${this.formatDateTime(row.submitTime)}<br>
        <strong>是否迟交：</strong>${row.isLate ? '是' : '否'}<br>
        <strong>分数：</strong>${row.score !== null ? row.score : '未批改'}<br>
        <strong>评语：</strong>${row.teacherComment || '-'}
      `, '提交详情', {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定'
      })
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime
    }
  }
}
</script>

<style scoped>
.assignment-progress {
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

.stat-card {
  text-align: center;
  padding: 20px 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.chart-card {
  margin: 0 20px;
}

.table-card {
  margin: 0 20px 20px 20px;
}

.text-success {
  color: #67c23a;
  font-weight: 500;
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