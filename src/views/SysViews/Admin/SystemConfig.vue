<template>
  <div class="system-config">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题 + 操作按钮 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-setting"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">系统配置</h2>
          <p class="page-subtitle">管理系统全局参数，实时生效</p>
        </div>
      </div>
      <div class="header-actions">
<!--        <el-button-->
<!--            type="primary"-->
<!--            icon="el-icon-plus"-->
<!--            @click="openAddDialog"-->
<!--            class="btn-add"-->
<!--        >-->
<!--          添加配置-->
<!--        </el-button>-->
      </div>
    </div>


    <!-- 配置列表 -->
    <el-card class="table-card" shadow="never">
      <!-- 列表统计 -->
      <div class="table-summary" v-if="configList.length > 0">
<!--        <span class="summary-text">-->
<!--          共 <strong>{{ total }}</strong> 条配置，-->
<!--          <el-tag size="mini" type="danger" effect="plain">{{ systemCount }} 系统</el-tag>-->
<!--          <el-tag size="mini" effect="plain" style="margin-left: 6px">{{ customCount }} 自定义</el-tag>-->
<!--        </span>-->

      </div>

      <el-table
          :data="configList"
          v-loading="loading"
          border
          style="width: 100%"
          :header-cell-style="{ background: '#f8fafc', color: '#475569', fontWeight: 600 }"
          :row-style="getRowStyle"
          class="config-table"
      >
        <el-table-column type="index" label="序号" width="70" align="center">
          <template #default="{ $index }">
            <span class="row-index">{{ ($index + 1) + (page - 1) * size }}</span>
          </template>
        </el-table-column>

        <!-- 配置键 -->
        <el-table-column prop="configKey" label="配置键" min-width="200">
          <template #default="{ row }">
            <div class="config-key-cell">
              <span class="config-key">{{ row.configKey }}</span>
              <el-tag
                  size="mini"
                  :type="getConfigTagType(row.configKey)"
                  :effect="isSystemConfig(row.configKey) ? 'dark' : 'light'"
                  class="config-tag"
              >
                <i :class="isSystemConfig(row.configKey) ? 'el-icon-s-flag' : 'el-icon-cpu'"></i>
                {{ getConfigTagText(row.configKey) }}
              </el-tag>
              <el-tooltip
                  v-if="isSystemConfig(row.configKey)"
                  content="系统核心配置，修改需谨慎"
                  placement="top"
              >
                <i class="el-icon-warning-outline system-badge"></i>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <!-- 配置值 -->
        <el-table-column label="配置值" min-width="220">
          <template #default="{ row }">
            <!-- 开关型配置 -->
            <el-switch
                v-if="isSwitchConfig(row.configKey)"
                v-model="row.configValue"
                :active-value="'1'"
                :inactive-value="'0'"
                :active-color="'var(--success)'"
                :inactive-color="'var(--danger)'"
                :disabled="submitting"
                @change="handleValueChange(row)"
                class="config-switch"
            >
              <template #active>
                <i class="el-icon-check" style="font-size: 12px"></i>
              </template>
              <template #inactive>
                <i class="el-icon-close" style="font-size: 12px"></i>
              </template>
            </el-switch>

            <!-- 文本型配置：行内编辑 -->
            <template v-else>
              <div class="value-editor">
                <span
                    v-if="!row.editing"
                    class="config-value"
                    @click="startEdit(row)"
                    :class="{ 'value-empty': !row.configValue }"
                >
                  {{ row.configValue || '—' }}
                  <i class="el-icon-edit edit-icon" v-if="!isSystemConfig(row.configKey)"></i>
                </span>
                <div v-else class="edit-input-wrapper">
                  <el-input
                      v-model="row.configValue"
                      size="mini"
                      placeholder="请输入配置值"
                      @blur="stopEdit(row)"
                      @keyup.enter.native="stopEdit(row)"
                      @keyup.esc.native="cancelEdit(row)"
                      autofocus
                      class="edit-input"
                  />
                  <div class="edit-actions">
                    <el-button size="mini" type="success" icon="el-icon-check" @click="stopEdit(row)" circle class="btn-save" />
                    <el-button size="mini" type="info" icon="el-icon-close" @click="cancelEdit(row)" circle class="btn-cancel" />
                  </div>
                </div>
              </div>
            </template>
          </template>
        </el-table-column>

        <!-- 描述 -->
        <el-table-column prop="description" label="描述" min-width="280">
          <template #default="{ row }">
            <span class="config-desc" :class="{ 'desc-empty': !row.description }">
              {{ row.description || '—' }}
            </span>
          </template>
        </el-table-column>

        <!-- 最后修改 -->
        <el-table-column label="最后修改" width="150" align="center">
          <template #default="{ row }">
            <div class="update-info">
              <span class="update-time">{{ formatUpdateTime(row.updateTime) }}</span>
              <span class="update-user" v-if="row.updateBy">· {{ row.updateBy }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                  size="mini"
                  type="text"
                  @click="openEditDialog(row)"
                  class="action-btn edit"
                  :disabled="submitting"
              >
                <i class="el-icon-edit"></i> 编辑
              </el-button>
              <el-button
                  size="mini"
                  type="text"
                  :disabled="isSystemConfig(row.configKey) || submitting"
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
      <div v-if="!loading && configList.length === 0" class="empty-state">
        <div class="empty-icon">
          <i class="el-icon-setting"></i>
        </div>
        <p class="empty-text">暂无符合条件的配置项</p>
        <el-button size="small" type="primary" @click="openAddDialog" icon="el-icon-plus">
          添加第一个配置
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
            class="config-pagination"
        />
      </div>
    </el-card>

    <!-- 添加/编辑配置弹窗 -->
    <el-dialog
        :title="dialogType === 'add' ? '✨ 添加配置' : '✏️ 编辑配置'"
        :visible.sync="dialogVisible"
        width="520px"
        :close-on-click-modal="false"
        @closed="handleDialogClose"
        class="config-dialog"
        custom-class="modal-custom"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="95px" class="config-form">

        <!-- 配置键 -->
        <el-form-item label="配置键" prop="configKey">
          <el-input
              v-model="form.configKey"
              :disabled="dialogType === 'edit'"
              placeholder="如：open_selection"
              maxlength="50"
              show-word-limit
              class="form-input"
              :prefix-icon="dialogType === 'edit' ? 'el-icon-lock' : 'el-icon-key'"
          />
          <div class="form-tip">
            <i class="el-icon-info"></i>
            小写字母 + 下划线，全局唯一，如：feature_flag_xxx
          </div>
        </el-form-item>

        <!-- 配置值 -->
        <el-form-item label="配置值" prop="configValue">
          <!-- 开关型 -->
          <el-switch
              v-if="isSwitchConfig(form.configKey)"
              v-model="form.configValue"
              :active-value="'1'"
              :inactive-value="'0'"
              active-text="开启"
              inactive-text="关闭"
              class="form-switch"
          />
          <!-- 文本型 -->
          <el-input
              v-else
              v-model="form.configValue"
              type="textarea"
              :rows="4"
              placeholder="请输入配置值，支持多行文本..."
              maxlength="500"
              show-word-limit
              class="form-textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
          />
          <!-- 配置值示例提示 -->
          <div class="form-tip value-tip" v-if="!isSwitchConfig(form.configKey)">
            <i class="el-icon-lightbulb"></i>
            数字、字符串或 JSON 格式，如：{"timeout": 30}
          </div>
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="描述" prop="description">
          <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入配置项的作用说明，便于团队理解..."
              maxlength="200"
              show-word-limit
              class="form-textarea"
          />
        </el-form-item>

        <!-- 系统配置提示 -->
        <el-alert
            v-if="isSystemConfig(form.configKey)"
            title="⚠️ 系统核心配置"
            type="warning"
            :closable="false"
            show-icon
            class="system-alert"
        >
          <template #default>
            <p>修改此配置可能影响系统核心功能，请确保已充分测试</p>
          </template>
        </el-alert>

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

    <!-- 删除确认弹窗 -->
    <el-dialog
        title="🗑️ 确认删除"
        :visible.sync="deleteDialogVisible"
        width="420px"
        :close-on-click-modal="false"
        class="delete-dialog"
        custom-class="modal-custom"
    >
      <div class="delete-content">
        <div class="delete-icon">
          <i class="el-icon-warning-outline"></i>
        </div>
        <p class="delete-text">
          确定要删除配置 <strong>"{{ deleteTarget?.configKey }}"</strong> 吗？
        </p>
        <p class="delete-subtext">
          此操作不可恢复，删除后相关功能可能受影响
        </p>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deleteDialogVisible = false" :disabled="deleting">
            取 消
          </el-button>
          <el-button
              type="danger"
              :loading="deleting"
              @click="confirmDelete"
              class="btn-delete-confirm"
          >
            {{ deleting ? '删除中...' : '确 定 删 除' }}
          </el-button>
        </div>
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
      searchForm: { configKey: '', description: '' },

      // 表格数据
      loading: false,
      configList: [],
      page: 1,
      size: 10,
      total: 0,

      // 刷新状态
      refreshing: false,

      // 添加/编辑弹窗
      dialogVisible: false,
      dialogType: 'add',
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

      // 删除弹窗
      deleteDialogVisible: false,
      deleting: false,
      deleteTarget: null,

      // 预定义的系统配置
      systemConfigs: {
        'GLOBAL_SELECTION_SWITCH': { label: '全局选课开关', type: 'switch', protected: true },
        'SUBMISSION_LOCK': { label: '作业提交锁定', type: 'switch', protected: true },
        'MAINTENANCE_MODE': { label: '系统维护模式', type: 'switch', protected: true }
      }
    }
  },

  computed: {
    // 系统配置数量
    systemCount() {
      return this.configList.filter(item => this.isSystemConfig(item.configKey)).length
    },
    // 自定义配置数量
    customCount() {
      return this.configList.filter(item => !this.isSystemConfig(item.configKey)).length
    }
  },

  created() {
    this.fetchConfigs()
  },

  methods: {
    // ========== 数据加载 ==========
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
          this.configList = (resp.data.data.records || []).map(item => ({
            ...item,
            editing: false,
            originalValue: item.configValue
          }))
          this.total = resp.data.data.total || 0
        }
      } catch (e) {
        console.error('Fetch configs error:', e)
        this.$message.error('加载配置列表失败')
      } finally {
        this.loading = false
      }
    },

    handleSearch() { this.page = 1; this.fetchConfigs() },

    handleReset() {
      this.searchForm = { configKey: '', description: '' }
      this.handleSearch()
    },

    handlePageChange(newPage) { this.page = newPage; this.fetchConfigs() },

    handleSizeChange(newSize) { this.size = newSize; this.page = 1; this.fetchConfigs() },

    // 刷新缓存
    async handleRefresh() {
      if (this.refreshing) return
      this.refreshing = true
      try {
        // 模拟刷新延迟
        await new Promise(resolve => setTimeout(resolve, 800))
        // 实际调用: await axios.post('/api/admin/config/refresh')
        await this.fetchConfigs()
        this.$message.success('✅ 配置缓存已刷新')
      } catch (e) {
        this.$message.error('刷新失败，请重试')
      } finally {
        this.refreshing = false
      }
    },

    // 导出配置（预留功能）
    exportConfigs() {
      this.$message.info('📥 导出功能开发中，敬请期待...')
    },

    // 行样式：系统配置行高亮
    getRowStyle({ row }) {
      if (this.isSystemConfig(row.configKey)) {
        return { background: 'rgba(239, 68, 68, 0.03)' }
      }
      return {}
    },

    // ========== 表格内直接修改 ==========
    async handleValueChange(row) {
      if (this.isSystemConfig(row.configKey)) {
        const confirmText = this.systemConfigs[row.configKey]?.label || row.configKey
        const actionText = row.configValue === '1' ? '开启' : '关闭'
        await this.$confirm(
            `确定要${actionText}「${confirmText}」吗？\n此操作可能影响系统核心功能`,
            '⚠️ 系统配置变更',
            {
              type: 'warning',
              confirmButtonText: '确定变更',
              cancelButtonText: '取消',
              distinguishCancelAndClose: true
            }
        )
      }

      try {
        await axios.put(`/api/admin/config/${row.configId}`, {
          configValue: row.configValue
        })
        this.$message.success('✅ 配置已更新')
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '更新失败')
        this.fetchConfigs() // 恢复原值
      }
    },

    startEdit(row) {
      if (this.isSystemConfig(row.configKey)) {
        this.$message.warning('系统核心配置请通过编辑弹窗修改')
        return
      }
      row.editing = true
      row.originalValue = row.configValue
    },

    async stopEdit(row) {
      row.editing = false
      if (row.configValue === row.originalValue) {
        delete row.originalValue
        return
      }
      try {
        await axios.put(`/api/admin/config/${row.configId}`, {
          configValue: row.configValue
        })
        this.$message.success('✅ 配置已更新')
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '更新失败')
        row.configValue = row.originalValue
      } finally {
        delete row.originalValue
      }
    },

    cancelEdit(row) {
      row.configValue = row.originalValue
      row.editing = false
      delete row.originalValue
    },

    // ========== 添加/编辑 ==========
    openAddDialog() {
      this.dialogType = 'add'
      this.resetForm()
      this.dialogVisible = true
    },

    openEditDialog(row) {
      this.dialogType = 'edit'
      this.form = JSON.parse(JSON.stringify(row))
      this.dialogVisible = true
    },

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
          this.$message.success('✅ 配置添加成功')
        } else {
          await axios.put(`/api/admin/config/${this.form.configId}`, submitData)
          this.$message.success('✅ 配置更新成功')
        }
        this.dialogVisible = false
        this.fetchConfigs()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '操作失败')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.form = { configId: null, configKey: '', configValue: '', description: '' }
      this.$refs.formRef?.resetFields()
    },

    handleDialogClose() {
      this.resetForm()
    },

    // ========== 删除 ==========
    handleDelete(row) {
      if (this.isSystemConfig(row.configKey)) {
        this.$message.warning('🔒 系统核心配置不能删除')
        return
      }
      this.deleteTarget = row
      this.deleteDialogVisible = true
    },

    async confirmDelete() {
      if (!this.deleteTarget) return
      this.deleting = true
      try {
        await axios.delete(`/api/admin/config/${this.deleteTarget.configId}`)
        this.$message.success('✅ 删除成功')
        this.deleteDialogVisible = false
        this.fetchConfigs()
      } catch (e) {
        this.$message.error(e.response?.data?.msg || '删除失败')
      } finally {
        this.deleting = false
        this.deleteTarget = null
      }
    },

    // ========== 工具方法 ==========
    isSwitchConfig(configKey) {
      return this.systemConfigs[configKey]?.type === 'switch' ||
          ['GLOBAL_SELECTION_SWITCH', 'SUBMISSION_LOCK', 'MAINTENANCE_MODE'].includes(configKey)
    },

    isSystemConfig(configKey) {
      return Object.keys(this.systemConfigs).includes(configKey)
    },

    getConfigTagType(configKey) {
      return this.isSystemConfig(configKey) ? 'danger' : 'info'
    },

    getConfigTagText(configKey) {
      return this.systemConfigs[configKey]?.label || '自定义'
    },

    formatUpdateTime(time) {
      if (!time) return '-'
      // 支持多种时间格式
      const date = new Date(time)
      if (isNaN(date.getTime())) return time.substring(0, 16)
      return date.toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).replace(/\//g, '-')
    }
  }
}
</script>

<style scoped>
/* ========== CSS 变量 ========== */
.system-config {
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
  display: flex; gap: 12px;
}

.btn-add {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none; padding: 10px 24px;
  border-radius: 10px; font-weight: 500;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transition: all 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
}

.btn-refresh {
  padding: 10px 22px; border-radius: 10px;
  border: 2px solid var(--success);
  color: var(--success); font-weight: 500;
  background: rgba(34, 197, 94, 0.08);
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--success); color: white;
  transform: translateY(-1px);
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

.filter-icon {
  font-size: 16px; color: var(--primary);
}

.filter-title {
  font-size: 14px; font-weight: 600;
  color: var(--text-primary);
}

.filter-form {
  padding: 16px 20px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-input {
  width: 200px;
}

.filter-input ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
  background: #f8fafc;
}

.filter-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.filter-actions {
  margin-left: auto;
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
  transition: all 0.2s;
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

.table-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-hover);
  border-radius: 16px 16px 0 0;
}

.summary-text {
  font-size: 13px; color: var(--text-secondary);
}

.summary-text strong {
  color: var(--text-primary); font-weight: 600;
}

.btn-export {
  font-size: 12px; color: var(--primary);
  padding: 4px 10px;
}

.btn-export:hover {
  background: var(--primary-light);
  border-radius: 6px;
}

/* 表格样式 */
.config-table ::v-deep .el-table__row {
  transition: background 0.15s;
}

.config-table ::v-deep .el-table__row:hover {
  background: rgba(79, 70, 229, 0.04) !important;
}

/* 序号 */
.row-index {
  font-weight: 500; color: var(--text-secondary);
}

/* 配置键单元格 */
.config-key-cell {
  display: flex; align-items: center; gap: 8px;
}

.config-key {
  font-family: 'Fira Code', monospace;
  font-weight: 600; color: var(--primary);
  font-size: 14px;
}

.config-tag {
  font-size: 11px; padding: 2px 8px;
  border-radius: 5px; font-weight: 500;
}

.system-badge {
  color: var(--warning); font-size: 14px;
  margin-left: 4px; cursor: help;
}

/* 配置值单元格 */
.value-editor {
  display: flex; align-items: center;
}

.config-value {
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.config-value:hover:not(.value-empty) {
  background: var(--primary-light);
  color: var(--primary);
}

.config-value.value-empty {
  color: var(--text-muted);
  font-style: italic;
}

.edit-icon {
  color: var(--text-muted);
  font-size: 13px;
  opacity: 0;
  transition: opacity 0.15s;
}

.config-value:hover .edit-icon {
  opacity: 1;
}

.edit-input-wrapper {
  display: flex; align-items: center; gap: 8px;
}

.edit-input {
  flex: 1;
}

.edit-input ::v-deep .el-input__inner {
  border-radius: 8px;
  border: 2px solid var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.edit-actions {
  display: flex; gap: 4px;
}

.btn-save, .btn-cancel {
  width: 28px; height: 28px;
  padding: 0; border-radius: 6px;
}

.btn-save {
  background: var(--success); border: none;
  color: white;
}

.btn-cancel {
  background: #e2e8f0; border: none;
  color: #64748b;
}

/* Switch 样式 */
.config-switch ::v-deep .el-switch__label {
  font-size: 11px; font-weight: 500;
}

/* 描述 */
.config-desc {
  font-size: 13px; color: var(--text-secondary);
  line-height: 1.5;
}

.config-desc.desc-empty {
  color: var(--text-muted); font-style: italic;
}

/* 最后修改 */
.update-info {
  display: flex; flex-direction: column; gap: 2px;
  font-size: 12px; color: var(--text-muted);
}

.update-time {
  font-weight: 500; color: var(--text-secondary);
}

.update-user {
  font-size: 11px;
}

/* 操作按钮 */
.action-buttons {
  display: flex; justify-content: center; gap: 2px;
}

.action-btn {
  font-size: 12px; padding: 4px 8px;
  border-radius: 6px; transition: all 0.15s;
}

.action-btn.edit { color: var(--primary); }
.action-btn.edit:hover { background: var(--primary-light); }

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

.empty-icon i {
  font-size: 32px; color: var(--text-muted);
}

.empty-text {
  font-size: 14px; margin-bottom: 20px;
}

/* 分页 */
.pagination-wrapper {
  padding: 16px 20px 20px;
  display: flex; justify-content: flex-end;
}

.config-pagination ::v-deep .el-pagination {
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

/* 表单样式 */
.config-form {
  margin-top: 8px;
}

.form-input ::v-deep .el-input__inner,
.form-textarea ::v-deep .el-textarea__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}

.form-input ::v-deep .el-input__inner:focus,
.form-textarea ::v-deep .el-textarea__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
}

.form-tip {
  font-size: 12px; color: var(--text-muted);
  margin-top: 6px;
  display: flex; align-items: flex-start; gap: 5px;
}

.form-tip i {
  font-size: 13px; margin-top: 1px;
}

.value-tip {
  color: var(--warning);
}

.form-switch {
  margin-top: 4px;
}

.system-alert {
  margin-top: 12px;
  border-radius: 10px;
}

.system-alert ::v-deep .el-alert__content {
  padding-right: 0;
}

.system-alert p {
  margin: 4px 0 0; font-size: 13px;
  color: var(--text-secondary);
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 12px;
}

.btn-submit {
  padding: 10px 28px; border-radius: 10px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  border: none;
}

/* 删除弹窗 */
.delete-content {
  text-align: center;
  padding: 8px 0;
}

.delete-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.12);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}

.delete-icon i {
  font-size: 24px; color: var(--danger);
}

.delete-text {
  font-size: 15px; color: var(--text-primary);
  margin: 0 0 8px; font-weight: 500;
}

.delete-text strong {
  color: var(--primary); font-family: monospace;
}

.delete-subtext {
  font-size: 13px; color: var(--text-muted);
  margin: 0;
}

.btn-delete-confirm {
  padding: 10px 24px; border-radius: 10px;
  font-weight: 500;
  background: var(--danger); border: none;
}

/* ========== 暗黑模式 ========== */
@media (prefers-color-scheme: dark) {
  .system-config {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --bg-card: #1e293b;
    --bg-hover: #334155;
    --border-color: #334155;
  }

  .filter-input ::v-deep .el-input__inner,
  .form-input ::v-deep .el-input__inner,
  .form-textarea ::v-deep .el-textarea__inner {
    background: #334155; color: var(--text-primary);
  }

  .config-table ::v-deep .el-table {
    background: var(--bg-card);
  }

  .config-table ::v-deep .el-table__header-wrapper,
  .config-table ::v-deep .el-table__body-wrapper {
    background: var(--bg-card);
  }

  .btn-reset {
    border-color: #475569;
  }

  .btn-reset:hover {
    background: #334155;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: flex-end; }
}

@media (max-width: 768px) {
  .system-config { padding: 16px; }

  .filter-form {
    flex-direction: column; align-items: stretch;
  }

  .filter-form ::v-deep .el-form-item {
    width: 100%; margin-right: 0 !important; margin-bottom: 0;
  }

  .filter-input { width: 100%; }

  .filter-actions {
    width: 100%; justify-content: flex-end; margin-top: 8px;
  }

  .table-summary {
    flex-direction: column; align-items: flex-start; gap: 8px;
  }

  .config-key-cell {
    flex-direction: column; align-items: flex-start; gap: 6px;
  }

  .action-buttons {
    flex-direction: column; gap: 4px;
  }

  .modal-custom ::v-deep .el-dialog {
    width: calc(100% - 32px) !important;
    margin: 16px auto;
  }
}

/* Element UI 微调 */
::v-deep .el-tag--mini {
  padding: 2px 8px; border-radius: 5px; font-weight: 500;
}

::v-deep .el-table th.el-table__cell {
  background: #f8fafc !important;
}

::v-deep .el-switch__core {
  border-radius: 10px;
}

::v-deep .el-dialog__headerbtn {
  top: 18px; right: 20px;
}

::v-deep .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-muted); font-size: 18px;
}
</style>