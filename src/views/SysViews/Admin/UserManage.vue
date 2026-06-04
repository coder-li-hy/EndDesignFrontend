<template>
  <div class="user-manage">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 + 操作按钮 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-user"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">用户管理</h2>
          <p class="page-subtitle">管理系统用户账号与权限</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog" class="btn-add">
          添加用户
        </el-button>
        <el-button type="success" icon="el-icon-upload" @click="openImportDialog" class="btn-import">
          批量导入
        </el-button>
        <el-button
            type="danger"
            icon="el-icon-delete"
            :disabled="!selectedIds.length"
            @click="handleBatchDelete"
            class="btn-delete"
            :class="{ 'btn-disabled': !selectedIds.length }"
        >
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-header">
        <i class="el-icon-search filter-icon"></i>
        <span class="filter-title">筛选条件</span>
      </div>
      <el-form :inline="true" :model="searchForm" size="small" class="filter-form">
        <el-form-item label="用户名">
          <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @keyup.enter.native="handleSearch"
              class="filter-input"
              prefix-icon="el-icon-user"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
              v-model="searchForm.role"
              placeholder="全部角色"
              clearable
              class="filter-select"
          >
            <el-option label="👨‍💼 管理员" value="ADMIN" />
            <el-option label="👨‍🏫 教师" value="TEACHER" />
            <el-option label="🎓 学生" value="STUDENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
              v-model="searchForm.status"
              placeholder="全部状态"
              clearable
              class="filter-select"
          >
            <el-option label="🟢 正常" value="ACTIVE" />
            <el-option label="🔴 禁用" value="DISABLED" />
          </el-select>
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

    <!-- 用户表格 -->
    <el-card class="table-card" shadow="never">
      <!-- 表格工具栏 -->
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-checkbox v-model="selectAll" @change="handleSelectAll" class="select-all">
            <span class="checkbox-label">全选</span>
          </el-checkbox>
          <span class="selected-count" v-if="selectedIds.length">
            <i class="el-icon-select"></i>
            已选择 <strong>{{ selectedIds.length }}</strong> 项
          </span>
        </div>
        <div class="toolbar-stats" v-if="userList.length > 0">
          <el-tag size="mini" effect="plain">共 {{ total }} 用户</el-tag>
          <el-tag size="mini" type="success" effect="plain" style="margin-left: 8px">
            {{ activeCount }} 正常
          </el-tag>
          <el-tag size="mini" type="danger" effect="plain" style="margin-left: 6px">
            {{ disabledCount }} 禁用
          </el-tag>
        </div>
      </div>

      <el-table
          ref="userTable"
          :data="userList"
          v-loading="loading"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
          :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 600 }"
          :row-style="getRowStyle"
          class="user-table"
      >
        <el-table-column type="selection" width="48" align="center" />

        <!-- 用户信息 -->
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <div class="user-avatar" :class="getAvatarClass(row)">
                {{ getAvatarInitials(row.username) }}
              </div>
              <div class="user-info">
                <span class="username">{{ row.username }}</span>
                <span class="user-email" v-if="row.email">{{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 角色 -->
        <el-table-column prop="role" label="角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag
                :type="getRoleTagType(row.role)"
                size="mini"
                effect="light"
                class="role-tag"
            >
              <i :class="getRoleIcon(row.role)"></i>
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 手机号 -->
        <el-table-column prop="phone" label="手机号" width="130" align="center">
          <template #default="{ row }">
            <span class="phone-cell" v-if="row.phone">
              <i class="el-icon-phone-outline"></i>
              {{ formatPhone(row.phone) }}
            </span>
            <span class="text-muted" v-else>—</span>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.status"
                :active-value="'ACTIVE'"
                :inactive-value="'DISABLED'"
                :active-color="'var(--success)'"
                :inactive-color="'var(--danger)'"
                :disabled="row.username === 'admin' || submitting"
                @change="handleStatusChange(row)"
                class="status-switch"
            >
              <template #active>
                <i class="el-icon-check" style="font-size: 11px"></i>
              </template>
              <template #inactive>
                <i class="el-icon-close" style="font-size: 11px"></i>
              </template>
            </el-switch>
          </template>
        </el-table-column>

        <!-- 创建时间 -->
        <el-table-column prop="createTime" label="创建时间" width="150" align="center">
          <template #default="{ row }">
            <div class="time-cell">
              <i class="el-icon-time time-icon"></i>
              <span>{{ formatDateTime(row.createTime) }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                  size="mini"
                  type="text"
                  @click="handleEdit(row)"
                  class="action-btn edit"
              >
                <i class="el-icon-edit"></i> 编辑
              </el-button>
              <el-button
                  size="mini"
                  type="text"
                  @click="handleResetPwd(row)"
                  class="action-btn reset"
              >
                <i class="el-icon-key"></i> 密码
              </el-button>
              <el-button
                  size="mini"
                  type="text"
                  :disabled="row.username === 'admin'"
                  @click="handleDelete(row)"
                  class="action-btn delete"
              >
                <i class="el-icon-delete"></i> 删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!loading && userList.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="el-icon-user"></i>
        </div>
        <p class="empty-text">暂无符合条件的用户</p>
        <el-button size="small" type="primary" @click="openAddDialog" icon="el-icon-plus">
          添加第一个用户
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
            class="user-pagination"
        />
      </div>
    </el-card>

    <!-- 添加/编辑用户弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '✨ 添加用户' : '✏️ 编辑用户'"
        :visible="dialogVisible"
        @close="dialogVisible = false"
        width="520px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="user-dialog"
        custom-class="modal-custom"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" class="user-form">

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="form.username"
              :disabled="dialogType === 'edit'"
              placeholder="请输入用户名，3-20位字符"
              maxlength="20"
              show-word-limit
              class="form-input"
              :prefix-icon="dialogType === 'edit' ? 'el-icon-lock' : 'el-icon-user'"
          />
        </el-form-item>

        <!-- 密码（仅添加时） -->
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input
              type="password"
              v-model="form.password"
              placeholder="请输入初始密码，6-20位字符"
              show-password
              maxlength="20"
              class="form-input"
              prefix-icon="el-icon-key"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            建议设置强密码，用户首次登录可修改
          </div>
        </el-form-item>

        <!-- 角色 -->
        <el-form-item label="角色" prop="role">
          <el-select
              v-model="form.role"
              placeholder="请选择用户角色"
              style="width: 100%"
              class="form-select"
          >
            <el-option label="👨‍🏫 教师" value="TEACHER">
              <span style="float: left">👨‍🏫 教师</span>
              <span style="float: right; color: #8492a6; font-size: 12px">可管理课程</span>
            </el-option>
            <el-option label="🎓 学生" value="STUDENT">
              <span style="float: left">🎓 学生</span>
              <span style="float: right; color: #8492a6; font-size: 12px">仅学习权限</span>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
              v-model="form.email"
              placeholder="user@example.com"
              class="form-input"
              prefix-icon="el-icon-message"
          />
        </el-form-item>

        <!-- 手机号 -->
        <el-form-item label="手机号" prop="phone">
          <el-input
              v-model="form.phone"
              placeholder="11位中国大陆手机号"
              maxlength="11"
              class="form-input"
              prefix-icon="el-icon-phone"
          />
        </el-form-item>

        <!-- 状态 -->
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status" class="status-radio">
            <el-radio label="ACTIVE" border class="radio-active">
              <i class="el-icon-circle-check"></i> 正常
            </el-radio>
            <el-radio label="DISABLED" border class="radio-disabled">
              <i class="el-icon-circle-close"></i> 禁用
            </el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" :disabled="submitting">
            取 消
          </el-button>
          <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              class="btn-submit"
          >
            {{ submitting ? '提交中...' : '确 定 提 交' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog
        title="📥 批量导入用户"
        :visible="importDialogVisible"
        @close="importDialogVisible = false"
        width="480px"
        :close-on-click-modal="false"
        class="import-dialog"
        custom-class="modal-custom"
    >
      <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
          class="import-tip"
          effect="light"
      >
        <template #default>
          <div class="tip-list">
            <div class="tip-item">
              <i class="el-icon-download"></i>
              <span>下载模板文件，按要求填写用户信息</span>
            </div>
            <div class="tip-item">
              <i class="el-icon-key"></i>
              <span>密码列可选，不填则使用默认密码 <strong>123456</strong></span>
            </div>
            <div class="tip-item">
              <i class="el-icon-files"></i>
              <span>支持 .xlsx / .xls / .csv 格式，单次最多 100 条</span>
            </div>
          </div>
        </template>
      </el-alert>

      <el-form label-width="90px" class="import-form">
        <el-form-item label="模板下载">
          <el-button type="text" icon="el-icon-download" @click="downloadTemplate" class="btn-template">
           查看导入模板
          </el-button>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
              ref="uploadRef"
              action="/api/admin/users/import"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleImportSuccess"
              :on-error="handleImportError"
              :auto-upload="false"
              :limit="1"
              accept=".csv,.xlsx,.xls"
              class="import-upload"
          >
            <el-button size="small" type="primary" icon="el-icon-folder-opened">
              选择文件
            </el-button>
            <div slot="tip" class="upload-tip">
              仅支持 CSV 文件，不超过 5MB
            </div>
          </el-upload>
          <!-- 已选文件显示 -->
          <div class="selected-file" v-if="selectedFile">
            <i class="el-icon-document"></i>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
            <el-button size="mini" type="text" icon="el-icon-close" @click="clearSelectedFile" class="btn-clear" />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false" :disabled="importing">
            取 消
          </el-button>
          <el-button
              type="primary"
              :loading="importing"
              @click="submitImport"
              :disabled="!selectedFile"
              class="btn-import-submit"
          >
            {{ importing ? '导入中...' : '🚀 开始导入' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
        title="🔑 重置密码"
        :visible="resetPwdDialogVisible"
        @close="resetPwdDialogVisible = false"
        width="420px"
        :close-on-click-modal="false"
        class="reset-dialog"
        custom-class="modal-custom"
    >
      <div class="reset-content">
        <el-alert
            :title="`确定要重置用户「${resetPwdForm.username}」的密码吗？`"
            type="warning"
            :closable="false"
            show-icon
            class="reset-tip"
            effect="light"
        >
          <template #default>
            <div class="reset-info">
              <p>• 重置后密码将恢复为默认值：<strong class="default-pwd">123456</strong></p>
              <p>• 建议通知用户及时更新密码保障账号安全</p>
            </div>
          </template>
        </el-alert>

        <!-- 用户信息预览 -->
        <div class="user-preview">
          <div class="preview-avatar" :class="getAvatarClass({ username: resetPwdForm.username })">
            {{ getAvatarInitials(resetPwdForm.username) }}
          </div>
          <div class="preview-info">
            <span class="preview-username">{{ resetPwdForm.username }}</span>
            <el-tag size="mini" effect="plain">即将重置密码</el-tag>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetPwdDialogVisible = false" :disabled="resetting">
            取 消
          </el-button>
          <el-button
              type="primary"
              :loading="resetting"
              @click="submitResetPwd"
              class="btn-reset-confirm"
          >
            {{ resetting ? '处理中...' : '确 定 重 置' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'UserManage',

  data() {
    // 自定义校验：手机号格式
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback()  // 手机号非必填
      } else if (!/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的11位手机号'))
      } else {
        callback()
      }
    }

    // 自定义校验：邮箱格式
    const validateEmail = (rule, value, callback) => {
      if (!value) {
        callback()  // 邮箱非必填
      } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
        callback(new Error('请输入正确的邮箱格式'))
      } else {
        callback()
      }
    }

    return {
      // 搜索条件
      searchForm: { username: '', role: '', status: '' },

      // 表格数据
      loading: false,
      userList: [],
      page: 1,
      size: 10,
      total: 0,

      // 多选相关
      selectAll: false,
      selectedIds: [],

      // 添加/编辑弹窗
      dialogVisible: false,
      dialogType: 'add',
      submitting: false,
      form: {
        userId: null, username: '', password: '', role: '',
        email: '', phone: '', status: 'ACTIVE'
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }],
        email: [{ validator: validateEmail, trigger: 'blur' }],
        phone: [{ validator: validatePhone, trigger: 'blur' }]
      },

      // 批量导入
      importDialogVisible: false,
      importing: false,
      selectedFile: null,
      uploadHeaders: {},

      // 重置密码
      resetPwdDialogVisible: false,
      resetting: false,
      resetPwdForm: { userId: null, username: '' }
    }
  },

  computed: {
    // 正常状态用户数
    activeCount() {
      return this.userList.filter(u => u.status === 'ACTIVE').length
    },
    // 禁用状态用户数
    disabledCount() {
      return this.userList.filter(u => u.status === 'DISABLED').length
    }
  },

  mounted() {
    this.fetchUsers()
  },

  methods: {
    // ========== 数据加载 ==========
    async fetchUsers() {
      this.loading = true
      try {
        const resp = await axios.get('/api/admin/users/page', {
          params: {
            username: this.searchForm.username,
            role: this.searchForm.role,
            status: this.searchForm.status,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data?.code === 1) {
          this.userList = resp.data.data?.records || []
          this.total = resp.data.data?.total || 0
        }
      } catch (e) {
        console.error('Fetch users error:', e)
        this.$message.error('加载用户列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchUsers() },
    handleReset() {
      this.searchForm = { username: '', role: '', status: '' }
      this.handleSearch()
    },
    handlePageChange(newPage) { this.page = newPage; this.fetchUsers() },
    handleSizeChange(newSize) { this.size = newSize; this.page = 1; this.fetchUsers() },

    // ========== 表格操作 ==========
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.userId)
      this.selectAll = selection.length === this.userList.length && this.userList.length > 0
    },
    handleSelectAll(checked) {
      if (checked) this.$refs.userTable.toggleAllSelection()
      else this.$refs.userTable.clearSelection()
    },
    getRowStyle({ row }) {
      if (row.status === 'DISABLED') {
        return { background: 'rgba(239, 68, 68, 0.03)' }
      }
      return {}
    },

    // 状态切换
    async handleStatusChange(row) {
      const statusText = row.status === 'ACTIVE' ? '启用' : '禁用'
      try {
        await axios.put(`/api/admin/users/${row.userId}/status`, { status: row.status })
        this.$message.success(`✅ 用户${statusText}成功`)
      } catch (e) {
        row.status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
        this.$message.error(`❌ 操作失败：${e.response?.data?.msg || '网络错误'}`)
      }
    },

    // ========== 添加/编辑 ==========
    openAddDialog() {
      this.dialogType = 'add'
      this.resetForm()
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogType = 'edit'
      this.form = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
      } catch { return }

      this.submitting = true
      try {
        const submitData = { ...this.form }
        if (this.dialogType === 'add') {
          await axios.post('/api/admin/users', submitData)
          this.$message.success('✅ 用户添加成功')
        } else {
          await axios.put(`/api/admin/users/${this.form.userId}`, submitData)
          this.$message.success('✅ 用户更新成功')
        }
        this.dialogVisible = false
        await this.fetchUsers()
      } catch (e) {
        this.$message.error(`❌ ${e.response?.data?.msg || '操作失败'}`)
      } finally {
        this.submitting = false
      }
    },
    resetForm() {
      this.form = { userId: null, username: '', password: '', role: '', email: '', phone: '', status: 'ACTIVE' }
      this.$refs.formRef?.resetFields()
    },
    handleDialogClose() { this.resetForm() },

    // ========== 批量操作 ==========
    async handleBatchDelete() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要删除的用户')
        return
      }
      try {
        await this.$confirm(
            `确定要删除选中的 ${this.selectedIds.length} 个用户吗？\n此操作不可恢复`,
            '⚠️ 批量删除',
            { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
        )
        await axios.delete('/api/admin/users/batch', { data: { userIds: this.selectedIds } })
        this.$message.success('✅ 删除成功')
        await this.fetchUsers()
      } catch (e) {
        if (e !== 'cancel') this.$message.error(`❌ ${e.response?.data?.msg || '删除失败'}`)
      }
    },
    async handleDelete(row) {
      if (row.username === 'admin') {
        this.$message.warning('🔒 管理员账号不能删除')
        return
      }
      try {
        await this.$confirm(
            `确定要删除用户「${row.username}」吗？\n此操作不可恢复`,
            '⚠️ 确认删除',
            { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
        )
        await axios.delete(`/api/admin/users/${row.userId}`)
        this.$message.success('✅ 删除成功')
        await this.fetchUsers()
      } catch (e) {
        if (e !== 'cancel') this.$message.error(`❌ ${e.response?.data?.msg || '删除失败'}`)
      }
    },

    // ========== 重置密码 ==========
    handleResetPwd(row) {
      this.resetPwdForm = { userId: row.userId, username: row.username }
      this.resetPwdDialogVisible = true
    },
    async submitResetPwd() {
      this.resetting = true
      try {
        await axios.post(`/api/admin/users/${this.resetPwdForm.userId}/reset-pwd`)
        this.$message.success('✅ 密码已重置为 123456')
        this.resetPwdDialogVisible = false
      } catch (e) {
        this.$message.error(`❌ ${e.response?.data?.msg || '重置失败'}`)
      } finally {
        this.resetting = false
      }
    },

    // ========== 批量导入 ==========
    openImportDialog() {
      this.importDialogVisible = true
      this.selectedFile = null
      this.$refs.uploadRef?.clearFiles()
    },
    downloadTemplate() {
      window.open('/api/admin/users/template', '_blank')
    },
    beforeUpload(file) {
      const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
      // 暫時無法支持excel文件輸入
      // const isExcel = file.type === 'application/vnd.ms-excel' ||
      //     file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      //     file.name.toLowerCase().endsWith('.xlsx') ||
      //     file.name.toLowerCase().endsWith('.xls')
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isCSV) {
        this.$message.error('❌ 只能上传 CSV 文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('❌ 文件大小不能超过 5MB!')
        return false
      }
      this.selectedFile = file
      return false // 阻止自动上传，手动触发
    },
    handleImportSuccess(response) {
      if (response?.code === 1) {
        const { successCount, failCount, errors } = response.data || {}
        let msg = `✅ 导入完成：成功 ${successCount} 条，失败 ${failCount} 条`
        if (errors?.length > 0) {
          msg += `\n\n失败详情：\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`
        }
        this.$message.success({ message: msg, duration: 5000, showClose: true })
        this.importDialogVisible = false
        this.fetchUsers()
      } else {
        this.$message.error(`❌ ${response?.msg || '导入失败'}`)
      }
    },
    handleImportError() {
      this.$message.error('❌ 文件上传失败，请检查网络或文件格式')
    },
    submitImport() {
      if (!this.selectedFile) {
        this.$message.warning('请先选择要导入的文件')
        return
      }
      this.importing = true
      this.$refs.uploadRef?.submit()
    },
    clearSelectedFile() {
      this.selectedFile = null
      this.$refs.uploadRef?.clearFiles()
    },

    // ========== 工具方法 ==========
    getRoleText(role) {
      const map = { 'ADMIN': '管理员', 'TEACHER': '教师', 'STUDENT': '学生' }
      return map[role] || role
    },
    getRoleIcon(role) {
      const map = { 'ADMIN': 'el-icon-s-flag', 'TEACHER': 'el-icon-reading', 'STUDENT': 'el-icon-graduation' }
      return map[role] || 'el-icon-user'
    },
    getRoleTagType(role) {
      const map = { 'ADMIN': 'danger', 'TEACHER': 'warning', 'STUDENT': 'success' }
      return map[role] || 'info'
    },
    getAvatarInitials(username) {
      if (!username) return '?'
      const names = username.split('')
      return names[0]?.toUpperCase() || '?'
    },
    getAvatarClass(row) {
      const map = { 'ADMIN': 'avatar-admin', 'TEACHER': 'avatar-teacher', 'STUDENT': 'avatar-student' }
      return map[row?.role] || 'avatar-default'
    },
    formatPhone(phone) {
      if (!phone) return ''
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },
    formatDateTime(time) {
      if (!time) return '-'
      return time.replace('T', ' ').substring(0, 16)
    },
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / 1024 / 1024).toFixed(1) + ' MB'
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.user-manage {
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
  height: 180px;
  background: radial-gradient(ellipse at top, rgba(79, 70, 229, 0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 页面标题 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.header-actions {
  display: flex; gap: 10px; flex-wrap: wrap;
}

.btn-add {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none; padding: 10px 22px;
  border-radius: 10px; font-weight: 500;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
}

.btn-import {
  padding: 10px 20px; border-radius: 10px;
  border: 2px solid var(--success);
  color: var(--success); font-weight: 500;
  background: rgba(34, 197, 94, 0.08);
}
.btn-import:hover:not(:disabled) {
  background: var(--success); color: white;
  transform: translateY(-1px);
}

.btn-delete {
  padding: 10px 20px; border-radius: 10px;
  border: 2px solid var(--danger);
  color: var(--danger); font-weight: 500;
  background: rgba(239, 68, 68, 0.08);
}
.btn-delete:hover:not(:disabled) {
  background: var(--danger); color: white;
}
.btn-delete.btn-disabled {
  opacity: 0.5; cursor: not-allowed;
  border-color: var(--text-muted); color: var(--text-muted);
  background: var(--bg-hover);
}

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

.filter-icon { font-size: 16px; color: var(--primary); }
.filter-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.filter-form {
  padding: 16px 20px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-input, .filter-select { width: 180px; }

.filter-input ::v-deep .el-input__inner,
.filter-select ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
  background: #f8fafc;
}

.filter-input ::v-deep .el-input__inner:focus,
.filter-select ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.filter-actions { margin-left: auto; display: flex; gap: 10px; }

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
.btn-reset:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

/* ========== 表格区 ========== */
.table-card {
  border-radius: 16px;
  border: 1px solid var(--border-color);
  animation: cardEnter 0.4s ease-out 0.2s backwards;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-hover);
  border-radius: 16px 16px 0 0;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left { display: flex; align-items: center; gap: 12px; }

.select-all ::v-deep .el-checkbox__label {
  font-size: 13px; font-weight: 500; color: var(--text-secondary);
}

.selected-count {
  font-size: 13px; color: var(--text-secondary);
  display: flex; align-items: center; gap: 5px;
}
.selected-count strong { color: var(--primary); font-weight: 600; }

.toolbar-stats { display: flex; align-items: center; gap: 6px; }

/* 表格样式 */
.user-table ::v-deep .el-table__row { transition: background 0.15s; }
.user-table ::v-deep .el-table__row:hover { background: rgba(79, 70, 229, 0.04) !important; }

/* 用户单元格 */
.user-cell { display: flex; align-items: center; gap: 12px; }

.user-avatar {
  width: 36px; height: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: white;
  flex-shrink: 0;
}
.avatar-admin { background: linear-gradient(135deg, #ef4444, #dc2626); }
.avatar-teacher { background: linear-gradient(135deg, #f59e0b, #d97706); }
.avatar-student { background: linear-gradient(135deg, #22c55e, #16a34a); }
.avatar-default { background: linear-gradient(135deg, #64748b, #475569); }

.user-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.username {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
}

.user-email {
  font-size: 12px; color: var(--text-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* 角色标签 */
.role-tag {
  font-size: 11px; padding: 2px 10px;
  border-radius: 5px; font-weight: 500;
}

/* 手机号 */
.phone-cell {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: var(--text-secondary);
  font-family: monospace;
}
.phone-cell i { color: var(--text-muted); font-size: 12px; }

/* 状态 Switch */
.status-switch ::v-deep .el-switch__label { font-size: 11px; font-weight: 500; }

/* 时间 */
.time-cell {
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; color: var(--text-secondary);
}
.time-icon { color: var(--text-muted); font-size: 12px; }

.text-muted { color: var(--text-muted); font-size: 13px; }

/* 操作按钮 */
.action-buttons { display: flex; justify-content: center; gap: 2px; }

.action-btn {
  font-size: 12px; padding: 4px 10px;
  border-radius: 6px; transition: all 0.15s;
}
.action-btn.edit { color: var(--primary); }
.action-btn.edit:hover { background: var(--primary-light); }
.action-btn.reset { color: var(--warning); }
.action-btn.reset:hover { background: rgba(245, 158, 11, 0.1); }
.action-btn.delete { color: var(--danger); }
.action-btn.delete:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); }
.action-btn.delete:disabled { color: var(--text-muted); cursor: not-allowed; }

/* 空状态 */
.empty-state {
  text-align: center; padding: 56px 20px;
  color: var(--text-secondary);
}
.empty-icon {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--bg-hover);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.empty-icon i { font-size: 32px; color: var(--text-muted); }
.empty-text { font-size: 14px; margin-bottom: 20px; }

/* 分页 */
.pagination-wrapper { padding: 16px 20px 20px; display: flex; justify-content: flex-end; }
.user-pagination ::v-deep .el-pagination { font-weight: 500; }

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
  font-size: 16px; font-weight: 600; color: var(--text-primary);
}
.modal-custom ::v-deep .el-dialog__body { padding: 20px 24px; }
.modal-custom ::v-deep .el-dialog__footer {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

/* 表单 */
.user-form, .import-form { margin-top: 8px; }

.form-input ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}
.form-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.form-select ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
}

.form-tip {
  font-size: 12px; color: var(--text-muted);
  margin-top: 6px;
  display: flex; align-items: flex-start; gap: 5px;
}
.form-tip i { font-size: 13px; margin-top: 1px; }

/* 状态单选 */
.status-radio { display: flex; gap: 12px; }
.status-radio ::v-deep .el-radio { margin-right: 0; }
.status-radio ::v-deep .el-radio__label { font-size: 13px; font-weight: 500; }

.radio-active ::v-deep .el-radio__input.is-checked + .el-radio__label { color: var(--success); }
.radio-disabled ::v-deep .el-radio__input.is-checked + .el-radio__label { color: var(--danger); }

.dialog-footer { display: flex; justify-content: flex-end; gap: 12px; }

.btn-submit {
  padding: 10px 28px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
}

/* 导入弹窗 */
.import-tip {
  border-radius: 10px; margin-bottom: 16px;
}
.import-tip ::v-deep .el-alert__content { padding-right: 0; }

.tip-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.tip-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 13px; color: var(--text-secondary);
}
.tip-item i { color: var(--primary); font-size: 14px; margin-top: 2px; }

.btn-template {
  color: var(--primary); font-weight: 500;
  padding: 0; height: auto;
}
.btn-template:hover { color: var(--primary-hover); }

.import-upload { margin-top: 4px; }
.upload-tip {
  font-size: 12px; color: var(--text-muted);
  margin-top: 6px;
}

.selected-file {
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px; padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: 8px; font-size: 13px;
}
.selected-file i { color: var(--primary); }
.file-name { color: var(--text-primary); font-weight: 500; }
.file-size { color: var(--text-muted); }
.btn-clear {
  padding: 0; margin-left: auto;
  color: var(--text-muted);
}
.btn-clear:hover { color: var(--danger); }

.btn-import-submit {
  padding: 10px 24px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--success), #16a34a);
  border: none;
}
.btn-import-submit:disabled {
  background: var(--text-muted); cursor: not-allowed;
}

/* 重置密码弹窗 */
.reset-content { display: flex; flex-direction: column; gap: 16px; }

.reset-tip {
  border-radius: 10px;
}
.reset-tip ::v-deep .el-alert__content { padding-right: 0; }

.reset-info { margin-top: 4px; }
.reset-info p {
  margin: 4px 0; font-size: 13px;
  color: var(--text-secondary);
}
.reset-info strong { color: var(--warning); }
.default-pwd {
  font-family: monospace; background: #fef3c7;
  padding: 2px 6px; border-radius: 4px;
}

.user-preview {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: var(--bg-hover);
  border-radius: 10px; border: 1px solid var(--border-color);
}
.preview-avatar {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; color: white;
}
.preview-info { display: flex; flex-direction: column; gap: 4px; }
.preview-username {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
}

.btn-reset-confirm {
  padding: 10px 24px; border-radius: 10px;
  font-weight: 500;
  background: var(--warning); border: none;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .user-manage {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --bg-hover: #334155;
    --border-color: #334155;
  }

  .filter-input ::v-deep .el-input__inner,
  .filter-select ::v-deep .el-input__inner,
  .form-input ::v-deep .el-input__inner {
    background: #334155; color: var(--text-primary);
  }

  .user-table ::v-deep .el-table { background: var(--bg-card); }
  .user-table ::v-deep .el-table__header-wrapper,
  .user-table ::v-deep .el-table__body-wrapper { background: var(--bg-card); }

  .btn-reset { border-color: #475569; }
  .btn-reset:hover { background: #334155; }

  .selected-file { background: #334155; }
  .user-preview { background: #334155; border-color: #475569; }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: flex-end; }
}

@media (max-width: 768px) {
  .user-manage { padding: 16px; }

  .filter-form {
    flex-direction: column; align-items: stretch;
  }
  .filter-form ::v-deep .el-form-item {
    width: 100%; margin-right: 0 !important; margin-bottom: 0;
  }
  .filter-input, .filter-select { width: 100%; }
  .filter-actions { width: 100%; justify-content: flex-end; margin-top: 8px; }

  .table-toolbar { flex-direction: column; align-items: flex-start; }
  .toolbar-left, .toolbar-stats { width: 100%; justify-content: space-between; }

  .user-cell { flex-wrap: wrap; }
  .user-email { max-width: 100%; }

  .action-buttons { flex-direction: column; gap: 4px; }

  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px; font-weight: 500;
}
::v-deep .el-table th.el-table__cell { background: #f8fafc !important; }
::v-deep .el-switch__core { border-radius: 10px; }
::v-deep .el-radio.is-bordered {
  border-radius: 8px; border: 2px solid var(--border-color);
  padding: 8px 16px; transition: all 0.2s;
}
::v-deep .el-radio.is-bordered:hover { border-color: var(--primary); }
::v-deep .el-dialog__headerbtn { top: 18px; right: 20px; }
::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}

/* ========== 隐藏表格表头的全选复选框 ========== */
.user-table ::v-deep .el-table__header-wrapper .el-table__cell:first-child .el-checkbox {
  display: none !important;
}
</style>