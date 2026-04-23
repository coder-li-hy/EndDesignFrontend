<template>
  <div class="content-audit">

    <!-- 页面标题 + 统计卡片 -->
    <div class="page-header">
      <h2 class="page-title">内容审核</h2>
      <div class="stats-cards">
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon pending">📋</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-card>
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon passed">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.passed }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </el-card>
        <el-card shadow="never" class="stat-card">
          <div class="stat-icon rejected">❌</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="内容类型">
          <el-select v-model="searchForm.targetType" placeholder="全部" clearable @change="handleSearch">
            <el-option label="课程资源" value="RESOURCE" />
            <el-option label="问答互动" value="QA" />
            <el-option label="作业提交" value="SUBMISSION" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable @change="handleSearch">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="PASS" />
            <el-option label="已拒绝" value="REJECT" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
              v-model="searchForm.keyword"
              placeholder="标题/内容/用户名"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card class="table-card" shadow="never">
      <!-- 批量操作工具栏 -->
      <div class="table-toolbar" v-if="auditList.length > 0">
        <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
        <span class="selected-count" v-if="selectedIds.length">
          已选择 {{ selectedIds.length }} 项
        </span>
        <el-button
            size="small"
            type="success"
            icon="el-icon-check"
            :disabled="!selectedIds.length"
            @click="handleBatchApprove"
        >
          批量通过
        </el-button>
        <el-button
            size="small"
            type="danger"
            icon="el-icon-close"
            :disabled="!selectedIds.length"
            @click="openBatchRejectDialog"
        >
          批量拒绝
        </el-button>
      </div>

      <el-table
          ref="auditTable"
          :data="auditList"
          v-loading="loading"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />

        <!-- 内容类型 -->
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.targetType)" size="mini">
              {{ getTypeText(row.targetType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 内容预览（不同类型显示不同字段） -->
        <el-table-column label="内容预览" min-width="200">
          <template #default="{ row }">
            <div class="content-preview">
              <!-- 课程资源 -->
              <div v-if="row.targetType === 'RESOURCE'" class="preview-resource">
                <i class="el-icon-document"></i>
                <span class="preview-title">{{ row.resource?.title || '未知资源' }}</span>
                <el-tag size="mini" type="info">{{ row.resource?.type }}</el-tag>
              </div>
              <!-- 问答互动 -->
              <div v-else-if="row.targetType === 'QA'" class="preview-qa">
                <i class="el-icon-chat-dot-square"></i>
                <span class="preview-title">{{ truncateText(row.qa?.question, 30) }}</span>
                <el-tag size="mini" :type="row.qa?.isAnonymous ? 'warning' : ''">
                  {{ row.qa?.isAnonymous ? '匿名' : '实名' }}
                </el-tag>
              </div>
              <!-- 作业提交 -->
              <div v-else-if="row.targetType === 'SUBMISSION'" class="preview-submission">
                <i class="el-icon-edit"></i>
                <span class="preview-title">{{ row.submission?.assignmentTitle || '作业提交' }}</span>
                <el-tag size="mini" :type="row.submission?.isLate ? 'danger' : 'success'">
                  {{ row.submission?.isLate ? '迟交' : '按时' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 提交者 -->
        <el-table-column label="提交者" width="120" align="center">
          <template #default="{ row }">
            <div class="submitter-info">
              <span>{{ row.submitter?.username || '未知用户' }}</span>
              <el-tag size="mini" type="info">{{ getRoleText(row.submitter?.role) }}</el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 提交时间 -->
        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime || row.createTime || row.askTime) }}
          </template>
        </el-table-column>

        <!-- 审核状态 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.result)" size="mini">
              {{ getStatusText(row.result) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 拒绝原因 -->
        <el-table-column label="拒绝原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.result === 'REJECT'" class="reject-reason">{{ row.reason || '-' }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- 审核人 -->
        <el-table-column label="审核人" width="100" align="center">
          <template #default="{ row }">
            {{ row.auditor?.username || '-' }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <!-- 待审核状态显示审核按钮 -->
            <template v-if="row.result === 'PENDING'">
              <el-button size="mini" type="success" @click="handleApprove(row)">
                通过
              </el-button>
              <el-button size="mini" type="danger" @click="openRejectDialog(row)">
                拒绝
              </el-button>
            </template>
            <!-- 已审核状态显示详情按钮 -->
            <template v-else>
              <el-button size="mini" type="text" @click="viewDetail(row)">
                详情
              </el-button>
              <el-button
                  size="mini"
                  type="text"
                  v-if="row.result === 'REJECT'"
                  @click="handleReaudit(row)"
              >
                重审
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
            :current-page="page"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="size"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
        />
      </div>
    </el-card>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
        title="拒绝审核"
        :visible.sync="rejectDialogVisible"
        width="450px"
        :close-on-click-modal="false"
    >
      <el-alert
          :title="`确定要拒绝${selectedTarget?.targetType ? getTypeText(selectedTarget.targetType) : '该内容'}吗？`"
          type="warning"
          :closable="false"
          show-icon
          class="reject-tip"
      >
        <template #default>
          <p>拒绝后用户将收到通知，并可重新提交</p>
        </template>
      </el-alert>

      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
              v-model="rejectForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入拒绝原因，用户将看到此内容"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="rejectDialogVisible = false">取 消</el-button>
        <el-button type="danger" :loading="rejecting" @click="submitReject">
          {{ rejecting ? '处理中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量拒绝弹窗 -->
    <el-dialog
        title="批量拒绝"
        :visible.sync="batchRejectDialogVisible"
        width="450px"
    >
      <el-alert
          :title="`确定要拒绝选中的 ${selectedIds.length} 项内容吗？`"
          type="warning"
          :closable="false"
          show-icon
      >
        <template #default>
          <p>批量拒绝将使用相同的拒绝原因</p>
        </template>
      </el-alert>

      <el-form :model="batchRejectForm" label-width="100px">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
              v-model="batchRejectForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入拒绝原因"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="batchRejectDialogVisible = false">取 消</el-button>
        <el-button type="danger" :loading="batchRejecting" @click="submitBatchReject">
          {{ batchRejecting ? '处理中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 内容详情弹窗 -->
    <el-dialog
        title="内容详情"
        :visible.sync="detailDialogVisible"
        width="600px"
        :close-on-click-modal="false"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="内容类型">
          <el-tag :type="getTypeTagType(detailData.targetType)">
            {{ getTypeText(detailData.targetType) }}
          </el-tag>
        </el-descriptions-item>

        <!-- 资源详情 -->
        <template v-if="detailData.targetType === 'RESOURCE'">
          <el-descriptions-item label="资源标题">{{ detailData.resource?.title }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ detailData.resource?.type }}</el-descriptions-item>
          <el-descriptions-item label="文件链接">
            <el-link :href="detailData.resource?.fileUrl" target="_blank" type="primary">
              查看文件
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="所属课程">{{ detailData.resource?.courseName }}</el-descriptions-item>
        </template>

        <!-- 问答详情 -->
        <template v-else-if="detailData.targetType === 'QA'">
          <el-descriptions-item label="问题内容">{{ detailData.qa?.question }}</el-descriptions-item>
          <el-descriptions-item label="回答内容">{{ detailData.qa?.answer || '暂无回答' }}</el-descriptions-item>
          <el-descriptions-item label="是否匿名">
            <el-tag :type="detailData.qa?.isAnonymous ? 'warning' : 'success'">
              {{ detailData.qa?.isAnonymous ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属课程">{{ detailData.qa?.courseName }}</el-descriptions-item>
        </template>

        <!-- 作业详情 -->
        <template v-else-if="detailData.targetType === 'SUBMISSION'">
          <el-descriptions-item label="作业标题">{{ detailData.submission?.assignmentTitle }}</el-descriptions-item>
          <el-descriptions-item label="提交类型">{{ detailData.submission?.contentType }}</el-descriptions-item>
          <el-descriptions-item label="提交内容">
            <el-link v-if="detailData.submission?.filePath" :href="detailData.submission.filePath" target="_blank">
              下载文件
            </el-link>
            <span v-else-if="detailData.submission?.textContent">{{ truncateText(detailData.submission.textContent, 50) }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="是否迟交">
            <el-tag :type="detailData.submission?.isLate ? 'danger' : 'success'">
              {{ detailData.submission?.isLate ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
        </template>

        <el-descriptions-item label="提交时间">{{ formatDateTime(detailData.submitTime || detailData.createTime || detailData.askTime) }}</el-descriptions-item>
        <el-descriptions-item label="提交者">{{ detailData.submitter?.username }} ({{ getRoleText(detailData.submitter?.role) }})</el-descriptions-item>

        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusTagType(detailData.result)">
            {{ getStatusText(detailData.result) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拒绝原因" v-if="detailData.result === 'REJECT'">
          {{ detailData.reason || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detailData.auditor?.username }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ formatDateTime(detailData.auditTime) }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关 闭</el-button>
        <el-button
            v-if="detailData.result === 'PENDING'"
            type="success"
            @click="handleApprove(detailData)"
        >
          通过审核
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ContentAudit',

  data() {
    return {
      // 统计卡片
      stats: {
        pending: 0,
        passed: 0,
        rejected: 0
      },

      // 搜索条件
      searchForm: {
        targetType: '',
        status: 'PENDING',  // 默认只显示待审核
        keyword: ''
      },

      // 表格数据
      loading: false,
      auditList: [],
      page: 1,
      size: 10,
      total: 0,

      // 多选相关
      selectAll: false,
      selectedIds: [],

      // 拒绝原因弹窗
      rejectDialogVisible: false,
      rejecting: false,
      selectedTarget: null,
      rejectForm: {
        reason: ''
      },

      // 批量拒绝弹窗
      batchRejectDialogVisible: false,
      batchRejecting: false,
      batchRejectForm: {
        reason: ''
      },

      // 详情弹窗
      detailDialogVisible: false,
      detailData: {}
    }
  },

  created() {
    this.fetchStats()
    this.fetchAuditList()
  },

  methods: {
    // ========== 数据加载 ==========

    // 获取审核统计
    async fetchStats() {
      try {
        const resp = await axios.get('/api/audit/stats')
        if (resp.data.code === 1) {
          this.stats = resp.data.data
        }
      } catch (e) {
        console.error('Fetch stats error:', e)
      }
    },

    // 获取审核列表
    async fetchAuditList() {
      this.loading = true
      try {
        const resp = await axios.get('/api/audit/list', {
          params: {
            targetType: this.searchForm.targetType,
            status: this.searchForm.status,
            keyword: this.searchForm.keyword,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.auditList = resp.data.data.records || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch audit list error:', e)
        this.$message.error('加载审核列表失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索
    handleSearch() {
      this.page = 1
      this.fetchAuditList()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = {
        targetType: '',
        status: 'PENDING',
        keyword: ''
      }
      this.handleSearch()
    },

    // 分页切换
    handlePageChange(newPage) {
      this.page = newPage
      this.fetchAuditList()
    },

    // 每页数量切换
    handleSizeChange(newSize) {
      this.size = newSize
      this.page = 1
      this.fetchAuditList()
    },

    // ========== 表格操作 ==========

    // 多选变化
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.auditId)
      this.selectAll = selection.length === this.auditList.length && this.auditList.length > 0
    },

    // 全选/取消全选
    handleSelectAll(checked) {
      if (checked) {
        this.$refs.auditTable.toggleAllSelection()
      } else {
        this.$refs.auditTable.clearSelection()
      }
    },

    // ========== 审核操作 ==========

    // 通过审核（单个）
    async handleApprove(row) {
      this.$confirm('确定要通过此项审核吗？', '提示', {
        type: 'success',
        confirmButtonText: '通过',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.post(`/api/audit/${row.auditId}/approve`)
          this.$message.success('审核通过')
          this.fetchStats()
          this.fetchAuditList()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '操作失败')
        }
      })
    },

    // 打开拒绝弹窗（单个）
    openRejectDialog(row) {
      this.selectedTarget = row
      this.rejectForm.reason = ''
      this.rejectDialogVisible = true
    },

    // 提交拒绝（单个）
    async submitReject() {
      if (!this.rejectForm.reason.trim()) {
        this.$message.warning('请输入拒绝原因')
        return
      }

      this.rejecting = true
      try {
        await axios.post(`/api/audit/${this.selectedTarget.auditId}/reject`, {
          reason: this.rejectForm.reason
        })
        this.$message.success('已拒绝')
        this.rejectDialogVisible = false
        this.fetchStats()
        this.fetchAuditList()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.rejecting = false
      }
    },

    // 打开批量拒绝弹窗
    openBatchRejectDialog() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要拒绝的内容')
        return
      }
      this.batchRejectForm.reason = ''
      this.batchRejectDialogVisible = true
    },

    // 批量通过
    async handleBatchApprove() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要审核的内容')
        return
      }

      this.$confirm(`确定要通过选中的 ${this.selectedIds.length} 项内容吗？`, '提示', {
        type: 'success'
      }).then(async () => {
        try {
          await axios.post('/api/audit/batch/approve', {
            auditIds: this.selectedIds
          })
          this.$message.success('批量通过成功')
          this.fetchStats()
          this.fetchAuditList()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '操作失败')
        }
      })
    },

    // 提交批量拒绝
    async submitBatchReject() {
      if (!this.batchRejectForm.reason.trim()) {
        this.$message.warning('请输入拒绝原因')
        return
      }

      this.batchRejecting = true
      try {
        await axios.post('/api/audit/batch/reject', {
          auditIds: this.selectedIds,
          reason: this.batchRejectForm.reason
        })
        this.$message.success('批量拒绝成功')
        this.batchRejectDialogVisible = false
        await this.fetchStats()
        await this.fetchAuditList()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.batchRejecting = false
      }
    },

    // 重审（将状态重置为待审核）
    async handleReaudit(row) {
      this.$confirm('确定要重新审核此项内容吗？', '提示', {
        type: 'warning'
      }).then(async () => {
        try {
          await axios.post(`/api/audit/${row.auditId}/reaudit`)
          this.$message.success('已重置为待审核')
          await this.fetchStats()
          await this.fetchAuditList()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '操作失败')
        }
      })
    },

    // 查看详情
    async viewDetail(row) {
      this.detailDialogVisible = true
      // 如果需要加载完整详情，可以调用接口
      // const resp = await axios.get(`/api/admin/audit/${row.auditId}/detail`)
      // this.detailData = resp.data.data
      this.detailData = { ...row }  // 临时使用列表数据
    },

    // ========== 工具方法 ==========

    // 类型中文显示
    getTypeText(type) {
      const map = {
        'RESOURCE': '课程资源',
        'QA': '问答互动',
        'SUBMISSION': '作业提交'
      }
      return map[type] || type
    },

    // 类型标签颜色
    getTypeTagType(type) {
      const map = {
        'RESOURCE': 'primary',
        'QA': 'success',
        'SUBMISSION': 'warning'
      }
      return map[type] || 'info'
    },

    // 状态中文显示
    getStatusText(status) {
      const map = {
        'PENDING': '待审核',
        'PASS': '已通过',
        'REJECT': '已拒绝'
      }
      return map[status] || status
    },

    // 状态标签颜色
    getStatusTagType(status) {
      const map = {
        'PENDING': 'warning',
        'PASS': 'success',
        'REJECT': 'danger'
      }
      return map[status] || 'info'
    },

    // 角色中文显示
    getRoleText(role) {
      const map = {
        'ADMIN': '管理员',
        'TEACHER': '教师',
        'STUDENT': '学生'
      }
      return map[role] || role
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      // 后端返回格式: "2026-04-09 22:41:18"
      return dateTime
    },

    // 截断文本
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.content-audit {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 15px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  min-width: 120px;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
  margin-right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.pending {
  background: #e6a23c20;
  color: #e6a23c;
}

.stat-icon.passed {
  background: #67c23a20;
  color: #67c23a;
}

.stat-icon.rejected {
  background: #f56c6c20;
  color: #f56c6c;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* ========== 搜索区 ========== */
.filter-card {
  margin-bottom: 20px;
}

/* ========== 表格区 ========== */
.table-card {
  margin-bottom: 20px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px 0;
}

.selected-count {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
}

/* 内容预览样式 */
.content-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-resource,
.preview-qa,
.preview-submission {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-title {
  font-size: 13px;
  color: #606266;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 提交者信息 */
.submitter-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* 拒绝原因 */
.reject-reason {
  color: #f56c6c;
  font-size: 13px;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ========== 弹窗样式 ========== */
.reject-tip,
.batch-reject-tip {
  margin-bottom: 15px;
}

.reject-tip p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

/* 详情弹窗 */
.el-descriptions {
  margin-top: 10px;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-cards {
    width: 100%;
    justify-content: space-between;
  }

  .stat-card {
    flex: 1;
    min-width: auto;
    justify-content: center;
  }

  .table-toolbar {
    flex-wrap: wrap;
  }
}
</style>