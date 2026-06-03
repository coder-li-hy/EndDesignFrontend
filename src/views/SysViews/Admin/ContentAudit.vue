<template>
  <div class="content-audit">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 + 统计卡片 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-s-check"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">内容审核</h2>
          <p class="page-subtitle">管理系统内容，保障平台质量</p>
        </div>
      </div>

      <!-- 统计卡片组 -->
      <div class="stats-cards">
        <el-card
            shadow="hover"
            class="stat-card"
            :class="{ 'stat-hover': stats.pending > 0 }"
            @click="searchForm.status = 'PENDING'; handleSearch()"
        >
          <div class="stat-icon-wrapper pending">
            <i class="stat-icon el-icon-time"></i>
            <span class="stat-glow"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value" :class="{ 'count-animate': stats.pending > 0 }">
              {{ stats.pending }}
            </div>
            <div class="stat-label">待审核</div>
          </div>
          <div class="stat-trend" v-if="stats.pending > 0">
            <i class="el-icon-top-right"></i> 点击处理
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card passed" @click="searchForm.status = 'PASS'; handleSearch()">
          <div class="stat-icon-wrapper passed">
            <i class="stat-icon el-icon-circle-check"></i>
            <span class="stat-glow"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.passed }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card rejected" @click="searchForm.status = 'REJECT'; handleSearch()">
          <div class="stat-icon-wrapper rejected">
            <i class="stat-icon el-icon-circle-close"></i>
            <span class="stat-glow"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-label">已拒绝</div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-header">
        <i class="el-icon-search filter-icon"></i>
        <span class="filter-title">筛选条件</span>
      </div>
      <el-form :inline="true" :model="searchForm" size="small" class="filter-form">
        <el-form-item label="内容类型">
          <el-select
              v-model="searchForm.targetType"
              placeholder="全部类型"
              clearable
              @change="handleSearch"
              class="filter-select"
          >
            <el-option label="📚 课程资源" value="RESOURCE" />
            <el-option label="💬 问答互动" value="QA" />
            <el-option label="📝 作业提交" value="SUBMISSION" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
              v-model="searchForm.status"
              placeholder="全部状态"
              clearable
              @change="handleSearch"
              class="filter-select"
          >
            <el-option label="⏳ 待审核" value="PENDING" />
            <el-option label="✅ 已通过" value="PASS" />
            <el-option label="❌ 已拒绝" value="REJECT" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
              v-model="searchForm.keyword"
              placeholder="搜索标题/内容/用户名..."
              clearable
              @keyup.enter.native="handleSearch"
              class="filter-input"
              prefix-icon="el-icon-search"
          />
        </el-form-item>
        <el-form-item class="filter-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleSearch" class="btn-search">
            搜索
          </el-button>
          <el-button icon="el-icon-refresh" @click="handleReset" class="btn-reset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核列表 -->
    <el-card class="table-card" shadow="never">
      <!-- 批量操作工具栏  只有在文件-->
      <div class="table-toolbar" v-if="auditList.length > 0 && searchForm.status === 'PENDING'">
        <div class="toolbar-left">
          <el-checkbox v-model="selectAll" @change="handleSelectAll" class="select-all">
            <span class="checkbox-label">全选</span>
          </el-checkbox>
          <span class="selected-count" v-if="selectedIds.length">
            <i class="el-icon-select"></i>
            已选择 <strong>{{ selectedIds.length }}</strong> 项
          </span>
        </div>
        <div class="toolbar-right">
          <el-button
              size="small"
              type="success"
              icon="el-icon-check"
              :disabled="!selectedIds.length"
              @click="handleBatchApprove"
              class="btn-batch-approve"
          >
            批量通过
          </el-button>
          <el-button
              size="small"
              type="danger"
              icon="el-icon-close"
              :disabled="!selectedIds.length"
              @click="openBatchRejectDialog"
              class="btn-batch-reject"
          >
            批量拒绝
          </el-button>
        </div>
      </div>

      <el-table
          ref="auditTable"
          :data="auditList"
          v-loading="loading"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 600 }"
          :row-style="{ transition: 'all 0.2s' }"
          @row-mouse-enter="handleRowHover"
          @row-mouse-leave="handleRowLeave"
          class="audit-table"
      >
        <el-table-column type="selection" width="48" align="center" />

        <!-- 内容类型 -->
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getTypeTagType(row.targetType)"
                size="mini"
                effect="light"
                class="type-tag"
            >
              <i :class="getTypeIcon(row.targetType)"></i>
              {{ getTypeText(row.targetType) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 内容预览 -->
        <el-table-column label="内容预览" min-width="220">
          <template #default="{ row }">
            <div class="content-preview">
              <!-- 课程资源 -->
              <div v-if="row.targetType === 'RESOURCE'" class="preview-item resource">
                <div class="preview-icon">
                  <i class="el-icon-document"></i>
                </div>
                <div class="preview-main">
                  <span class="preview-title">{{ row.resource?.title || '未知资源' }}</span>
                  <el-tag size="mini" effect="plain">{{ row.resource?.type || '-' }}</el-tag>
                </div>
              </div>
              <!-- 问答互动 -->
              <div v-else-if="row.targetType === 'QA'" class="preview-item qa">
                <div class="preview-icon">
                  <i class="el-icon-chat-dot-square"></i>
                </div>
                <div class="preview-main">
                  <span class="preview-title">{{ truncateText(row.qa?.question, 35) }}</span>
                  <el-tag
                      size="mini"
                      effect="plain"
                      :type="row.qa?.isAnonymous ? 'warning' : 'success'"
                  >
                    {{ row.qa?.isAnonymous ? '👤 匿名' : '👤 实名' }}
                  </el-tag>
                </div>
              </div>
              <!-- 作业提交 -->
              <div v-else-if="row.targetType === 'SUBMISSION'" class="preview-item submission">
                <div class="preview-icon">
                  <i class="el-icon-edit"></i>
                </div>
                <div class="preview-main">
                  <span class="preview-title">{{ row.submission?.assignmentTitle || '作业提交' }}</span>
                  <el-tag
                      size="mini"
                      effect="plain"
                      :type="row.submission?.isLate ? 'danger' : 'success'"
                  >
                    {{ row.submission?.isLate ? '⏰ 迟交' : '✅ 按时' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 提交者 -->
        <el-table-column label="提交者" width="130" align="center">
          <template #default="{ row }">
            <div class="submitter-cell">
              <div class="avatar-placeholder">
                {{ getAvatarInitials(row.submitter?.username) }}
              </div>
              <div class="submitter-info">
                <span class="username">{{ row.submitter?.username || '未知用户' }}</span>
                <el-tag size="mini" effect="plain" class="role-tag">
                  {{ getRoleText(row.submitter?.role) }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 提交时间 -->
        <el-table-column label="提交时间" width="150" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <i class="el-icon-time time-icon"></i>
              <span>{{ formatDateTime(row.submitTime || row.createTime || row.askTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 审核状态 -->
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getStatusTagType(row.result)"
                size="mini"
                effect="dark"
                class="status-tag"
            >
              {{ getStatusText(row.result) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 拒绝原因 -->
        <el-table-column label="拒绝原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.result === 'REJECT'" class="reject-reason">
              <i class="el-icon-warning-outline"></i>
              {{ row.reason || '未填写原因' }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>

        <!-- 审核人 -->
        <el-table-column label="审核人" width="110" align="center">
          <template #default="{ row }">
            <div class="auditor-cell">
              <span>{{ row.auditor?.username || '-' }}</span>
              <span v-if="row.auditor" class="audit-time">
                {{ formatTimeOnly(row.auditTime) }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- 待审核状态 -->
              <template v-if="row.result === 'PENDING'">
                <el-button
                    size="mini"
                    type="text"
                    @click="handleApprove(row)"
                    class="action-btn approve"
                >
                  <i class="el-icon-check"></i> 通过
                </el-button>
                <el-button
                    size="mini"
                    type="text"
                    @click="openRejectDialog(row)"
                    class="action-btn reject"
                >
                  <i class="el-icon-close"></i> 拒绝
                </el-button>
                <el-button
                    size="mini"
                    type="text"
                    @click="previewDetail(row)"
                    class="action-btn detail"
                >
                  <i class="el-icon-view"></i> 详情
                </el-button>
              </template>
              <!-- 已审核状态 -->
              <template v-else>
                <el-button
                    size="mini"
                    type="text"
                    @click="viewDetail(row)"
                    class="action-btn detail"
                >
                  <i class="el-icon-view"></i> 详情
                </el-button>
                <el-button
                    size="mini"
                    type="text"
                    v-if="row.result === 'REJECT'|| row.result === 'PASS'"
                    @click="handleReaudit(row)"
                    class="action-btn reaudit"
                >
                  <i class="el-icon-refresh"></i> 重审
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!loading && auditList.length === 0" class="empty-state">
        <i class="el-icon-document-checked empty-icon"></i>
        <p class="empty-text">暂无符合条件的审核记录</p>
        <el-button size="small" @click="handleReset" type="text">
          重置筛选条件
        </el-button>
      </div>

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
            class="audit-pagination"
        />
      </div>
    </el-card>

    <!-- 拒绝原因弹窗 -->
    <el-dialog
        title="❌ 拒绝审核"
        :visible.sync="rejectDialogVisible"
        width="480px"
        :close-on-click-modal="false"
        class="reject-dialog"
        custom-class="modal-custom"
    >
      <div class="modal-header">
        <el-alert
            :title="`确定要拒绝${selectedTarget?.targetType ? getTypeText(selectedTarget.targetType) : '该内容'}吗？`"
            type="warning"
            :closable="false"
            show-icon
            class="reject-tip"
        >
          <template #default>
            <p>拒绝后用户将收到系统通知，并可修改后重新提交</p>
          </template>
        </el-alert>
      </div>

      <el-form :model="rejectForm" label-width="90px" class="modal-form">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
              v-model="rejectForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入具体拒绝原因，用户将看到此内容..."
              maxlength="200"
              show-word-limit
              class="reason-input"
          />
        </el-form-item>

        <!-- 常用原因快捷选择 -->
        <div class="quick-reasons">
          <span class="quick-label">常用原因：</span>
          <el-tag
              v-for="reason in quickRejectReasons"
              :key="reason"
              size="mini"
              effect="plain"
              class="quick-reason-tag"
              @click="rejectForm.reason = reason"
          >
            {{ reason }}
          </el-tag>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectDialogVisible = false" :disabled="rejecting">
            取 消
          </el-button>
          <el-button
              type="danger"
              :loading="rejecting"
              @click="submitReject"
              class="btn-confirm-reject"
          >
            {{ rejecting ? '处理中...' : '确 定 拒 绝' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量拒绝弹窗 -->
    <el-dialog
        title="❌ 批量拒绝"
        :visible.sync="batchRejectDialogVisible"
        width="480px"
        class="modal-custom"
    >
      <el-alert
          :title="`确定要拒绝选中的 ${selectedIds.length} 项内容吗？`"
          type="warning"
          :closable="false"
          show-icon
          class="batch-tip"
      >
        <template #default>
          <p>批量拒绝将使用相同的拒绝原因，操作不可撤销</p>
        </template>
      </el-alert>

      <el-form :model="batchRejectForm" label-width="90px" class="modal-form">
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
              v-model="batchRejectForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请输入拒绝原因..."
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchRejectDialogVisible = false" :disabled="batchRejecting">
            取 消
          </el-button>
          <el-button
              type="danger"
              :loading="batchRejecting"
              @click="submitBatchReject"
          >
            {{ batchRejecting ? '处理中...' : '确 定 拒 绝' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 内容详情弹窗（合并优化） -->
    <el-dialog
        :title="`${previewDetailDialogVisible ? '🔍 ' : '📋 '}内容详情`"
        :visible.sync="detailDialogVisible"
        width="680px"
        :close-on-click-modal="false"
        class="detail-dialog"
        custom-class="modal-custom"
    >
      <el-descriptions :column="1" border class="detail-descriptions">
        <el-descriptions-item label="内容类型">
          <el-tag :type="getTypeTagType(detailData.targetType)" effect="light">
            <i :class="getTypeIcon(detailData.targetType)"></i>
            {{ getTypeText(detailData.targetType) }}
          </el-tag>
        </el-descriptions-item>

        <!-- 资源详情 -->
        <template v-if="detailData.targetType === 'RESOURCE'">
          <el-descriptions-item label="资源标题">{{ detailData.resource?.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">
            <el-tag size="mini" effect="plain">{{ detailData.resource?.type || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="文件链接">
            <el-link
                v-if="detailData.resource?.fileUrl"
                :href="detailData.resource.fileUrl"
                target="_blank"
                type="primary"
                class="detail-link"
            >
              <i class="el-icon-download"></i> 查看文件
            </el-link>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="所属课程">{{ detailData.resource?.courseName || '-' }}</el-descriptions-item>
        </template>

        <!-- 问答详情 -->
        <template v-else-if="detailData.targetType === 'QA'">
          <el-descriptions-item label="问题内容">
            <div class="qa-content">{{ detailData.qa?.question || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="回答内容">
            <div class="qa-content">{{ detailData.qa?.answer || '暂无回答' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="是否匿名">
            <el-tag :type="detailData.qa?.isAnonymous ? 'warning' : 'success'" size="mini">
              {{ detailData.qa?.isAnonymous ? '👤 匿名提问' : '👤 实名提问' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属课程">{{ detailData.qa?.courseName || '-' }}</el-descriptions-item>
        </template>

        <!-- 作业详情 -->
        <template v-else-if="detailData.targetType === 'SUBMISSION'">
          <el-descriptions-item label="作业标题">{{ detailData.submission?.assignmentTitle || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交类型">
            <el-tag size="mini" effect="plain">{{ detailData.submission?.contentType || '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交内容">
            <el-link
                v-if="detailData.submission?.filePath"
                :href="detailData.submission.filePath"
                target="_blank"
                type="primary"
                class="detail-link"
            >
              <i class="el-icon-download"></i> 下载文件
            </el-link>
            <span v-else-if="detailData.submission?.textContent" class="submission-text">
              {{ truncateText(detailData.submission.textContent, 80) }}
            </span>
            <span v-else class="text-muted">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="是否迟交">
            <el-tag :type="detailData.submission?.isLate ? 'danger' : 'success'" size="mini">
              {{ detailData.submission?.isLate ? '⏰ 迟交' : '✅ 按时提交' }}
            </el-tag>
          </el-descriptions-item>
        </template>

        <el-descriptions-item label="提交时间">
          <i class="el-icon-time"></i>
          {{ formatDateTime(detailData.submitTime || detailData.createTime || detailData.askTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="提交者">
          <span class="submitter-name">{{ detailData.submitter?.username }}</span>
          <el-tag size="mini" effect="plain">{{ getRoleText(detailData.submitter?.role) }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="审核状态">
          <el-tag :type="getStatusTagType(detailData.result)" effect="dark">
            {{ getStatusText(detailData.result) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="拒绝原因" v-if="detailData.result === 'REJECT'">
          <span class="reject-reason-detail">{{ detailData.reason || '未填写' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="detailData.auditor?.username">
          {{ detailData.auditor.username }}
          <span class="audit-time-detail" v-if="detailData.auditTime">
            · {{ formatDateTime(detailData.auditTime) }}
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeDetailDialog">关 闭</el-button>
          <el-button
              v-if="detailData.result === 'PENDING'"
              type="success"
              @click="handleApprove(detailData); closeDetailDialog()"
              class="btn-approve"
          >
            <i class="el-icon-check"></i> 通过审核
          </el-button>
          <el-button
              v-if="detailData.result === 'PENDING' && previewDetailDialogVisible"
              type="danger"
              @click="openRejectDialog(detailData); closeDetailDialog()"
              class="btn-reject"
          >
            <i class="el-icon-close"></i> 拒绝审核
          </el-button>
        </div>
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
      stats: { pending: 0, passed: 0, rejected: 0 },

      // 搜索条件
      searchForm: { targetType: '', status: 'PENDING', keyword: '' },

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
      rejectForm: { reason: '' },
      quickRejectReasons: [
        '内容不符合规范',
        '包含敏感信息',
        '与课程无关',
        '格式错误',
        '重复提交'
      ],

      // 批量拒绝弹窗
      batchRejectDialogVisible: false,
      batchRejecting: false,
      batchRejectForm: { reason: '' },

      // 详情弹窗
      detailDialogVisible: false,
      previewDetailDialogVisible: false,
      detailData: {}
    }
  },

  created() {
    this.fetchStats()
    this.fetchAuditList()
  },

  methods: {
    // 统一控制详情弹窗关闭
    handleDetailDialogClose() {
      this.detailDialogVisible = false
      this.previewDetailDialogVisible = false
    },

    // 打开详情（统一入口）
    openDetailDialog(row, isPreview = false) {
      this.detailData = { ...row }
      this.detailDialogVisible = true
      this.previewDetailDialogVisible = isPreview
    },

    // 查看详情的调用
    async viewDetail(row) {
      this.openDetailDialog(row, false)
    },

    // 预览详情的调用
    async previewDetail(row) {
      this.openDetailDialog(row, true)
    },

    // 关闭弹窗的调用（替换原有的 closeDetailDialog）
    closeDetailDialog() {
      this.handleDetailDialogClose()
    },
    // ========== 数据加载 ==========
    async fetchStats() {
      try {
        const resp = await axios.get('/api/audit/stats')
        if (resp.data.code === 1) this.stats = resp.data.data
      } catch (e) { console.error('Fetch stats error:', e) }
    },

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

    handleSearch() { this.page = 1; this.fetchAuditList() },
    handleReset() {
      this.searchForm = { targetType: '', status: 'PENDING', keyword: '' }
      this.handleSearch()
    },
    handlePageChange(newPage) { this.page = newPage; this.fetchAuditList() },
    handleSizeChange(newSize) { this.size = newSize; this.page = 1; this.fetchAuditList() },

    // ========== 表格操作 ==========
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.auditId)
      this.selectAll = selection.length === this.auditList.length && this.auditList.length > 0
    },
    handleSelectAll(checked) {
      if (checked) this.$refs.auditTable.toggleAllSelection()
      else this.$refs.auditTable.clearSelection()
    },
    handleRowHover(row, column, event) {
      event.currentTarget.style.background = 'rgba(79, 70, 229, 0.04)'
    },
    handleRowLeave(row, column, event) {
      event.currentTarget.style.background = ''
    },

    // ========== 审核操作 ==========
    async handleApprove(row) {
      this.$confirm('确定要通过此项审核吗？', '提示', {
        type: 'success', confirmButtonText: '通过', cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.post(`/api/audit/${row.auditId}/approve`)
          this.$message.success('✅ 审核通过')
          this.fetchStats(); this.fetchAuditList()
        } catch (e) { this.$message.error(e.response?.data?.msg || '操作失败') }
      })
    },

    openRejectDialog(row) {
      this.selectedTarget = row
      this.rejectForm.reason = ''
      this.rejectDialogVisible = true
    },

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
        this.fetchStats(); this.fetchAuditList()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally { this.rejecting = false }
    },

    openBatchRejectDialog() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要拒绝的内容')
        return
      }
      this.batchRejectForm.reason = ''
      this.batchRejectDialogVisible = true
    },

    async handleBatchApprove() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要审核的内容')
        return
      }
      this.$confirm(`确定要通过选中的 ${this.selectedIds.length} 项内容吗？`, '提示', { type: 'success' })
          .then(async () => {
            try {
              await axios.post('/api/audit/batch/approve', { auditIds: this.selectedIds })
              this.$message.success('✅ 批量通过成功')
              this.fetchStats(); this.fetchAuditList()
            } catch (e) { this.$message.error(e.response?.data?.msg || '操作失败') }
          })
    },

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
        this.$message.success('✅ 批量拒绝成功')
        this.batchRejectDialogVisible = false
        await this.fetchStats(); await this.fetchAuditList()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally { this.batchRejecting = false }
    },

    async handleReaudit(row) {
      this.$confirm('确定要重新审核此项内容吗？', '提示', { type: 'warning' })
          .then(async () => {
            try {
              await axios.post(`/api/audit/${row.auditId}/reaudit`)
              this.$message.success('🔄 已重置为待审核')
              await this.fetchStats(); await this.fetchAuditList()
            } catch (e) { this.$message.error(e.response?.data?.msg || '操作失败') }
          })
    },

    // async viewDetail(row) {
    //   this.detailData = { ...row }
    //   this.detailDialogVisible = true
    //   this.previewDetailDialogVisible = false
    // },
    //
    // async previewDetail(row) {
    //   this.detailData = { ...row }
    //   this.previewDetailDialogVisible = true
    //   this.detailDialogVisible = false
    // },
    //
    // closeDetailDialog() {
    //   this.detailDialogVisible = false
    //   this.previewDetailDialogVisible = false
    // },

    // ========== 工具方法 ==========
    getTypeText(type) {
      const map = { 'RESOURCE': '课程资源', 'QA': '问答互动', 'SUBMISSION': '作业提交' }
      return map[type] || type
    },
    getTypeIcon(type) {
      const map = { 'RESOURCE': 'el-icon-document', 'QA': 'el-icon-chat-dot-square', 'SUBMISSION': 'el-icon-edit' }
      return map[type] || 'el-icon-info'
    },
    getTypeTagType(type) {
      const map = { 'RESOURCE': 'primary', 'QA': 'success', 'SUBMISSION': 'warning' }
      return map[type] || 'info'
    },
    getStatusText(status) {
      const map = { 'PENDING': '待审核', 'PASS': '已通过', 'REJECT': '已拒绝' }
      return map[status] || status
    },
    getStatusTagType(status) {
      const map = { 'PENDING': 'warning', 'PASS': 'success', 'REJECT': 'danger' }
      return map[status] || 'info'
    },
    getRoleText(role) {
      const map = { 'ADMIN': '管理员', 'TEACHER': '教师', 'STUDENT': '学生' }
      return map[role] || role
    },
    getAvatarInitials(username) {
      if (!username) return '?'
      const names = username.split('')
      return names[0]?.toUpperCase() || '?'
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime.replace('T', ' ').substring(0, 16)
    },
    formatTimeOnly(dateTime) {
      if (!dateTime) return ''
      return dateTime.replace('T', ' ').substring(11, 16)
    },
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量定义 ========== */
.content-audit {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: rgba(79, 70, 229, 0.1);
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --bg-page: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  --bg-card: #ffffff;
  --bg-hover: #f8fafc;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  padding: 24px;
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
}

.page-bg-decoration {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 200px;
  background: radial-gradient(ellipse at top, rgba(79, 70, 229, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 页面标题 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.title-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
  flex-shrink: 0;
}

.title-icon i {
  font-size: 22px; color: white;
}

.title-content {
  display: flex; flex-direction: column; gap: 4px;
}

.page-title {
  font-size: 22px; font-weight: 700;
  color: var(--text-primary); margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 13px; color: var(--text-secondary);
  margin: 0; font-weight: 500;
}

/* ========== 统计卡片 ========== */
.stats-cards {
  display: flex; gap: 12px; flex-wrap: wrap;
}

.stat-card {
  display: flex; align-items: center;
  padding: 14px 18px;
  min-width: 140px;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.stat-card.passed:hover { border-color: var(--success); }
.stat-card.rejected:hover { border-color: var(--danger); }

.stat-icon-wrapper {
  position: relative;
  width: 42px; height: 42px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.stat-icon-wrapper.pending { background: rgba(245, 158, 11, 0.12); }
.stat-icon-wrapper.passed { background: rgba(34, 197, 94, 0.12); }
.stat-icon-wrapper.rejected { background: rgba(239, 68, 68, 0.12); }

.stat-icon {
  font-size: 20px;
  z-index: 1;
}

.stat-icon-wrapper.pending .stat-icon { color: var(--warning); }
.stat-icon-wrapper.passed .stat-icon { color: var(--success); }
.stat-icon-wrapper.rejected .stat-icon { color: var(--danger); }

.stat-glow {
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  background: inherit;
  filter: blur(10px);
  opacity: 0.5;
  z-index: 0;
}

.stat-info {
  display: flex; flex-direction: column;
}

.stat-value {
  font-size: 22px; font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-value.count-animate {
  animation: countPop 0.3s ease-out;
}

@keyframes countPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.stat-label {
  font-size: 12px; color: var(--text-muted);
  margin-top: 4px; font-weight: 500;
}

.stat-trend {
  position: absolute;
  bottom: 8px; right: 12px;
  font-size: 11px; color: var(--primary);
  font-weight: 500; opacity: 0;
  transition: opacity 0.2s;
}

.stat-card:hover .stat-trend { opacity: 1; }

/* ========== 搜索区 ========== */
.filter-card {
  margin-bottom: 20px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  animation: cardEnter 0.4s ease-out 0.1s backwards;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.filter-header {
  display: flex; align-items: center; gap: 8px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-color);
}

.filter-icon {
  font-size: 16px; color: var(--primary);
}

.filter-title {
  font-size: 14px; font-weight: 600;
  color: var(--text-primary);
}

.filter-form {
  padding: 16px 20px 20px;
}

.filter-select { width: 140px; }
.filter-input { width: 220px; }

.filter-select ::v-deep .el-input__inner,
.filter-input ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}

.filter-select ::v-deep .el-input__inner:focus,
.filter-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.filter-actions {
  margin-left: 8px;
  display: flex; gap: 10px;
}

.btn-search {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none; padding: 9px 22px;
  border-radius: 10px; font-weight: 500;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.btn-search:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.btn-reset {
  padding: 9px 20px; border-radius: 10px;
  border: 2px solid var(--border-color);
  font-weight: 500;
}

/* ========== 表格区 ========== */
.table-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  animation: cardEnter 0.4s ease-out 0.2s backwards;
}

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-hover);
  border-radius: 16px 16px 0 0;
}

.toolbar-left, .toolbar-right {
  display: flex; align-items: center; gap: 12px;
}

.select-all ::v-deep .el-checkbox__label {
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
}

.selected-count {
  font-size: 13px; color: var(--text-secondary);
  display: flex; align-items: center; gap: 5px;
}

.selected-count strong {
  color: var(--primary); font-weight: 600;
}

.btn-batch-approve, .btn-batch-reject {
  border-radius: 8px; font-weight: 500; padding: 7px 16px;
}

.btn-batch-approve {
  background: rgba(34, 197, 94, 0.1);
  color: var(--success); border: 1px solid rgba(34, 197, 94, 0.3);
}
.btn-batch-approve:hover:not(:disabled) {
  background: var(--success); color: white;
}

.btn-batch-reject {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3);
}
.btn-batch-reject:hover:not(:disabled) {
  background: var(--danger); color: white;
}

/* 表格样式 */
.audit-table ::v-deep .el-table__row {
  transition: background 0.15s;
}

.audit-table ::v-deep .el-table__row:hover {
  background: rgba(79, 70, 229, 0.04) !important;
}

/* 内容预览 */
.content-preview {
  display: flex; align-items: center;
}

.preview-item {
  display: flex; align-items: center; gap: 10px;
}

.preview-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.preview-item.resource .preview-icon { background: rgba(79, 70, 229, 0.1); color: var(--primary); }
.preview-item.qa .preview-icon { background: rgba(34, 197, 94, 0.1); color: var(--success); }
.preview-item.submission .preview-icon { background: rgba(245, 158, 11, 0.1); color: var(--warning); }

.preview-main {
  display: flex; flex-direction: column; gap: 4px;
  min-width: 0;
}

.preview-title {
  font-size: 13px; color: var(--text-primary);
  font-weight: 500; line-height: 1.4;
  overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; max-width: 180px;
}

/* 提交者单元格 */
.submitter-cell {
  display: flex; align-items: center; gap: 10px;
}

.avatar-placeholder {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
  flex-shrink: 0;
}

.submitter-info {
  display: flex; flex-direction: column; gap: 3px;
}

.username {
  font-size: 13px; color: var(--text-primary);
  font-weight: 500;
}

.role-tag {
  font-size: 11px; padding: 0 6px;
}

/* 时间单元格 */
.time-cell {
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; color: var(--text-secondary);
}

.time-icon { color: var(--text-muted); font-size: 12px; }

/* 状态标签 */
.status-tag {
  font-weight: 500; font-size: 12px;
  padding: 4px 10px; border-radius: 6px;
}

/* 拒绝原因 */
.reject-reason {
  color: var(--danger); font-size: 13px;
  display: flex; align-items: center; gap: 4px;
}

.reject-reason i { font-size: 12px; }

.text-muted { color: var(--text-muted); }

/* 审核人单元格 */
.auditor-cell {
  display: flex; flex-direction: column; gap: 3px;
  font-size: 13px; color: var(--text-primary);
}

.audit-time {
  font-size: 11px; color: var(--text-muted);
}

/* 操作按钮 */
.action-buttons {
  display: flex; justify-content: center; gap: 4px;
}

.action-btn {
  font-size: 12px; padding: 4px 8px;
  border-radius: 6px; transition: all 0.15s;
}

.action-btn.approve { color: var(--success); }
.action-btn.approve:hover { background: rgba(34, 197, 94, 0.1); }

.action-btn.reject { color: var(--danger); }
.action-btn.reject:hover { background: rgba(239, 68, 68, 0.1); }

.action-btn.detail { color: var(--primary); }
.action-btn.detail:hover { background: var(--primary-light); }

.action-btn.reaudit { color: var(--warning); }
.action-btn.reaudit:hover { background: rgba(245, 158, 11, 0.1); }

/* 空状态 */
.empty-state {
  text-align: center; padding: 48px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px; color: var(--text-muted);
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px; margin-bottom: 16px;
}

/* 分页 */
.pagination-wrapper {
  padding: 16px 20px 20px;
  display: flex; justify-content: flex-end;
}

.audit-pagination ::v-deep .el-pagination {
  font-weight: 500;
}

/* ========== 弹窗样式 ========== */
.modal-custom ::v-deep .el-dialog {
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
}

.modal-custom ::v-deep .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
  margin: 0;
}

.modal-custom ::v-deep .el-dialog__title {
  font-size: 16px; font-weight: 600;
  color: var(--text-primary);
}

.modal-custom ::v-deep .el-dialog__body {
  padding: 20px 24px;
}

.modal-custom ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.reject-tip, .batch-tip {
  border-radius: 10px; margin-bottom: 16px;
}

.reject-tip ::v-deep .el-alert__content,
.batch-tip ::v-deep .el-alert__content {
  padding-right: 0;
}

.reject-tip p, .batch-tip p {
  margin: 4px 0 0; font-size: 13px;
  color: var(--text-secondary);
}

.modal-form { margin-top: 8px; }

.reason-input ::v-deep .el-textarea__inner {
  border-radius: 10px; border: 2px solid var(--border-color);
  transition: border-color 0.2s;
}

.reason-input ::v-deep .el-textarea__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* 常用原因标签 */
.quick-reasons {
  display: flex; align-items: center; gap: 8px;
  margin-top: 8px; flex-wrap: wrap;
}

.quick-label {
  font-size: 12px; color: var(--text-muted);
  font-weight: 500;
}

.quick-reason-tag {
  cursor: pointer; font-size: 11px;
  transition: all 0.15s;
}

.quick-reason-tag:hover {
  border-color: var(--primary); color: var(--primary);
  background: var(--primary-light);
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}

.btn-confirm-reject, .btn-approve, .btn-reject {
  padding: 9px 24px; border-radius: 10px;
  font-weight: 500;
}

.btn-confirm-reject {
  background: var(--danger); border: none;
}

.btn-approve {
  background: var(--success); border: none;
  display: flex; align-items: center; gap: 5px;
}

.btn-reject {
  background: var(--danger); border: none;
  display: flex; align-items: center; gap: 5px;
}

/* 详情弹窗 */
.detail-descriptions ::v-deep .el-descriptions__label {
  font-weight: 500; color: var(--text-secondary);
  width: 100px;
}

.detail-descriptions ::v-deep .el-descriptions__content {
  color: var(--text-primary); font-size: 14px;
}

.detail-link {
  display: inline-flex; align-items: center; gap: 4px;
  font-weight: 500;
}

.qa-content {
  line-height: 1.6; color: var(--text-primary);
  white-space: pre-wrap;
}

.submission-text {
  font-size: 13px; color: var(--text-secondary);
  line-height: 1.5;
}

.reject-reason-detail {
  color: var(--danger); font-size: 13px;
  line-height: 1.5;
}

.submitter-name {
  font-weight: 500; margin-right: 8px;
}

.audit-time-detail {
  color: var(--text-muted); font-size: 12px;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .content-audit {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --bg-hover: #334155;
    --border-color: #334155;
  }

  .filter-select ::v-deep .el-input__inner,
  .filter-input ::v-deep .el-input__inner,
  .reason-input ::v-deep .el-textarea__inner {
    background: #334155; color: var(--text-primary);
  }

  .stat-card { background: var(--bg-card); }

  .audit-table ::v-deep .el-table {
    background: var(--bg-card);
  }

  .audit-table ::v-deep .el-table__header-wrapper,
  .audit-table ::v-deep .el-table__body-wrapper {
    background: var(--bg-card);
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .stats-cards { width: 100%; justify-content: space-between; }
  .stat-card { flex: 1; min-width: 100px; justify-content: center; }
}

@media (max-width: 768px) {
  .content-audit { padding: 16px; }

  .filter-form {
    display: flex; flex-direction: column; align-items: stretch;
  }

  .filter-form ::v-deep .el-form-item {
    width: 100%; margin-right: 0 !important; margin-bottom: 12px;
  }

  .filter-select, .filter-input { width: 100%; }

  .filter-actions {
    width: 100%; justify-content: flex-end;
  }

  .table-toolbar {
    flex-direction: column; align-items: flex-start; gap: 12px;
  }

  .toolbar-left, .toolbar-right {
    width: 100%; justify-content: space-between;
  }

  .audit-table ::v-deep .el-table__row > td {
    padding: 10px 8px;
  }

  .action-buttons {
    flex-direction: column; gap: 2px;
  }

  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px;
}

::v-deep .el-table th.el-table__cell {
  background: #f8fafc !important;
}

::v-deep .el-checkbox__inner {
  border-radius: 4px; border-width: 2px;
}

::v-deep .el-dialog__headerbtn {
  top: 18px; right: 20px;
}

::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}
</style>