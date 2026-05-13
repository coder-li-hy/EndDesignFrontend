<template>
  <div class="system-config">

    <!-- 页面标题 + 操作按钮 -->
<!--    <div class="page-header">-->
<!--      <h2 class="page-title">系统配置</h2>-->
<!--      <div class="header-actions">-->
<!--        <el-button type="primary" icon="el-icon-plus" @click="openAddDialog">-->
<!--          添加配置-->
<!--        </el-button>-->
<!--        <el-button type="success" icon="el-icon-refresh" @click="handleRefresh">-->
<!--          刷新缓存-->
<!--        </el-button>-->
<!--      </div>-->
<!--    </div>-->

    <!-- 搜索过滤区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="配置键">
          <el-input
              v-model="searchForm.configKey"
              placeholder="如：open_selection"
              clearable
              @keyup.enter.native="handleSearch"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
              v-model="searchForm.description"
              placeholder="输入描述关键词"
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

    <!-- 配置列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
          :data="configList"
          v-loading="loading"
          border
          style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />

        <!-- 配置键 -->
        <el-table-column prop="configKey" label="配置键" min-width="180">
          <template #default="{ row }">
            <span class="config-key">{{ row.configKey }}</span>
            <el-tag
                size="mini"
                :type="getConfigTagType(row.configKey)"
                style="margin-left: 8px"
            >
              {{ getConfigTagText(row.configKey) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 配置值（开关型直接操作，其他类型点击编辑） -->
        <el-table-column label="配置值" min-width="200">
          <template #default="{ row }">
            <!-- 开关型配置：直接显示 Switch -->
            <el-switch
                v-if="isSwitchConfig(row.configKey)"
                v-model="row.configValue"
                :active-value="'1'"
                :inactive-value="'0'"
                :active-color="'#13ce66'"
                :inactive-color="'#ff4949'"
                @change="handleValueChange(row)"
            />

            <!-- 其他类型：点击编辑 -->
            <template v-else>
              <span v-if="!row.editing" class="config-value" @click="startEdit(row)">
                {{ row.configValue || '-' }}
                <i class="el-icon-edit" style="margin-left: 4px; color: #667eea; cursor: pointer" />
              </span>
              <el-input
                  v-else
                  v-model="row.configValue"
                  size="mini"
                  style="width: 150px"
                  @blur="stopEdit(row)"
                  @keyup.enter.native="stopEdit(row)"
                  autofocus
              />
            </template>
          </template>
        </el-table-column>

        <!-- 描述 -->
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />

        <!-- 操作 -->
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
                size="mini"
                type="text"
                @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
                size="mini"
                type="text"
                :disabled="isSystemConfig(row.configKey)"
                @click="handleDelete(row)"
            >
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

    <!-- 添加/编辑配置弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '添加配置' : '编辑配置'"
        :visible.sync="dialogVisible"
        width="500px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">

        <el-form-item label="配置键" prop="configKey">
          <el-input
              v-model="form.configKey"
              :disabled="dialogType === 'edit'"
              placeholder="如：open_selection"
              maxlength="50"
          />
          <div class="form-tip">小写字母 + 下划线，全局唯一</div>
        </el-form-item>

        <el-form-item label="配置值" prop="configValue">
          <!-- 开关型 -->
          <el-switch
              v-if="isSwitchConfig(form.configKey)"
              v-model="form.configValue"
              :active-value="'1'"
              :inactive-value="'0'"
              active-text="开启"
              inactive-text="关闭"
          />
          <!-- 其他类型 -->
          <el-input
              v-else
              v-model="form.configValue"
              type="textarea"
              :rows="3"
              placeholder="请输入配置值"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入配置项的描述说明"
              maxlength="200"
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
  name: 'SystemConfig',

  data() {
    // 自定义校验：配置键格式
    const validateConfigKey = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入配置键'))
      } else if (!/^[a-z][a-z0-9_]*$/.test(value)) {
        callback(new Error('配置键必须是小写字母开头，可包含小写字母、数字、下划线'))
      } else {
        callback()
      }
    }

    return {
      // 搜索条件
      searchForm: {
        configKey: '',
        description: ''
      },

      // 表格数据
      loading: false,
      configList: [],
      page: 1,
      size: 10,
      total: 0,

      // 添加/编辑弹窗
      dialogVisible: false,
      dialogType: 'add',  // 'add' | 'edit'
      submitting: false,
      form: {
        configId: null,
        configKey: '',
        configValue: '',
        description: ''
      },
      rules: {
        configKey: [
          { required: true, validator: validateConfigKey, trigger: 'blur' }
        ],
        configValue: [
          { required: true, message: '请输入配置值', trigger: 'blur' }
        ],
        description: [
          { max: 200, message: '描述不能超过 200 字', trigger: 'blur' }
        ]
      },

      // 预定义的系统配置（用于显示和校验）
      systemConfigs: {
        'GLOBAL_SELECTION_SWITCH': { label: '全局选课开关', type: 'switch' },
        'SUBMISSION_LOCK': { label: '作业提交锁定', type: 'switch' },
        'MAINTENANCE_MODE': { label: '系统维护模式', type: 'switch' }
      }
    }
  },

  created() {
    this.fetchConfigs()
  },

  methods: {
    // ========== 数据加载 ==========

    // 获取配置列表
    async fetchConfigs() {
      this.loading = true
      try {
        const resp = await axios.get('/api/admin/config', {
          params: {
            configKey: this.searchForm.configKey,
            description: this.searchForm.description,
            page: this.page,
            size: this.size
          }
        })
        if (resp.data.code === 1) {
          this.configList = resp.data.data.records || []
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch configs error:', e)
        this.$message.error('加载配置列表失败')
      } finally {
        this.loading = false
      }
    },

    // 搜索
    handleSearch() {
      this.page = 1
      this.fetchConfigs()
    },

    // 重置搜索
    handleReset() {
      this.searchForm = { configKey: '', description: '' }
      this.handleSearch()
    },

    // 分页切换
    handlePageChange(newPage) {
      this.page = newPage
      this.fetchConfigs()
    },

    // 每页数量切换
    handleSizeChange(newSize) {
      this.size = newSize
      this.page = 1
      this.fetchConfigs()
    },

    // 刷新缓存（预留：开发中）
    handleRefresh() {
      this.$message.info('🔄 配置缓存功能开发中，敬请期待...')
      // 后续实现：
      // await axios.post('/api/admin/config/refresh')
      // this.$message.success('缓存已刷新')
    },

    // ========== 表格内直接修改配置值 ==========

    // 开关型配置值变化时自动保存
    async handleValueChange(row) {
      if (this.isSystemConfig(row.configKey)) {
        // 系统配置修改需要确认
        const confirmText = this.systemConfigs[row.configKey]?.label || row.configKey
        await this.$confirm(`确定要${row.configValue === '1' ? '开启' : '关闭'}「${confirmText}」吗？`, '提示', {
          type: 'warning',
          confirmButtonText: '确定',
          cancelButtonText: '取消'
        })
      }

      try {
        await axios.put(`/api/admin/config/${row.configId}`, {
          configValue: row.configValue
        })
        this.$message.success('配置已更新')
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '更新失败')
        // 恢复原值（简化：重新加载）
        this.fetchConfigs()
      }
    },

    // 开始编辑（文本型）
    startEdit(row) {
      if (this.isSystemConfig(row.configKey)) {
        this.$message.warning('系统核心配置请通过编辑弹窗修改')
        return
      }
      row.editing = true
      row.originalValue = row.configValue  // 备份原值
    },

    // 停止编辑（保存或取消）
    async stopEdit(row) {
      row.editing = false

      // 值没变则不保存
      if (row.configValue === row.originalValue) {
        delete row.originalValue
        return
      }

      try {
        await axios.put(`/api/admin/config/${row.configId}`, {
          configValue: row.configValue
        })
        this.$message.success('配置已更新')
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '更新失败')
        // 恢复原值
        row.configValue = row.originalValue
      } finally {
        delete row.originalValue
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
    openEditDialog(row) {
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
        const submitData = {
          configKey: this.form.configKey,
          configValue: this.form.configValue,
          description: this.form.description
        }

        if (this.dialogType === 'add') {
          await axios.post('/api/admin/config', submitData)
          this.$message.success('配置添加成功')
        } else {
          await axios.put(`/api/admin/config/${this.form.configId}`, submitData)
          this.$message.success('配置更新成功')
        }
        this.dialogVisible = false
        this.fetchConfigs()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    // 重置表单
    resetForm() {
      this.form = {
        configId: null,
        configKey: '',
        configValue: '',
        description: ''
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    },

    // 弹窗关闭时重置
    handleDialogClose() {
      this.resetForm()
    },

    // ========== 删除 ==========

    // 单个删除
    handleDelete(row) {
      if (this.isSystemConfig(row.configKey)) {
        this.$message.warning('系统核心配置不能删除')
        return
      }

      this.$confirm(`确定要删除配置「${row.configKey}」吗？`, '提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await axios.delete(`/api/admin/config/${row.configId}`)
          this.$message.success('删除成功')
          this.fetchConfigs()
        } catch (e) {
          this.$message.error(e.response?.data?.msg || '删除失败')
        }
      })
    },

    // ========== 工具方法 ==========

    // 判断是否为开关型配置
    isSwitchConfig(configKey) {
      return this.systemConfigs[configKey]?.type === 'switch' ||
          ['GLOBAL_SELECTION_SWITCH', 'SUBMISSION_LOCK', 'MAINTENANCE_MODE'].includes(configKey)
    },

    // 判断是否为系统核心配置（保护：不能删除/直接编辑）
    isSystemConfig(configKey) {
      return Object.keys(this.systemConfigs).includes(configKey)
    },

    // 获取配置标签类型（用于 el-tag 颜色）
    getConfigTagType(configKey) {
      if (this.isSystemConfig(configKey)) {
        return 'danger'  // 系统配置用红色标签
      }
      return 'info'
    },

    // 获取配置标签文字
    getConfigTagText(configKey) {
      return this.systemConfigs[configKey]?.label || '自定义'
    }
  }
}
</script>

<style scoped>
/* ========== 页面整体样式（复用 LoginView 风格）========== */
.system-config {
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
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* ========== 搜索区 ========== */
.filter-card {
  margin: 0 20px 20px 20px;
}

/* ========== 表格区 ========== */
.table-card {
  margin: 0 20px 20px 20px;
}

/* 配置键样式 */
.config-key {
  font-family: monospace;
  font-weight: 500;
  color: #667eea;
}

/* 配置值样式 */
.config-value {
  cursor: pointer;
  color: #606266;
  display: inline-flex;
  align-items: center;
}

.config-value:hover {
  color: #667eea;
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

  .header-actions {
    width: 100%;
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