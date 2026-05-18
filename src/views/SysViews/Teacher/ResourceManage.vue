<template>
  <div class="resource-manage">

    <!-- 页面标题 + 上传按钮 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📁 资源管理</h2>
        <p class="course-info" v-if="courseName">
          当前课程：
          <el-tag size="mini" effect="dark" type="primary">{{ courseName }}</el-tag>
        </p>
        <p class="page-subtitle" v-if="courseName">
          管理课程的教学资源，支持课件/视频/文档/链接多种类型
        </p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog" class="btn-primary">
        上传资源
      </el-button>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="资源标题">
          <el-input
              v-model="searchForm.title"
              placeholder="输入标题搜索"
              clearable
              @keyup.enter.native="handleSearch"
              prefix-icon="el-icon-search"
              class="search-input"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select
              v-model="searchForm.type"
              placeholder="全部"
              clearable
              class="filter-select"
          >
            <el-option label="📊 PPT 课件" value="PPT"/>
            <el-option label="🎬 教学视频" value="VIDEO"/>
            <el-option label="📄 文档文件" value="FILE"/>
            <el-option label="🔗 外部链接" value="LINK"/>
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
              v-model="searchForm.auditStatus"
              placeholder="全部"
              clearable
              class="filter-select"
          >
            <el-option label="⏳ 待审核" value="PENDING"/>
            <el-option label="✅ 已通过" value="PASS"/>
            <el-option label="❌ 已拒绝" value="REJECT"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 资源列表 -->
    <el-card class="table-card" shadow="hover">
      <!-- 统计信息 -->
      <div class="resource-stats" v-if="resourceList.length > 0">
        <el-tag size="mini" effect="dark" class="stat-tag">
          📊 共 {{ total }} 个资源
        </el-tag>
        <el-tag size="mini" type="success" effect="plain" class="stat-tag">
          ✅ 已通过 {{ resourceList.filter(r => r.auditStatus === 'PASS').length }}
        </el-tag>
        <el-tag size="mini" type="warning" effect="plain" class="stat-tag">
          ⏳ 待审核 {{ resourceList.filter(r => r.auditStatus === 'PENDING').length }}
        </el-tag>
        <el-tag size="mini" type="danger" effect="plain" class="stat-tag">
          ❌ 已拒绝 {{ resourceList.filter(r => r.auditStatus === 'REJECT').length }}
        </el-tag>
      </div>

      <el-table
          :data="resourceList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: '600'}"
          :row-style="{height: '72px'}"
          class="resource-table"
      >
        <!-- 资源信息 -->
        <el-table-column label="资源信息" min-width="220">
          <template #default="{ row }">
            <div class="resource-info-cell">
              <div class="resource-title" :title="row.title">{{ row.title }}</div>
              <div class="resource-meta">
                <el-tag
                    size="mini"
                    :type="getTypeTagType(row.type)"
                    :effect="getTypeEffect(row.type)"
                    class="type-tag"
                >
                  {{ getTypeIcon(row.type) }} {{ getTypeText(row.type) }}
                </el-tag>
                <span class="meta-dot">•</span>
                <span class="meta-text">{{ getOriginalName(row) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 审核状态 -->
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getAuditTagType(row.auditStatus)"
                :effect="getAuditEffect(row.auditStatus)"
                size="mini"
                class="audit-tag"
            >
              {{ getAuditIcon(row.auditStatus) }} {{ getAuditText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 预览/下载 -->
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <!-- 已通过：显示操作按钮 -->
            <template v-if="row.auditStatus === 'PASS'">
              <!-- 链接类型 -->
              <el-tooltip content="访问链接" placement="top" v-if="row.type === 'LINK'">
                <el-button
                    size="mini"
                    type="text"
                    :href="row.fileUrl"
                    target="_blank"
                    class="action-link"
                    @click.stop
                >
                  🔗 访问
                </el-button>
              </el-tooltip>

              <!-- 文件类型 -->
              <el-tooltip content="下载文件" placement="top" v-else>
                <el-button
                    size="mini"
                    type="text"
                    :href="getFileDownloadUrl(row)"
                    target="_blank"
                    :download="getDownloadFileName(row)"
                    class="action-download"
                    @click.stop
                >
                  ⬇️ 下载
                </el-button>
              </el-tooltip>
            </template>

            <!-- 未通过：显示状态 -->
            <el-tag
                v-else
                size="mini"
                type="info"
                effect="plain"
                class="pending-tag"
            >
              {{ row.auditStatus === 'PENDING' ? '⏳ 审核中' : '❌ 已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 上传时间 -->
        <el-table-column label="上传时间" width="150" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <i class="el-icon-time"></i>
              {{ formatDateTime(row.createTime) }}
            </div>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="管理" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-group">
              <el-button
                  size="mini"
                  type="text"
                  class="action-edit"
                  @click.stop="openEditDialog(row)"
              >
                ✏️ 编辑
              </el-button>

              <el-button
                  size="mini"
                  type="text"
                  class="action-delete"
                  @click.stop="handleDelete(row)"
                  :disabled="row.auditStatus === 'PASS'"
                  :title="row.auditStatus === 'PASS' ? '已通过审核的资源不能删除' : ''"
              >
                🗑️ 删除
              </el-button>

              <el-button
                  v-if="row.auditStatus === 'REJECT'"
                  size="mini"
                  type="text"
                  class="action-resubmit"
                  @click.stop="resubmitAudit(row)"
              >
                🔄 重提
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
          v-if="resourceList.length === 0 && !loading"
          description="暂无资源，点击右上角「上传资源」开始添加吧～"
          :image-size="120"
          class="empty-state"
      >
        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
          上传第一个资源
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

    <!-- 上传/编辑资源弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '✨ 上传新资源' : '✏️ 编辑资源信息'"
        :visible.sync="dialogVisible"
        width="580px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="dialog-custom"
    >
      <el-alert
          v-if="dialogType === 'add'"
          title="💡 资源上传后需管理员审核，审核通过后学生可见"
          type="info"
          :closable="false"
          show-icon
          class="mb-3"
      />

      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="medium">

        <el-form-item label="资源标题" prop="title">
          <el-input
              v-model="form.title"
              placeholder="请输入资源标题，如：第一章：绪论课件"
              maxlength="100"
              show-word-limit
              clearable
          >
            <i slot="prefix" class="el-icon-document"></i>
          </el-input>
        </el-form-item>

        <el-form-item label="资源类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange" class="type-radio">
            <el-radio label="PPT">📊 PPT 课件</el-radio>
            <el-radio label="VIDEO">🎬 教学视频</el-radio>
            <el-radio label="FILE">📄 文档文件</el-radio>
            <el-radio label="LINK">🔗 外部链接</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 文件上传（非链接类型显示） -->
        <el-form-item v-if="form.type !== 'LINK'" label="上传文件" prop="fileUrl">
          <el-upload
              ref="uploadRef"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :file-list="fileList"
              :limit="1"
              :accept="getAcceptType(form.type)"
              :auto-upload="true"
              class="upload-wrapper"
          >
            <el-button size="small" type="primary" icon="el-icon-upload">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">{{ getUploadTip(form.type) }}</div>
          </el-upload>

          <!-- 已上传文件预览 -->
          <div v-if="form.oriName && form.fileUrl" class="uploaded-file">
            <i class="el-icon-success"></i>
            <span class="file-name">{{ form.oriName }}</span>
            <el-link
                type="primary"
                :href="form.fileUrl"
                target="_blank"
                class="preview-link"
                @click.stop
            >
              预览
            </el-link>
          </div>
        </el-form-item>

        <!-- 链接输入（链接类型显示） -->
        <el-form-item v-else label="资源链接" prop="fileUrl">
          <el-input
              v-model="form.fileUrl"
              placeholder="请输入资源链接地址，如：https://www.bilibili.com/video/xxx"
              clearable
          >
            <i slot="prefix" class="el-icon-link"></i>
          </el-input>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            支持 B 站、慕课、YouTube 等教学平台链接，确保链接可公开访问
          </div>
        </el-form-item>

        <el-form-item label="资源描述" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入资源简介、使用说明或学习目标（可选）..."
              maxlength="500"
              show-word-limit
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
  name: 'ResourceManage',

  data() {
    return {
      // 课程信息
      courseId: null,
      courseName: '',

      // 搜索条件
      searchForm: { title: '', type: '', auditStatus: '' },

      // 资源列表
      loading: false,
      resourceList: [],
      page: 1,
      size: 10,
      total: 0,

      // 上传/编辑弹窗
      dialogVisible: false,
      dialogType: 'add',
      submitting: false,
      form: {
        resourceId: null,
        title: '',
        type: 'PPT',
        fileUrl: '',
        oriName: '',
        description: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入资源标题', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        type: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
        fileUrl: [{ required: true, message: '请上传文件或输入链接', trigger: 'change' }]
      },

      // 文件上传相关
      fileList: [],
      uploadUrl: '/api/common/upload',
      uploadHeaders: {},

      // 资源类型映射（增强版）
      typeMap: {
        'PPT': {
          label: 'PPT 课件',
          tag: 'primary',
          effect: 'light',
          icon: '📊',
          accept: '.ppt,.pptx',
          tip: '支持.ppt/.pptx 格式，最大 100MB'
        },
        'VIDEO': {
          label: '教学视频',
          tag: 'success',
          effect: 'light',
          icon: '🎬',
          accept: '.mp4,.avi,.mov,.mkv',
          tip: '支持.mp4/.avi/.mov 格式，最大 500MB'
        },
        'FILE': {
          label: '文档文件',
          tag: 'warning',
          effect: 'light',
          icon: '📄',
          accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
          tip: '支持常见文档格式，最大 50MB'
        },
        'LINK': {
          label: '外部链接',
          tag: 'info',
          effect: 'plain',
          icon: '🔗',
          accept: '',
          tip: '请输入有效的教学资源链接'
        }
      },

      // 审核状态映射（增强版）
      auditMap: {
        'PENDING': { label: '待审核', tag: 'warning', effect: 'light', icon: '⏳' },
        'PASS': { label: '已通过', tag: 'success', effect: 'dark', icon: '✅' },
        'REJECT': { label: '已拒绝', tag: 'danger', effect: 'light', icon: '❌' }
      }
    }
  },

  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName
    if (this.courseId) {
      this.fetchResources()
    } else {
      this.$message.warning('未选择课程，请先从"我的课程"进入')
    }
  },

  methods: {
    // ========== 工具方法 ==========

    // 获取类型标签效果
    getTypeEffect(type) {
      return this.typeMap[type]?.effect || 'light'
    },

    // 获取类型图标
    getTypeIcon(type) {
      return this.typeMap[type]?.icon || ''
    },

    // 获取审核标签效果
    getAuditEffect(status) {
      return this.auditMap[status]?.effect || 'light'
    },

    // 获取审核图标
    getAuditIcon(status) {
      return this.auditMap[status]?.icon || ''
    },

    // 获取原始文件名（友好显示）
    getOriginalName(row) {
      if (row.type === 'LINK') return '外部链接'
      return row.oriName || '未知文件'
    },

    // 文件上传成功处理
    handleUploadSuccess(response) {
      const result = response.data || response;

      if (response.code === 1) {
        this.form.fileUrl = result.filePath
        this.form.oriName = result.oriName
        this.$message.success('✓ 文件上传成功')
      } else {
        this.$message.error(result.msg || '上传失败')
      }
    },

    // 文件上传前校验
    beforeUpload(file) {
      const typeConfig = this.typeMap[this.form.type]
      if (!typeConfig) return false

      // 文件大小校验
      const maxSize = this.form.type === 'VIDEO' ? 500 : this.form.type === 'PPT' ? 100 : 50
      if (file.size / 1024 / 1024 > maxSize) {
        this.$message.error(`${typeConfig.label}大小不能超过 ${maxSize}MB!`)
        return false
      }

      // 文件类型校验
      const ext = file.name.split('.').pop().toLowerCase()
      const allowedExts = typeConfig.accept.split(',').map(e => e.replace('.', '').trim())
      if (!allowedExts.includes(ext)) {
        this.$message.error(`不支持的文件类型：.${ext}`)
        return false
      }

      return true
    },

    // 文件上传错误处理
    handleUploadError() {
      this.$message.error('文件上传失败，请检查网络或文件格式')
    },

    // ========== 数据加载 ==========

    async fetchResources() {
      if (!this.courseId) return
      this.loading = true
      try {
        const resp = await axios.get('/api/teacher/resources', {
          params: {
            courseId: this.courseId,
            title: this.searchForm.title,
            type: this.searchForm.type,
            auditStatus: this.searchForm.auditStatus,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.resourceList = resp.data.data.records || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch resources error:', e)
        this.$message.error('加载资源列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchResources() },
    handleReset() { this.searchForm = { title: '', type: '', auditStatus: '' }; this.handleSearch() },
    handlePageChange(p) { this.page = p; this.fetchResources() },
    handleSizeChange(s) { this.size = s; this.page = 1; this.fetchResources() },

    // ========== 资源管理 ==========

    openAddDialog() {
      this.dialogType = 'add'
      this.resetForm()
      this.dialogVisible = true
    },

    openEditDialog(row) {
      this.dialogType = 'edit'
      this.form = JSON.parse(JSON.stringify(row))

      // 编辑时初始化文件列表（显示原始文件名）
      if (row.fileUrl && row.type !== 'LINK') {
        const displayName = row.oriName || row.fileUrl.split('/').pop()
        this.fileList = [{ name: displayName, url: row.fileUrl, uid: Date.now() }]
      }
      this.dialogVisible = true
    },

    handleTypeChange() {
      this.fileList = []
      this.form.fileUrl = ''
      this.form.oriName = ''
      if (this.$refs.uploadRef) this.$refs.uploadRef.clearFiles()
    },

    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      // 非链接类型：如果需要上传新文件
      const hasNewFile = this.$refs.uploadRef?.uploadFiles?.length > 0 &&
          this.$refs.uploadRef.uploadFiles[0]?.status !== 'success'
      const needUpload = this.form.type !== 'LINK' &&
          (this.dialogType === 'add' || (this.dialogType === 'edit' && hasNewFile))

      if (needUpload && !this.form.fileUrl) {
        this.$message.warning('请先选择要上传的文件')
        return
      }

      this.submitting = true
      try {
        const submitData = {
          ...this.form,
          courseId: this.courseId,
          // 新增时设为待审核，编辑时不修改审核状态
          auditStatus: this.dialogType === 'add' ? 'PENDING' : undefined
        }

        if (this.dialogType === 'add') {
          await axios.post('/api/teacher/resources', submitData)
          this.$message.success('✨ 资源上传成功，等待审核')
        } else {
          await axios.put(`/api/teacher/resources/${this.form.resourceId}`, submitData)
          this.$message.success('✓ 资源更新成功')
        }
        this.dialogVisible = false
        this.fetchResources()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.form = {
        resourceId: null,
        title: '',
        type: 'PPT',
        fileUrl: '',
        oriName: '',
        description: ''
      }
      this.fileList = []
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
      if (this.$refs.uploadRef) this.$refs.uploadRef.clearFiles()
    },

    handleDialogClose() {
      this.resetForm()
    },

    // 删除资源
    async handleDelete(row) {
      if (row.auditStatus === 'PASS') {
        this.$message.warning('已通过审核的资源不能删除')
        return
      }

      this.$confirm(`确定要删除资源「${row.title}」吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete(`/api/teacher/resources/${row.resourceId}`)
          this.$message.success('✓ 删除成功')
          this.fetchResources()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '删除失败')
        }
      })
    },

    // 重新提交审核
    async resubmitAudit(row) {
      await this.$confirm(`确定要重新提交「${row.title}」进行审核吗？`, '提示', { type: 'warning' })
      try {
        await axios.put(`/api/teacher/resources/${row.resourceId}/resubmit`)
        this.$message.success('🔄 已重新提交审核')
        this.fetchResources()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      }
    },

    // ========== 工具方法 ==========

    getFileDownloadUrl(row) {
      return process.env.NODE_ENV === 'development'
          ? `http://localhost:8080${row.fileUrl}`
          : row.fileUrl
    },

    getDownloadFileName(row) {
      return row.oriName || row.fileUrl?.split('/').pop() || 'download'
    },

    getTypeTagType(type) {
      return this.typeMap[type]?.tag || 'info'
    },

    getTypeText(type) {
      return this.typeMap[type]?.label || type
    },

    getAuditTagType(status) {
      return this.auditMap[status]?.tag || 'info'
    },

    getAuditText(status) {
      return this.auditMap[status]?.label || status
    },

    getAcceptType(type) {
      return this.typeMap[type]?.accept || ''
    },

    getUploadTip(type) {
      return this.typeMap[type]?.tip || ''
    },

    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.resource-manage {
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

.course-info {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #666;
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

.search-input {
  width: 200px;
}

.filter-select {
  width: 140px;
}

/* ========== 统计信息 ========== */
.resource-stats {
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

.resource-table ::v-deep .el-table__row {
  transition: all 0.2s ease;
}

.resource-table ::v-deep .el-table__row:hover {
  background: #f8f9fa !important;
}

/* 资源信息单元格 */
.resource-info-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.resource-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.type-tag {
  font-size: 11px;
  padding: 2px 8px;
}

.meta-dot {
  color: #dcdfe6;
}

.meta-text {
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

/* 审核标签 */
.audit-tag {
  font-size: 12px;
  padding: 2px 10px;
}

/* 操作按钮 */
.action-link,
.action-download {
  font-size: 12px;
  padding: 4px 8px;
}
.action-link { color: #409eff; }
.action-download { color: #67c23a; }
.action-link:hover,
.action-download:hover {
  font-weight: 500;
}

.pending-tag {
  font-size: 12px;
}

/* 时间单元格 */
.time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}
.time-cell i {
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
.action-delete { color: #f56c6c; }
.action-resubmit { color: #e6a23c; }

.action-group .el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

/* 表单样式 */
.type-radio {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.type-radio ::v-deep .el-radio {
  margin-right: 0;
  margin-bottom: 8px;
}

.upload-wrapper {
  width: 100%;
}

.upload-wrapper ::v-deep .el-upload {
  display: inline-block;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  font-size: 13px;
  color: #67c23a;
}

.uploaded-file .file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-link {
  font-size: 12px;
}

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
  }

  .resource-stats {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-group {
    justify-content: flex-start;
  }

  .search-input,
  .filter-select {
    width: 100%;
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

.el-radio__label {
  font-size: 13px;
}

.el-message {
  z-index: 9999 !important;
}
</style>