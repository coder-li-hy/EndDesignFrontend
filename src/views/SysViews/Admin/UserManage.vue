<template>
  <div class="user-manage">

    <!-- 页面标题 + 操作按钮 -->
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">
          添加用户
        </el-button>
        <el-button type="success" icon="el-icon-upload" @click="openImportDialog">
          批量导入
        </el-button>
        <el-button type="danger" icon="el-icon-delete" :disabled="!selectedIds.length" @click="handleBatchDelete">
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="用户名">
          <el-input
              v-model="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable>
            <el-option label="管理员" value="ADMIN" />
            <el-option label="教师" value="TEACHER" />
            <el-option label="学生" value="STUDENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" value="ACTIVE" />
            <el-option label="禁用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">
            搜索
          </el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户表格 -->
    <el-card class="table-card" shadow="never">
      <!-- 表格工具栏 -->
      <div class="table-toolbar">
        <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
        <span class="selected-count" v-if="selectedIds.length">
          已选择 {{ selectedIds.length }} 项
        </span>
      </div>

      <el-table
          ref="userTable"
          :data="userList"
          v-loading="loading"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />

        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="mini">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="120" />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
                v-model="row.status"
                :active-value="'ACTIVE'"
                :inactive-value="'DISABLED'"
                :active-color="'#13ce66'"
                :inactive-color="'#ff4949'"
                @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="160" align="center" />

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="text"
                @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
                size="mini"
                type="text"
                @click="handleResetPwd(row)"
            >
              重置密码
            </el-button>
            <el-button
                size="mini"
                type="text"
                :disabled="row.username === 'admin'"
            @click="handleDelete(row)">
              删除
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
            :page-sizes="[10, 20, 50, 100]"
            :page-size="size"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
        />
      </div>
    </el-card>

    <!-- 添加/编辑用户弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
        :visible.sync="dialogVisible"
        width="500px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">

        <el-form-item label="用户名" prop="username">
          <el-input
              v-model="form.username"
              :disabled="dialogType === 'edit'"
          placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input
              type="password"
              v-model="form.password"
              placeholder="请输入初始密码"
              show-password
          />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="教师" value="TEACHER" />
            <el-option label="学生" value="STUDENT" />
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="ACTIVE">正常</el-radio>
            <el-radio label="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
<!--    <el-dialog-->
<!--        title="批量导入用户"-->
<!--        :visible.sync="importDialogVisible"-->
<!--        width="450px"-->
<!--        :close-on-click-modal="false"-->
<!--    >-->
<!--      <el-alert-->
<!--          title="导入说明"-->
<!--          type="info"-->
<!--          :closable="false"-->
<!--          show-icon-->
<!--          class="import-tip"-->
<!--      >-->
<!--        <template #default>-->
<!--          <p>1. 请下载模板文件，按要求填写用户信息</p>-->
<!--          <p>2. 密码列可选，不填则使用默认密码 123456</p>-->
<!--          <p>3. 支持 .xlsx / .xls 格式，单次最多导入 100 条</p>-->
<!--        </template>-->
<!--      </el-alert>-->

<!--      <el-form label-width="100px" style="margin-top: 20px">-->
<!--        <el-form-item label="模板下载">-->
<!--          <el-button type="text" icon="el-icon-download" @click="downloadTemplate">-->
<!--            下载导入模板-->
<!--          </el-button>-->
<!--        </el-form-item>-->
<!--        <el-form-item label="选择文件" prop="file">-->
<!--          <el-upload-->
<!--              ref="uploadRef"-->
<!--              action="/admin/users/import"-->
<!--          :headers="uploadHeaders"-->
<!--          :before-upload="beforeUpload"-->
<!--          :on-success="handleImportSuccess"-->
<!--          :on-error="handleImportError"-->
<!--          :auto-upload="false"-->
<!--          :limit="1"-->
<!--          accept=".xlsx,.xls"-->
<!--          >-->
<!--          <el-button size="small" type="primary">选择文件</el-button>-->
<!--          <div slot="tip" class="el-upload__tip">-->
<!--            只能上传 excel 文件，且不超过 5MB-->
<!--          </div>-->
<!--          </el-upload>-->
<!--        </el-form-item>-->
<!--      </el-form>-->

<!--      <template #footer>-->
<!--        <el-button @click="importDialogVisible = false">取 消</el-button>-->
<!--        <el-button type="primary" :loading="importing" @click="submitImport">-->
<!--          {{ importing ? '导入中...' : '开始导入' }}-->
<!--        </el-button>-->
<!--      </template>-->
<!--    </el-dialog>-->
    <!-- 批量导入弹窗 -->
    <el-dialog
        title="批量导入用户"
        :visible.sync="importDialogVisible"
        width="450px"
        :close-on-click-modal="false"
    >
      <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          show-icon
          class="import-tip"
      >
        <template #default>
          <p>1. 请下载模板文件，按要求填写用户信息</p>
          <p>2. 密码列可选，不填则使用默认密码 123456</p>
          <p>3. 支持 .xlsx / .xls 格式，单次最多导入 100 条</p>
        </template>
      </el-alert>

      <div class="development-notice">
        <i class="el-icon-warning-outline"></i>
        <span>批量导入功能开发中，敬请期待...</span>
      </div>

      <template #footer>
        <el-button @click="importDialogVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
        title="重置密码"
        :visible.sync="resetPwdDialogVisible"
        width="400px"
        :close-on-click-modal="false"
    >
      <el-alert
          :title="`确定要重置用户「${resetPwdForm.username}」的密码吗？`"
          type="warning"
          :closable="false"
          show-icon
          class="reset-tip"
      >
        <template #default>
          <p>重置后密码将恢复为默认值：<strong>123456</strong></p>
          <p>用户下次登录时需修改密码</p>
        </template>
      </el-alert>

      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="resetting" @click="submitResetPwd">
          {{ resetting ? '处理中...' : '确 定' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>


import axios from "axios";

export default {
  name: 'UserManage',

  data() {
    // 自定义校验：手机号格式
    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback()  // 手机号非必填
      } else if (!/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号'))
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
      searchForm: {
        username: '',
        role: '',
        status: ''
      },

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
      dialogType: 'add',  // 'add' | 'edit'
      submitting: false,
      form: {
        userId: null,
        username: '',
        password: '',
        role: '',
        email: '',
        phone: '',
        status: 'ACTIVE'
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
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        email: [
          { validator: validateEmail, trigger: 'blur' }
        ],
        phone: [
          { validator: validatePhone, trigger: 'blur' }
        ]
      },

      // 批量导入弹窗
      importDialogVisible: false,
      importing: false,
      uploadHeaders: {
        // Token 由 axios 拦截器自动添加，这里不需要手动设置
      },

      // 重置密码弹窗
      resetPwdDialogVisible: false,
      resetting: false,
      resetPwdForm: {
        userId: null,
        username: ''
      }
    }
  },
  //
  // created() {
  //   this.fetchUsers()
  // },
  mounted() {
    this.fetchUsers()
  },
  methods: {
    // ========== 数据加载 ==========
    // 获取用户列表
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
        // ⭐ 添加调试输出
        console.log('=== 响应调试 ===')
        console.log('resp:', resp)
        console.log('resp.data:', resp.data)
        console.log('resp.code:', resp.code)
        console.log('resp.data?.code:', resp.data?.code)
        console.log('resp.data?.data?.records:', resp.data?.data?.records)
        console.log('================')
        if (resp.data.code === 1) {
          this.userList = resp.data.data.records
          this.total = resp.data.data.total
        }
      } finally {
        this.loading = false
      }
    },

    // 搜索
    handleSearch() {
      this.page = 1
      this.fetchUsers()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = { username: '', role: '', status: '' }
      this.handleSearch()
    },

    // 分页切换
    handlePageChange(newPage) {
      this.page = newPage
      this.fetchUsers()
    },

    // 每页数量切换
    handleSizeChange(newSize) {
      this.size = newSize
      this.page = 1
      this.fetchUsers()
    },

    // ========== 表格操作 ==========

    // 多选变化
    handleSelectionChange(selection) {
      this.selectedIds = selection.map(item => item.userId)
      // 更新全选状态
      this.selectAll = selection.length === this.userList.length && this.userList.length > 0
    },

    // 全选/取消全选
    handleSelectAll(checked) {
      if (checked) {
        // 选中所有（排除当前页已禁用的）
        this.$refs.userTable.toggleAllSelection()
      } else {
        this.$refs.userTable.clearSelection()
      }
    },

    // 状态切换（禁用/启用）
    async handleStatusChange(row) {
      const statusText = row.status === 'ACTIVE' ? '启用' : '禁用'
      try {
        await axios.put(`/api/admin/users/${row.userId}/status`, {
          status: row.status
        })
        this.$message.success(`用户${statusText}成功`)
      } catch (e) {
        // 失败则恢复原状态
        row.status = row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
        this.$message.error(`操作失败：${e.msg || '网络错误'}`)
      }
    },

    // ========== 添加/编辑 ==========

    // 打开添加弹窗
    openAddDialog() {
      this.dialogType = 'add'
      this.resetForm()
      this.dialogVisible = true
    },

    // 打开编辑弹窗
    handleEdit(row) {
      this.dialogType = 'edit'
      // 深拷贝，避免直接修改表格数据
      this.form = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },

    // 提交表单
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate()
      } catch {
        return
      }

      this.submitting = true
      try {
        if (this.dialogType === 'add') {
          await axios.post('/api/admin/users', this.form)
          this.$message.success('用户添加成功')
        } else {
          await axios.put(`/api/admin/users/${this.form.userId}`, this.form)
          this.$message.success('用户更新成功')
        }
        this.dialogVisible = false
        await this.fetchUsers()
      } catch (e) {
        this.$message.error(e.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    // 重置表单
    resetForm() {
      this.form = {
        userId: null,
        username: '',
        password: '',
        role: '',
        email: '',
        phone: '',
        status: 'ACTIVE'
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    },

    // 弹窗关闭时重置
    handleDialogClose() {
      this.resetForm()
    },

    // ========== 批量操作 ==========

    // 批量删除
    handleBatchDelete() {
      if (!this.selectedIds.length) {
        this.$message.warning('请先选择要删除的用户')
        return
      }

      this.$confirm(`确定要删除选中的 ${this.selectedIds.length} 个用户吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete('/api/admin/users/batch', {
            data: { userIds: this.selectedIds }
          })
          this.$message.success('删除成功')
          await this.fetchUsers()
        } catch (e) {
          this.$message.error(e.msg || '删除失败')
        }
      })
    },

    // 单个删除
    handleDelete(row) {
      if (row.username === 'admin') {
        this.$message.warning('管理员账号不能删除')
        return
      }

      this.$confirm(`确定要删除用户「${row.username}」吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete(`/api/admin/users/${row.userId}`)
          this.$message.success('删除成功')
          await this.fetchUsers()
        } catch (e) {
          this.$message.error(e.msg || '删除失败')
        }
      })
    },

    // ========== 重置密码 ==========

    // 打开重置密码弹窗
    handleResetPwd(row) {
      this.resetPwdForm = {
        userId: row.userId,
        username: row.username
      }
      this.resetPwdDialogVisible = true
    },

    // 提交重置密码
    async submitResetPwd() {
      this.resetting = true
      try {
        await axios.post(`/api/admin/users/${this.resetPwdForm.userId}/reset-pwd`)
        this.$message.success('密码已重置为 123456')
        this.resetPwdDialogVisible = false
      } catch (e) {
        this.$message.error(e.msg || '重置失败')
      } finally {
        this.resetting = false
      }
    },

    // ========== 批量导入 ==========
    // 该模块开发中

    // 打开导入弹窗
    openImportDialog() {
      this.importDialogVisible = true
    },

    // 下载模板
    downloadTemplate() {
      // 方式 1：后端提供模板下载接口
      window.open('/admin/users/template', '_blank')

      // 方式 2：前端静态文件（如果模板固定）
      // const link = document.createElement('a')
      // link.href = '/templates/user_import_template.xlsx'
      // link.download = '用户导入模板.xlsx'
      // link.click()
    },

    // 上传前校验
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.malformations-office document.spreadsheet.sheet' ||
          file.type === 'application/vnd.ms-excel'
      const isLt5M = file.size / 1024 / 1024 < 5

      if (!isExcel) {
        this.$message.error('只能上传 Excel 文件!')
        return false
      }
      if (!isLt5M) {
        this.$message.error('文件大小不能超过 5MB!')
        return false
      }
      return true
    },

    // 导入成功回调
    handleImportSuccess(response) {
      if (response.code === 1) {
        this.$message.success(`导入成功，新增 ${response.data.successCount} 条，失败 ${response.data.failCount} 条`)
        this.importDialogVisible = false
        this.fetchUsers()
      } else {
        this.$message.error(response.msg || '导入失败')
      }
    },

    // 导入失败回调
    handleImportError() {
      this.$message.error('文件上传失败，请检查网络或文件格式')
    },

    // 提交导入
    submitImport() {
      const file = this.$refs.uploadRef.uploadFiles[0]
      if (!file) {
        this.$message.warning('请先选择文件')
        return
      }

      this.importing = true
      // 手动触发上传
      this.$refs.uploadRef.submit()
    },

    // ========== 工具方法 ==========

    // 角色中文显示
    getRoleText(role) {
      const map = {
        'ADMIN': '管理员',
        'TEACHER': '教师',
        'STUDENT': '学生'
      }
      return map[role] || role
    },

    // 角色标签颜色
    getRoleTagType(role) {
      const map = {
        'ADMIN': 'danger',
        'TEACHER': 'warning',
        'STUDENT': 'success'
      }
      return map[role] || 'info'
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式 ========== */
.user-manage {
  padding: 0;
}
.import-tip {
  margin-bottom: 20px;
}

.development-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: #909399;
  font-size: 16px;
}

.development-notice i {
  margin-right: 8px;
  font-size: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
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

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ========== 弹窗样式 ========== */
.import-tip,
.reset-tip {
  margin-bottom: 15px;
}

.import-tip p,
.reset-tip p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

.reset-tip strong {
  color: #e6a23c;
}

.el-upload__tip {
  font-size: 12px;
  color: #999;
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .table-toolbar {
    flex-wrap: wrap;
  }
}
</style>



<!-- src/views/SysViews/Admin/UserManage.vue -->
<!--<template>-->
<!--  <div style="padding: 20px;">-->
<!--    <h2>✅ 用户管理页面 - 测试成功！</h2>-->
<!--    <p>当前路由：{{ $route.path }}</p>-->
<!--    <p>当前用户：{{ userInfo?.username || '未登录' }}</p>-->
<!--  </div>-->
<!--</template>-->

<!--<script>-->
<!--export default {-->
<!--  name: 'UserManage',-->
<!--  data() {-->
<!--    return {-->
<!--      userInfo: JSON.parse(sessionStorage.getItem('userInfo') || '{}')-->
<!--    }-->
<!--  }-->
<!--}-->
<!--</script>-->