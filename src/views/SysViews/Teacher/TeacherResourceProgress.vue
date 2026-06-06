<template>
  <div class="assignment-progress">

    <!-- 页面标题 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📊 作业学习进度分析</h2>
        <p class="page-subtitle">多维度数据可视化，精准掌握学生学习情况</p>
      </div>
      <div class="header-actions">
        <el-tag size="mini" effect="dark" type="primary" class="course-tag">
          📚 {{ courseName }}
        </el-tag>
        <el-tag size="mini" effect="dark" type="success" class="assignment-tag">
          📝 {{ assignmentTitle }}
        </el-tag>
        <el-button
            size="small"
            icon="el-icon-refresh"
            @click="fetchProgress"
            :loading="loading"
            class="refresh-btn"
        >
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card stat-total">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">应交份数</div>
          </div>
          <el-progress
              :percentage="getCompletionRate()"
              :show-text="false"
              :stroke-width="3"
              class="stat-progress"
          />
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card stat-submitted">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.submitted }}</div>
            <div class="stat-label">已交份数</div>
          </div>
          <div class="stat-trend">
            完成率 {{ getCompletionRate() }}%
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card stat-late">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.lateRate }}%</div>
            <div class="stat-label">迟交率</div>
          </div>
          <div class="stat-trend" :class="getLateRateClass()">
            {{ getLateRateTip() }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card stat-pass">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.passRate }}%</div>
            <div class="stat-label">及格率</div>
          </div>
          <div class="stat-trend" :class="getPassRateClass()">
            {{ getPassRateTip() }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="16" class="charts-row">
      <!-- 提交状态饼图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <h3 class="chart-title">🥧 提交状态分布</h3>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-dot submitted"></span>
                已提交
              </span>
              <span class="legend-item">
                <span class="legend-dot not-submitted"></span>
                未提交
              </span>
            </div>
          </div>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 提交时间趋势折线图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <h3 class="chart-title">📈 提交时间趋势</h3>
            <el-radio-group v-model="trendType" size="mini" @change="updateTrendChart">
              <el-radio-button label="day">按天</el-radio-button>
              <el-radio-button label="hour">按时</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 分数分布柱状图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <h3 class="chart-title">🎯 分数分布统计</h3>
          </div>
          <div ref="scoreChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- ⭐ 迟交原因分析（对接后端 AI 接口） -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <div class="chart-header">
            <h3 class="chart-title">⚠️ 迟交原因分析</h3>
          </div>

          <!-- 分析中遮罩 -->
          <div v-if="analyzingLate" class="chart-loading-mask">
            <i class="el-icon-loading"></i>
            <span>AI 正在智能分析迟交原因...</span>
            <span class="loading-tip">首次分析可能需要 10-30 秒</span>
          </div>

          <!-- 错误提示 -->
          <div v-else-if="lateAnalysisError" class="chart-error-mask">
            <i class="el-icon-warning-outline"></i>
            <span>{{ lateAnalysisError }}</span>
            <el-button size="mini" type="text" @click="updateLateChart">
              重试
            </el-button>
          </div>

          <div ref="lateChartRef" class="chart-container"></div>

          <!-- 底部注释（动态更新） -->
          <div class="chart-note">
            <i class="el-icon-info"></i>
            数据来源于学生提交的迟交理由，由ai进行分析仅供参考
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 提交列表 -->
    <el-card class="table-card" shadow="hover">
      <div class="table-header">
        <h3 class="table-title">📋 提交明细</h3>
        <div class="table-actions">
          <el-input
              v-model="searchText"
              placeholder="搜索学生姓名..."
              prefix-icon="el-icon-search"
              size="small"
              class="search-input"
              clearable
              @input="filterSubmissions"
          />
          <el-select
              v-model="filterStatus"
              placeholder="筛选状态"
              size="small"
              class="filter-select"
              clearable
              @change="filterSubmissions"
          >
            <el-option label="全部" value=""/>
            <el-option label="✅ 已提交" value="submitted"/>
            <el-option label="⏳ 未提交" value="not-submitted"/>
            <el-option label="⏰ 迟交" value="late"/>
          </el-select>
        </div>
      </div>

      <el-table
          :data="filteredSubmissionList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: '600'}"
          :row-style="{height: '56px'}"
          class="submission-table"
      >
        <el-table-column type="index" label="序号" width="70" align="center"/>

        <el-table-column prop="studentName" label="学生" min-width="120">
          <template #default="{ row }">
            <div class="student-cell">
              <el-avatar :size="28" :icon="'el-icon-s-custom'" class="student-avatar"/>
              <span class="student-name">{{ row.studentName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="submitTime" label="提交时间" width="160" align="center" sortable>
          <template #default="{ row }">
            <div class="time-cell">
              <i class="el-icon-time"></i>
              {{ row.submitTime ? formatDateTime(row.submitTime) : '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="isLate" label="提交状态" width="110" align="center" sortable>
          <template #default="{ row }">
            <el-tag
                :type="getSubmitTagType(row)"
                :effect="getSubmitTagEffect(row)"
                size="mini"
                class="status-tag"
            >
              {{ getSubmitStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="分数" width="100" align="center" sortable>
          <template #default="{ row }">
            <div class="score-cell">
              <span v-if="row.score !== null"
                    :class="['score-value', getScoreClass(row.score)]">
                {{ row.score }}
              </span>
              <el-tag v-else size="mini" type="info" effect="plain">待批改</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="text"
                class="action-view"
                @click="viewSubmission(row)"
            >
              🔍 详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
          v-if="filteredSubmissionList.length === 0 && !loading"
          :image-size="120"
          description="暂无提交记录"
          class="empty-state"
      />

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="filteredSubmissionList.length > 10">
        <el-pagination
            @current-change="handlePageChange"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="filteredSubmissionList.length"
            layout="total, prev, pager, next"
            background
            :pager-count="5"
        />
      </div>
    </el-card>

    <!-- 提交详情弹窗 -->
    <el-dialog
        title="🔍 提交详情"
        :visible.sync="detailDialogVisible"
        width="480px"
        :close-on-click-modal="false"
        class="dialog-custom"
    >
      <div class="detail-content" v-if="currentSubmission">
        <div class="detail-row">
          <span class="detail-label">👤 学生：</span>
          <span class="detail-value">{{ currentSubmission.studentName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 提交时间：</span>
          <span class="detail-value">{{ formatDateTime(currentSubmission.submitTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">⏰ 提交状态：</span>
          <el-tag
              :type="getSubmitTagType(currentSubmission)"
              size="mini"
              class="detail-tag"
          >
            {{ getSubmitStatusText(currentSubmission) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">🎯 分数：</span>
          <span :class="['detail-value', 'score-value', getScoreClass(currentSubmission.score)]">
            {{ currentSubmission.score !== null ? currentSubmission.score + ' 分' : '待批改' }}
          </span>
        </div>
        <div class="detail-row" v-if="currentSubmission.teacherComment">
          <span class="detail-label">💬 评语：</span>
          <span class="detail-value comment">{{ currentSubmission.teacherComment }}</span>
        </div>
        <div class="detail-row" v-if="currentSubmission.lateReason">
          <span class="detail-label">📝 迟交理由：</span>
          <span class="detail-value comment">{{ currentSubmission.lateReason }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
        <el-button
            type="primary"
            icon="el-icon-edit"
            @click="goToGrade(currentSubmission)"
        >
          批改作业
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'

export default {
  name: 'AssignmentProgress',

  data() {
    return {
      analyzingLate: false,
      lateAnalysisError: null,

      assignmentId: null,
      assignmentTitle: '',
      courseId: null,
      courseName: '',

      loading: false,
      stats: {
        total: 0,
        submitted: 0,
        lateRate: 0,
        passRate: 0
      },
      submissionList: [],

      // 筛选相关
      searchText: '',
      filterStatus: '',
      filteredSubmissionList: [],
      currentPage: 1,
      pageSize: 10,

      // 图表相关
      pieChart: null,
      trendChart: null,
      scoreChart: null,
      lateChart: null,
      trendType: 'day',

      // 详情弹窗
      detailDialogVisible: false,
      currentSubmission: null
    }
  },

  created() {
    this.assignmentId = this.$route.query.assignmentId
    this.assignmentTitle = this.$route.query.assignmentTitle
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.assignmentId && this.courseId) {
      this.fetchProgress()
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initCharts()
    })
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy() {
    this.destroyCharts()
    window.removeEventListener('resize', this.handleResize)
  },

  methods: {
    // ========== 工具方法 ==========
    getCompletionRate() {
      if (!this.stats.total) return 0
      return Math.round((this.stats.submitted / this.stats.total) * 100)
    },
    getLateRateClass() {
      if (this.stats.lateRate <= 10) return 'trend-good'
      if (this.stats.lateRate <= 30) return 'trend-warning'
      return 'trend-bad'
    },
    getLateRateTip() {
      if (this.stats.lateRate <= 10) return '✅ 表现优秀'
      if (this.stats.lateRate <= 30) return '⚠️ 需关注'
      return '❌ 需干预'
    },
    getPassRateClass() {
      if (this.stats.passRate >= 90) return 'trend-good'
      if (this.stats.passRate >= 70) return 'trend-warning'
      return 'trend-bad'
    },
    getPassRateTip() {
      if (this.stats.passRate >= 90) return '✅ 优秀'
      if (this.stats.passRate >= 70) return '⚠️ 良好'
      return '❌ 需提升'
    },
    getSubmitTagType(row) {
      if (!row.submitTime) return 'info'
      if (row.isLate) return 'danger'
      return 'success'
    },
    getSubmitTagEffect(row) {
      return row.isLate ? 'dark' : 'light'
    },
    getSubmitStatusText(row) {
      if (!row.submitTime) return '未提交'
      return row.isLate ? '⏰ 迟交' : '✅ 按时'
    },
    getScoreClass(score) {
      if (score === null || score === undefined) return ''
      if (score >= 90) return 'score-excellent'
      if (score >= 75) return 'score-good'
      if (score >= 60) return 'score-pass'
      return 'score-fail'
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()
      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')
      return isToday ? `今天 ${h}:${m}` : `${date.getMonth() + 1}-${date.getDate()} ${h}:${m}`
    },
    filterSubmissions() {
      let filtered = [...this.submissionList]
      if (this.searchText) {
        const keyword = this.searchText.toLowerCase()
        filtered = filtered.filter(s => s.studentName?.toLowerCase().includes(keyword))
      }
      if (this.filterStatus) {
        filtered = filtered.filter(s => {
          if (this.filterStatus === 'submitted') return !!s.submitTime
          if (this.filterStatus === 'not-submitted') return !s.submitTime
          if (this.filterStatus === 'late') return s.isLate
          return true
        })
      }
      this.filteredSubmissionList = filtered
      this.currentPage = 1
    },
    handlePageChange(page) {
      this.currentPage = page
    },

    // ========== 数据加载 ==========
    async fetchProgress() {
      if (!this.assignmentId) return
      this.loading = true
      try {
        const resp = await axios.get(`/api/teacher/assignments/${this.assignmentId}/progress`)
        if (resp.data.code === 1) {
          this.stats = resp.data.data.stats || {}
          this.submissionList = resp.data.data.submissions || []
          // 确保迟交理由字段存在
          this.submissionList.forEach(s => {
            if (s.isLate && !s.lateReason) s.lateReason = '未填写理由'
          })
          this.filterSubmissions()
          this.updateAllCharts()
        }
      } catch (e) {
        console.error('Fetch progress error:', e)
        this.$message.error('加载进度数据失败')
        this.stats = {total: 0, submitted: 0, lateRate: 0, passRate: 0}
        this.submissionList = []
        this.filteredSubmissionList = []
      } finally {
        this.loading = false
      }
    },

    // ========== 图表初始化 ==========
    initCharts() {
      if (this.$refs.pieChartRef) this.pieChart = echarts.init(this.$refs.pieChartRef)
      if (this.$refs.trendChartRef) this.trendChart = echarts.init(this.$refs.trendChartRef)
      if (this.$refs.scoreChartRef) this.scoreChart = echarts.init(this.$refs.scoreChartRef)
      if (this.$refs.lateChartRef) this.lateChart = echarts.init(this.$refs.lateChartRef)
      this.updateAllCharts()
    },
    destroyCharts() {
      [this.pieChart, this.trendChart, this.scoreChart, this.lateChart].forEach(chart => {
        if (chart) chart.dispose()
      })
    },
    handleResize() {
      [this.pieChart, this.trendChart, this.scoreChart, this.lateChart].forEach(chart => {
        if (chart) chart.resize()
      })
    },
    updateAllCharts() {
      this.updatePieChart()
      this.updateTrendChart()
      this.updateScoreChart()
      this.updateLateChart()
    },

    // 🥧 饼图：提交状态分布
    updatePieChart() {
      if (!this.pieChart) return
      const submitted = this.stats.submitted || 0
      const notSubmitted = Math.max(0, (this.stats.total || 0) - submitted)
      const option = {
        tooltip: {trigger: 'item', formatter: '{b}: {c} ({d}%)'},
        legend: {show: false},
        series: [{
          name: '提交状态',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '55%'],
          itemStyle: {borderRadius: 12, borderColor: '#fff', borderWidth: 3},
          label: {show: false},
          emphasis: {label: {show: true, fontSize: 16, fontWeight: 'bold', formatter: '{b}\n{c}份'}},
          data: [
            {
              value: submitted,
              name: '已提交',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                  offset: 0,
                  color: '#67c23a'
                }, {offset: 1, color: '#95d475'}])
              }
            },
            {
              value: notSubmitted,
              name: '未提交',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                  offset: 0,
                  color: '#909399'
                }, {offset: 1, color: '#c0c4cc'}])
              }
            }
          ]
        }]
      }
      this.pieChart.setOption(option)
    },

    // 📈 折线图：提交时间趋势
    updateTrendChart() {
      if (!this.trendChart) return
      const timeMap = {}
      this.submissionList.forEach(s => {
        if (!s.submitTime) return
        const date = new Date(s.submitTime)
        const key = this.trendType === 'day' ? `${date.getMonth() + 1}-${date.getDate()}` : `${date.getHours()}:00`
        timeMap[key] = (timeMap[key] || 0) + 1
      })
      const xAxis = this.trendType === 'day' ? this.generateDateRange(this.submissionList) : Array.from({length: 24}, (_, i) => `${i}:00`)
      const series = xAxis.map(key => timeMap[key] || 0)
      const option = {
        tooltip: {trigger: 'axis', formatter: '{b}<br/>{a}: {c}人'},
        grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
        xAxis: {
          type: 'category',
          data: xAxis,
          axisLabel: {color: '#666', fontSize: 11, rotate: this.trendType === 'day' ? 0 : 45}
        },
        yAxis: {
          type: 'value',
          min: 0,
          axisLabel: {color: '#666', fontSize: 11},
          splitLine: {lineStyle: {type: 'dashed', color: '#eee'}}
        },
        series: [{
          name: '提交人数', type: 'line', data: series, smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: {
            width: 3,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{offset: 0, color: '#667eea'}, {
              offset: 1,
              color: '#764ba2'
            }])
          },
          itemStyle: {color: '#667eea', borderColor: '#fff', borderWidth: 2},
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(102,126,234,0.3)'
            }, {offset: 1, color: 'rgba(102,126,234,0.05)'}])
          },
          label: {show: true, position: 'top', fontSize: 10, color: '#666'}
        }]
      }
      this.trendChart.setOption(option)
    },
    generateDateRange(submissions) {
      if (submissions.length === 0) return []
      const dates = submissions.filter(s => s.submitTime).map(s => new Date(s.submitTime).toDateString())
      const unique = [...new Set(dates)].map(d => new Date(d))
      if (unique.length === 0) return []
      unique.sort((a, b) => a - b)
      return unique.map(d => `${d.getMonth() + 1}-${d.getDate()}`)
    },

    // 柱状图：分数分布
    updateScoreChart() {
      if (!this.scoreChart) return
      const ranges = [
        {name: '90-100', min: 90, max: 100, count: 0, color: '#67c23a'},
        {name: '75-89', min: 75, max: 89, count: 0, color: '#409eff'},
        {name: '60-74', min: 60, max: 74, count: 0, color: '#e6a23c'},
        {name: '0-59', min: 0, max: 59, count: 0, color: '#f56c6c'}
      ]
      this.submissionList.forEach(s => {
        if (s.score !== null && s.score !== undefined) {
          const range = ranges.find(r => s.score >= r.min && s.score <= r.max)
          if (range) range.count++
        }
      })
      const option = {
        tooltip: {trigger: 'axis', axisPointer: {type: 'shadow'}, formatter: '{b}<br/>{a}: {c}人'},
        grid: {left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true},
        xAxis: {type: 'category', data: ranges.map(r => r.name), axisLabel: {color: '#666', fontSize: 12}},
        yAxis: {
          type: 'value',
          min: 0,
          axisLabel: {color: '#666', fontSize: 11},
          splitLine: {lineStyle: {type: 'dashed', color: '#eee'}}
        },
        series: [{
          name: '人数', type: 'bar',
          data: ranges.map(r => ({
            value: r.count,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: r.color}, {
                offset: 1,
                color: r.color + '99'
              }]), borderRadius: [6, 6, 0, 0]
            }
          })),
          label: {show: true, position: 'top', fontSize: 11, color: '#666'},
          barWidth: '40%'
        }]
      }
      this.scoreChart.setOption(option)
    },

    // 饼图：迟交原因分析
    async updateLateChart() {
      if (!this.lateChart) return
      this.analyzingLate = true
      this.lateAnalysisError = null

      try {
        // 1. 提取迟交理由
        const lateReasons = this.submissionList
            .filter(s => s.isLate && s.lateReason?.trim())
            .map(s => s.lateReason.trim())

        if (lateReasons.length === 0) {
          this.renderEmptyLateChart('暂无迟交记录')
          return
        }

        // 2. 调用后端分析接口
        const resp = await axios.post(
            `/api/chat/teacher/assignments/${this.assignmentId}/late-reasons/analyze`,
            {
              reasons: lateReasons,
              expectedCategories: ['时间管理', '技术困难', '理解偏差', '个人事务', '其他原因']
            },
            {timeout: 30000}
        )

        // 3. 处理响应
        if (resp.data.code === 1 && resp.data.data?.categories?.length > 0) {
          const result = resp.data.data
          console.log('AI 分析结果:', result)  // 调试部分
          // 确保 categories 是数组且每项都有 name
          const validCategories = (result.categories || []).filter(c => c?.name?.trim())

          if (validCategories.length > 0) {
            this.renderLateChart(validCategories, result.summary)
          } else {
            throw new Error('分类数据格式异常')
          }
        } else {
          throw new Error(resp.data.msg || '分析返回数据格式异常')
        }

      } catch (e) {
        console.error('Late reason analysis failed:', e)
        this.lateAnalysisError = e.message || '分析失败'

        // 降级：调用 fallback
        try {
          const fallbackResp = await axios.post(
              `/api/teacher/assignments/${this.assignmentId}/late-reasons/analyze`,
              {reasons: this.submissionList.filter(s => s.isLate).map(s => s.lateReason || '未填写理由')},
              {timeout: 10000}
          )
          if (fallbackResp.data.code === 1 && fallbackResp.data.data?.categories?.length > 0) {
            this.$message.warning('智能分析暂时不可用，已使用基础分类')
            this.renderLateChart(fallbackResp.data.data.categories, fallbackResp.data.data.summary)
            return
          }
        } catch (fbErr) {
          console.warn('Fallback analysis failed:', fbErr)
        }

        this.renderEmptyLateChart('分析失败，请重试')
        this.$message.error('迟交原因分析暂时不可用')

      } finally {
        this.analyzingLate = false
      }
    },

    // 渲染分析结果的图表
    renderLateChart(categories, summary) {
      if (!this.lateChart) return

      const categoryMap = {}
      categories.forEach(c => {
        // 使用trim()去除可能的空格，确保匹配可靠
        const key = c.name?.trim()
        if (key) categoryMap[key] = c
      })

      const option = {
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            // 优先用映射表查找，其次用模糊匹配
            const itemName = params.name?.trim()
            const item = categoryMap[itemName] ||
                categories.find(c => c.name?.trim() === itemName)

            let examples = '无'
            if (item?.examples && Array.isArray(item.examples) && item.examples.length > 0) {
              examples = item.examples.slice(0, 2).join('；')
            }

            return `
          <div style="font-weight:600">${params.name}</div>
          <div>${params.value}人 (${params.percent}%)</div>
          <div style="color:#909399;font-size:11px;margin-top:4px">示例：${examples}</div>
        `
          }
        },
        legend: {
          top: '5%',
          left: 'center',
          textStyle: {color: '#666', fontSize: 11},
          formatter: (name) => {
            const key = name?.trim()
            const item = categoryMap[key] || categories.find(c => c.name?.trim() === key)
            return `${name} (${item?.value || 0})`
          }
        },
        series: [{
          name: '迟交原因',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {show: false},
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
              formatter: (params) => {
                const itemName = params.name?.trim()
                const item = categoryMap[itemName]
                return item ? `${params.name}\n${item.value}人` : params.name
              }
            }
          },
          data: categories.map(r => {
            // 确保每个数据项都有必需的字段
            return {
              name: r.name?.trim() || '未知分类',
              value: typeof r.value === 'number' ? r.value : 0,
              itemStyle: {
                color: r.color && /^#?[0-9A-F]{6}$/i.test(r.color) ? r.color : '#909399'
              }
            }
          })
        }]
      }

      this.lateChart.setOption(option, true)

      // 更新底部注释
      this.updateLateChartNote(summary)
    },

    renderEmptyLateChart(message) {
      if (!this.lateChart) return
      const option = {
        tooltip: {trigger: 'item'},
        series: [{
          type: 'pie', radius: ['40%', '70%'], center: ['50%', '55%'],
          itemStyle: {borderRadius: 10, borderColor: '#fff', borderWidth: 2},
          label: {show: true, formatter: message, fontSize: 13, color: '#909399'},
          data: [{value: 1, name: message, itemStyle: {color: '#c0c4cc'}}],
          silent: true
        }]
      }
      this.lateChart.setOption(option)
      this.updateLateChartNote(null)
    },

    updateLateChartNote(summary) {
      const noteEl = this.$el.querySelector('.chart-note')
      if (!noteEl) return
      if (summary && summary.trim()) {
        noteEl.innerHTML = `<i class="el-icon-lightbulb" style="color:#e6a23c;margin-right:4px"></i><strong>AI 分析建议：</strong>${summary}`
        noteEl.style.color = '#666'
      } else {
        noteEl.innerHTML = `<i class="el-icon-info" style="margin-right:4px"></i>数据来源于学生提交的迟交理由，仅供参考`
        noteEl.style.color = '#909399'
      }
    },

    // ========== 交互方法 ==========
    viewSubmission(row) {
      this.currentSubmission = row
      this.detailDialogVisible = true
    },
    goToGrade() {
      this.detailDialogVisible = false
      this.$router.push({path: '/teacher/assignments', query: {courseId: this.courseId, courseName: this.courseName}})
      this.$message.info('已跳转到作业管理页面，请找到对应学生进行批改')
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.assignment-progress {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin: 20px;
  padding: 0 10px;
  gap: 12px;
  flex-wrap: wrap;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.course-tag, .assignment-tag {
  font-size: 13px;
}

.refresh-btn {
  padding: 8px 16px;
}

/* ========== 统计卡片 ========== */
.stats-row {
  padding: 0 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid;
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.stat-total {
  border-left-color: #409eff;
}

.stat-submitted {
  border-left-color: #67c23a;
}

.stat-late {
  border-left-color: #e6a23c;
}

.stat-pass {
  border-left-color: #667eea;
}

.stat-icon {
  font-size: 28px;
  margin-right: 14px;
  width: 40px;
  text-align: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.stat-progress {
  margin-top: 8px;
}

.stat-trend {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.stat-trend.trend-good {
  color: #67c23a;
  font-weight: 500;
}

.stat-trend.trend-warning {
  color: #e6a23c;
  font-weight: 500;
}

.stat-trend.trend-bad {
  color: #f56c6c;
  font-weight: 500;
}

/* ========== 图表卡片 ========== */
.charts-row {
  padding: 0 20px;
}

.chart-card {
  margin-bottom: 16px;
  border-radius: 12px;
  position: relative;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px 0;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-dot.submitted {
  background: linear-gradient(135deg, #67c23a, #95d475);
}

.legend-dot.not-submitted {
  background: linear-gradient(135deg, #909399, #c0c4cc);
}

.chart-container {
  width: 100%;
  height: 260px;
}

.chart-note {
  font-size: 11px;
  color: #909399;
  padding: 8px 20px 0;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

/* ⭐ 迟交分析遮罩样式 */
.chart-loading-mask, .chart-error-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 40px;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #666;
  font-size: 13px;
  z-index: 10;
  border-radius: 12px;
}

.chart-loading-mask {
  pointer-events: none;
}

.chart-loading-mask i {
  font-size: 24px;
  color: #409eff;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-tip {
  font-size: 11px;
  color: #909399;
}

.chart-error-mask {
  pointer-events: auto;
  background: rgba(255, 248, 248, 0.98);
  border: 1px dashed #f56c6c;
}

.chart-error-mask i {
  font-size: 24px;
  color: #f56c6c;
}

.chart-error-mask .el-button {
  margin-top: 4px;
  font-size: 12px;
}

/* ========== 表格卡片 ========== */
.table-card {
  margin: 0 20px 20px 20px;
  border-radius: 12px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;
  gap: 12px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.filter-select {
  width: 140px;
}

.submission-table ::v-deep .el-table__row {
  transition: all 0.2s ease;
}

.submission-table ::v-deep .el-table__row:hover {
  background: #f8f9fa !important;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.time-cell i {
  color: #909399;
  font-size: 11px;
}

.status-tag {
  font-size: 12px;
  padding: 2px 10px;
}

.score-cell {
  font-weight: 600;
}

.score-excellent {
  color: #67c23a;
}

.score-good {
  color: #409eff;
}

.score-pass {
  color: #e6a23c;
}

.score-fail {
  color: #f56c6c;
}

.action-view {
  color: #409eff;
  font-size: 12px;
}

.action-view:hover {
  font-weight: 500;
}

.empty-state {
  padding: 40px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
}

/* ========== 详情弹窗 ========== */
.dialog-custom ::v-deep .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.dialog-custom ::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  margin: 0;
}

.dialog-custom ::v-deep .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn {
  top: 16px;
}

.dialog-custom ::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: white;
}

.dialog-custom ::v-deep .el-dialog__body {
  padding: 20px 24px;
  background: #fff;
}

.dialog-custom ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #ebeef5;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.detail-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
  min-width: 90px;
}

.detail-value {
  flex: 1;
  color: #303133;
  font-size: 14px;
  line-height: 1.5;
}

.detail-value.comment {
  background: #f8f9fa;
  padding: 10px 14px;
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

.detail-tag {
  font-size: 12px;
  padding: 2px 10px;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-row {
    padding: 0 10px;
  }

  .stat-card {
    margin-bottom: 12px;
    padding: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .charts-row {
    padding: 0 10px;
  }

  .chart-container {
    height: 220px;
  }

  .table-card {
    margin: 0 10px 20px 10px;
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input, .filter-select {
    width: 100%;
  }
}

/* ========== Element UI 深度定制 ========== */
.el-card {
  border-radius: 12px;
  border: none;
}

.el-card ::v-deep .el-card__body {
  padding: 16px;
}

.el-table {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: transparent;
}

.el-tag {
  border-radius: 12px;
}

.el-input >>> .el-input__inner {
  border-radius: 8px;
  border: 1px solid #dcdfe6;
  height: 36px;
  font-size: 13px;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.el-select >>> .el-input__inner {
  border-radius: 8px;
  height: 36px;
}

.el-radio-button__inner {
  padding: 6px 12px;
  font-size: 12px;
}

.el-message {
  z-index: 9999 !important;
}
</style>