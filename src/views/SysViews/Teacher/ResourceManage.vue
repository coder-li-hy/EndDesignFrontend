<template>
  <div class="resource-manage">

    <!-- 页面标题 + 上传按钮 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">资源管理</h2>
        <p class="course-info" v-if="courseName">
          当前课程：<el-tag size="mini">{{ courseName }}</el-tag>
        </p>
      </div>
      <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
        上传资源
      </el-button>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="资源标题">
          <el-input
              v-model="searchForm.title"
              placeholder="输入标题搜索"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable>
            <el-option label="PPT 课件" value="PPT" />
            <el-option label="教学视频" value="VIDEO" />
            <el-option label="文档文件" value="FILE" />
            <el-option label="外部链接" value="LINK" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="全部" clearable>
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="PASS" />
            <el-option label="已拒绝" value="REJECT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 资源列表 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="resourceList" v-loading="loading" border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <!-- 资源标题 + 类型标签 -->
        <el-table-column label="资源信息" min-width="200">
          <template #default="{ row }">
            <div class="resource-info">
              <div class="resource-title" :title="row.title">{{ row.title }}</div>
              <el-tag
                  size="mini"
                  :type="getTypeTagType(row.type)"
                  style="margin-top: 4px"
              >
                {{ getTypeText(row.type) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 审核状态 -->
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getAuditTagType(row.auditStatus)"
                size="mini"
            >
              {{ getAuditText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 文件/链接预览 -->
        <el-table-column label="预览/下载" width="120" align="center">
          <template #default="{ row }">
            <!-- 链接类型：直接跳转 -->
            <el-link
                v-if="row.type === 'LINK'"
                :href="row.fileUrl"
                target="_blank"
                type="primary"
                :disabled="row.auditStatus !== 'PASS'"
            >
              <i class="el-icon-link"></i> 访问
            </el-link>

            <!-- 文件类型：下载 -->
            <el-link
                v-else-if="['PPT', 'VIDEO', 'FILE'].includes(row.type)"
                :href="row.fileUrl"
                target="_blank"
                type="primary"
                :disabled="row.auditStatus !== 'PASS'"
            >
              <i class="el-icon-download"></i> 下载
            </el-link>

            <!-- 未通过审核：显示锁定 -->
            <el-tag v-else size="mini" type="info">审核中</el-tag>
          </template>
        </el-table-column>

        <!-- 上传时间 -->
        <el-table-column prop="createTime" label="上传时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="mini" type="text" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-button
                size="mini"
                type="text"
                style="color: #f56c6c"
                @click="handleDelete(row)"
            >
              删除
            </el-button>
            <!-- 已拒绝的资源可重新提交审核（可选） -->
            <el-button
                v-if="row.auditStatus === 'REJECT'"
                size="mini"
                type="text"
                @click="resubmitAudit(row)"
            >
              重提
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

    <!-- 上传/编辑资源弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '上传资源' : '编辑资源'"
        :visible.sync="dialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">

        <el-form-item label="资源标题" prop="title">
          <el-input
              v-model="form.title"
              placeholder="请输入资源标题"
              maxlength="100"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="资源类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio label="PPT">PPT 课件</el-radio>
            <el-radio label="VIDEO">教学视频</el-radio>
            <el-radio label="FILE">文档文件</el-radio>
            <el-radio label="LINK">外部链接</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 文件上传（非链接类型显示） -->
        <el-form-item
            v-if="form.type !== 'LINK'"
            label="上传文件"
            prop="fileUrl"
        >
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
              :auto-upload="false"
          >
            <el-button size="small" type="primary">选择文件</el-button>
            <div slot="tip" class="el-upload__tip">
              {{ getUploadTip(form.type) }}
            </div>
          </el-upload>
        </el-form-item>

        <!-- 链接输入（链接类型显示） -->
        <el-form-item
            v-else
            label="资源链接"
            prop="fileUrl"
        >
          <el-input
              v-model="form.fileUrl"
              placeholder="请输入资源链接地址（如：https://...）"
          />
          <div class="form-tip">支持 B 站、慕课等教学平台链接</div>
        </el-form-item>

        <el-form-item label="资源描述" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入资源简介或使用说明（可选）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
        >
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
      // 课程信息（从路由参数获取）
      courseId: null,
      courseName: '',

      // 搜索条件
      searchForm: {
        title: '',
        type: '',
        auditStatus: ''
      },

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
        type: 'PPT',  // PPT/VIDEO/FILE/LINK
        fileUrl: '',
        description: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入资源标题', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '请选择资源类型', trigger: 'change' }
        ],
        fileUrl: [
          { required: true, message: '请上传文件或输入链接', trigger: 'change' }
        ]
      },

      // 文件上传相关
      fileList: [],
      uploadUrl: '/api/common/upload',  // 替换为你的文件上传接口
      uploadHeaders: {
        // Token 由 axios 拦截器自动添加
      },

      // 资源类型映射
      typeMap: {
        'PPT': { label: 'PPT 课件', tag: 'primary', accept: '.ppt,.pptx', tip: '支持.ppt/.pptx 格式，最大 100MB' },
        'VIDEO': { label: '教学视频', tag: 'success', accept: '.mp4,.avi,.mov', tip: '支持.mp4/.avi/.mov 格式，最大 500MB' },
        'FILE': { label: '文档文件', tag: 'warning', accept: '.pdf,.doc,.docx,.xls,.xlsx', tip: '支持常见文档格式，最大 50MB' },
        'LINK': { label: '外部链接', tag: 'info', accept: '', tip: '请输入有效的教学资源链接' }
      },

      // 审核状态映射
      auditMap: {
        'PENDING': { label: '待审核', tag: 'warning' },
        'PASS': { label: '已通过', tag: 'success' },
        'REJECT': { label: '已拒绝', tag: 'danger' }
      }
    }
  },

  created() {
    // 获取课程参数（从"我的课程"页面跳转时携带）
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName

    if (this.courseId) {
      this.fetchResources()
    } else {
      this.$message.warning('未选择课程，请先从"我的课程"进入')
    }
  },

  methods: {
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

    // 搜索
    handleSearch() {
      this.page = 1
      this.fetchResources()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = { title: '', type: '', auditStatus: '' }
      this.handleSearch()
    },

    // 分页
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
      // 编辑时初始化文件列表（用于显示已上传的文件名）
      if (row.fileUrl && row.type !== 'LINK') {
        const fileName = row.fileUrl.split('/').pop()
        this.fileList = [{ name: fileName, url: row.fileUrl }]
      }
      this.dialogVisible = true
    },

    // 资源类型变化时清空文件列表
    handleTypeChange() {
      this.fileList = []
      this.form.fileUrl = ''
      if (this.$refs.uploadRef) {
        this.$refs.uploadRef.clearFiles()
      }
    },

    // 提交表单（上传 + 保存）
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      // 非链接类型：先上传文件
      if (this.form.type !== 'LINK' && this.dialogType === 'add') {
        const file = this.$refs.uploadRef?.uploadFiles?.[0]?.raw
        if (!file) {
          this.$message.warning('请先选择要上传的文件')
          return
        }

        this.submitting = true
        try {
          // 1. 上传文件
          const formData = new FormData()
          formData.append('file', file)
          const uploadResp = await axios.post(this.uploadUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })

          if (uploadResp.data.code === 1) {
            this.form.fileUrl = uploadResp.data.data.filePath  // 后端返回的文件路径
          } else {
            throw new Error(uploadResp.data.msg || '文件上传失败')
          }
        } catch (e) {
          this.$message.error(e.message || '文件上传失败')
          this.submitting = false
          return
        }
      }

      // 2. 保存资源信息
      try {
        const submitData = {
          ...this.form,
          courseId: this.courseId,  // 关联当前课程
          auditStatus: 'PENDING'    // 新资源默认待审核
        }

        if (this.dialogType === 'add') {
          await axios.post('/api/teacher/resources', submitData)
          this.$message.success('资源上传成功，等待审核')
        } else {
          await axios.put(`/api/teacher/resources/${this.form.resourceId}`, submitData)
          this.$message.success('资源更新成功')
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
        description: ''
      }
      this.fileList = []
      if (this.$refs.formRef) this.$refs.formRef.resetFields()
      if (this.$refs.uploadRef) this.$refs.uploadRef.clearFiles()
    },

    handleDialogClose() { this.resetForm() },

    // 删除资源
    handleDelete(row) {
      this.$confirm(`确定要删除资源「${row.title}」吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete(`/api/teacher/resources/${row.resourceId}`)
          this.$message.success('删除成功')
          this.fetchResources()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '删除失败')
        }
      })
    },

    // 重新提交审核（已拒绝的资源）
    async resubmitAudit(row) {
      await this.$confirm(`确定要重新提交「${row.title}」进行审核吗？`, '提示', {
        type: 'warning'
      })

      try {
        await axios.put(`/api/teacher/resources/${row.resourceId}/resubmit`)
        this.$message.success('已重新提交审核')
        this.fetchResources()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      }
    },

    // ========== 文件上传相关 ==========

    // 上传前校验
    beforeUpload(file) {
      const typeConfig = this.typeMap[this.form.type]
      if (!typeConfig) return false

      // 文件大小校验（单位：MB）
      const maxSize = this.form.type === 'VIDEO' ? 500 :
          this.form.type === 'PPT' ? 100 : 50
      const isLtMax = file.size / 1024 / 1024 < maxSize

      if (!isLtMax) {
        this.$message.error(`${typeConfig.label}大小不能超过 ${maxSize}MB!`)
        return false
      }

      // 文件类型校验（简化：只校验扩展名）
      const ext = file.name.split('.').pop().toLowerCase()
      const allowedExts = typeConfig.accept.split(',').map(e => e.replace('.', '').trim())
      if (!allowedExts.includes(ext)) {
        this.$message.error(`不支持的文件类型：.${ext}`)
        return false
      }

      return true
    },

    // 上传成功回调
    handleUploadSuccess(response) {
      if (response.code === 1) {
        this.form.fileUrl = response.data.filePath
        this.$message.success('文件上传成功')
      } else {
        this.$message.error(response.msg || '上传失败')
      }
    },

    // 上传失败回调
    handleUploadError() {
      this.$message.error('文件上传失败，请检查网络或文件格式')
    },

    // ========== 工具方法 ==========

    // 获取资源类型标签颜色
    getTypeTagType(type) {
      return this.typeMap[type]?.tag || 'info'
    },

    // 获取资源类型中文
    getTypeText(type) {
      return this.typeMap[type]?.label || type
    },

    // 获取审核状态标签颜色
    getAuditTagType(status) {
      return this.auditMap[status]?.tag || 'info'
    },

    // 获取审核状态中文
    getAuditText(status) {
      return this.auditMap[status]?.label || status
    },

    // 获取文件选择框的 accept 属性
    getAcceptType(type) {
      return this.typeMap[type]?.accept || ''
    },

    // 获取上传提示文字
    getUploadTip(type) {
      return this.typeMap[type]?.tip || ''
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      // 后端返回格式: "2026-04-09 22:41:18"
      return dateTime
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式（复用 LoginView 风格）========== */
.resource-manage {
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

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

/* ========== 表格区 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

/* 资源信息样式 */
.resource-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-title {
  font-weight: 500;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

/* Element UI 组件深度定制（复用 LoginView 风格） */
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
  transition: all 0.3s ease;
}

.el-input >>> .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.el-message {
  z-index: 9999 !important;
}
</style>