<template>
  <div class="course-resource">
    <!-- 页面标题 + 课程信息 -->
    <div class="page-header">
      <div>
        <h2 class="page-title">📁 课程资源</h2>
        <p class="course-info" v-if="courseName">
          当前课程：<el-tag size="mini" effect="dark">{{ courseName }}</el-tag>
        </p>
      </div>
    </div>

    <!-- 搜索 + 筛选区 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="资源标题">
          <el-input
              v-model="searchForm.title"
              placeholder="输入标题搜索"
              clearable
              @keyup.enter.native="handleSearch"
              prefix-icon="el-icon-search"
              style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select
              v-model="searchForm.type"
              placeholder="全部类型"
              clearable
              style="width: 120px"
              @change="handleSearch"
          >
            <el-option label="📊 PPT" value="PPT" />
            <el-option label="🎬 视频" value="VIDEO" />
            <el-option label="🔗 链接" value="LINK" />
            <el-option label="📎 文件" value="FILE" />
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
      <el-table
          :data="resourceList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{background:'#f8f9fa',color:'#303133',fontWeight:'600'}"
          :row-style="{height:'60px'}"
      >
        <!-- 资源标题 + 类型 -->
        <el-table-column label="资源信息" min-width="200">
          <template #default="{ row }">
            <div class="resource-info">
              <div class="resource-title" :title="row.title">{{ row.title }}</div>
              <div class="resource-meta">
                <el-tag size="mini" :type="getTypeTagType(row.type)" effect="plain">
                  {{ getTypeText(row.type) }}
                </el-tag>
                <span class="meta-dot">•</span>
                <span class="uploader">by {{ row.uploaderName }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 原始文件名（文件类型时显示） -->
        <el-table-column label="文件名" width="180" align="center">
          <template #default="{ row }">
            <span v-if="row.type === 'FILE'" :title="row.oriName" class="file-name">
              {{ getFileName(row.oriName) }}
            </span>
            <span v-else-if="row.type === 'VIDEO'" class="text-secondary">在线播放</span>
            <span v-else-if="row.type === 'LINK'" class="text-secondary">外部链接</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>

        <!-- 上传时间 -->
        <el-table-column label="上传时间" width="150" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <!-- 文件类型：下载 -->
            <el-button
                v-if="row.type === 'FILE'"
                size="mini"
                type="text"
                class="action-download"
                @click="downloadResource(row)"
            >
              📥 下载
            </el-button>
            <!-- 视频类型：在线播放 -->
            <el-button
                v-else-if="row.type === 'VIDEO'"
                size="mini"
                type="text"
                class="action-play"
                @click="playVideo(row)"
            >
              ▶️ 播放
            </el-button>
            <!-- 链接类型：跳转 -->
            <el-button
                v-else-if="row.type === 'LINK'"
                size="mini"
                type="text"
                class="action-link"
                @click="openLink(row)"
            >
              🔗 访问
            </el-button>
            <!-- PPT 类型：预览/下载 -->
            <el-button
                v-else-if="row.type === 'PPT'"
                size="mini"
                type="text"
                class="action-preview"
                @click="downloadResource(row)"
            >
              📥 下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty
          v-if="!loading && resourceList.length === 0"
          description="该课程暂无资源"
          :image-size="100"
          class="empty-state"
      >
        <template #extra>
          <el-button type="primary" plain @click="$router.back()">
            <i class="el-icon-back"></i> 返回课程
          </el-button>
        </template>
      </el-empty>
    </el-card>

    <!-- 视频播放弹窗 -->
    <el-dialog
        title="🎬 在线播放"
        :visible.sync="videoDialogVisible"
        width="70%"
        :close-on-click-modal="false"
        class="dialog-custom"
        @closed="handleVideoDialogClose"
    >
      <div class="video-container">
        <video
            v-if="currentResource?.fileUrl"
            :src="currentResource.fileUrl"
            controls
            class="video-player"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      <template #footer>
        <el-button @click="videoDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 链接确认弹窗 -->
    <el-dialog
        title="🔗 访问外部链接"
        :visible.sync="linkDialogVisible"
        width="400px"
        :close-on-click-modal="false"
        class="dialog-custom"
    >
      <el-alert
          title="⚠️ 您即将访问外部网站"
          type="warning"
          :closable="false"
          show-icon
          class="mb-3"
      />
      <p class="link-url" :title="currentResource?.fileUrl">
        {{ currentResource?.fileUrl }}
      </p>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmOpenLink">
          确认访问
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'StudentCourseResource',

  data() {
    return {
      courseId: null,
      courseName: '',
      studentId: null,

      // 搜索条件
      searchForm: {
        title: '',
        type: ''
      },

      // 资源列表
      loading: false,
      resourceList: [],

      // 视频播放
      videoDialogVisible: false,
      currentResource: null,

      // 链接确认
      linkDialogVisible: false
    }
  },

  created() {
    this.courseId = this.$route.query.courseId
    this.courseName = this.$route.query.courseName
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}')
    this.studentId = userInfo.userId

    if (this.courseId && this.studentId) {
      this.fetchResources()
    } else {
      this.$message.warning('参数错误，请先从"我的课程"进入')
    }
  },

  methods: {
    // ========== 工具方法 ==========

    // 获取资源类型标签样式
    getTypeTagType(type) {
      const map = {
        'PPT': 'warning',
        'VIDEO': 'danger',
        'LINK': 'info',
        'FILE': 'success'
      }
      return map[type] || 'info'
    },

    // 获取资源类型显示文本
    getTypeText(type) {
      const map = {
        'PPT': '📊 PPT',
        'VIDEO': '🎬 视频',
        'LINK': '🔗 链接',
        'FILE': '📎 文件'
      }
      return map[type] || type
    },

    // 获取文件名（从路径提取）
    getFileName(filePath) {
      if (!filePath) return '-'
      const parts = filePath.split('/')
      return parts[parts.length - 1] || '-'
    },

    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      return dateTime.replace('T', ' ').substring(0, 16)
    },

    // ========== 数据加载 ==========

    async fetchResources() {
      if (!this.courseId || !this.studentId) return

      this.loading = true
      try {
        const resp = await axios.get(`/api/student/courses/${this.courseId}/resources`, {
          params: {
            ...this.searchForm,
            studentId: this.studentId
          }
        })
        if (resp.data.code === 1) {
          this.resourceList = resp.data.data || []
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
      this.fetchResources()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = { title: '', type: '' }
      this.fetchResources()
    },

    // ========== 资源操作 ==========

    // 下载文件资源
    downloadResource(resource) {
      if (!resource.fileUrl) {
        this.$message.warning('资源链接为空')
        return
      }
      // 创建临时 a 标签触发下载
      const a = document.createElement('a')
      a.href = resource.fileUrl
      a.download = resource.oriName || 'download'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      this.$message.success('📥 下载已开始')
    },

    // 播放视频资源
    playVideo(resource) {
      if (!resource.fileUrl) {
        this.$message.warning('视频链接为空')
        return
      }
      this.currentResource = resource
      this.videoDialogVisible = true
    },

    // 关闭视频弹窗
    handleVideoDialogClose() {
      this.currentResource = null
    },

    // 打开外部链接（先确认）
    openLink(resource) {
      if (!resource.fileUrl) {
        this.$message.warning('链接地址为空')
        return
      }
      this.currentResource = resource
      this.linkDialogVisible = true
    },

    // 确认打开链接
    confirmOpenLink() {
      if (this.currentResource?.fileUrl) {
        window.open(this.currentResource.fileUrl, '_blank')
      }
      this.linkDialogVisible = false
    },

    // 预览 PPT 资源（简化：直接下载或新窗口打开）
    previewResource(resource) {
      if (!resource.fileUrl) {
        this.$message.warning('资源链接为空')
        return
      }
      // 根据文件类型决定打开方式
      const ext = resource.oriName?.split('.').pop()?.toLowerCase()
      if (['pdf', 'ppt', 'pptx'].includes(ext)) {
        // PDF/PPT 尝试新窗口打开预览
        window.open(resource.fileUrl, '_blank')
      } else {
        // 其他类型直接下载
        this.downloadResource(resource)
      }
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.course-resource {
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

.course-info {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

/* ========== 表格样式 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

.resource-info {
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

.meta-dot {
  color: #dcdfe6;
}

.uploader {
  color: #666;
}

.file-name {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-secondary {
  color: #909399;
  font-size: 12px;
}

/* 操作按钮 */
.action-download { color: #67c23a; }
.action-play { color: #409eff; }
.action-link { color: #909399; }
.action-preview { color: #e6a23c; }

/* 空状态 */
.empty-state {
  padding: 40px 0;
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

.dialog-custom ::v-deep .el-dialog__body {
  padding: 20px;
  background: #fff;
}

.video-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  max-height: 60vh;
  display: block;
}

.mb-3 { margin-bottom: 12px; }

.link-url {
  font-size: 13px;
  color: #666;
  word-break: break-all;
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ========== Element UI 微调 ========== */
.el-tag--mini {
  padding: 2px 8px;
  border-radius: 5px;
  font-weight: 500;
}
</style>