<template>
  <div class="notify-send">

    <!-- 装饰背景 -->
    <div class="page-bg-decoration"></div>

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-left">
        <div class="title-icon">
          <i class="el-icon-bell"></i>
        </div>
        <div class="title-content">
          <h2 class="page-title">发送系统通知</h2>
          <p class="page-subtitle">向所有用户发布重要公告</p>
        </div>
      </div>
      <el-tag
          type="warning"
          size="medium"
          effect="dark"
          class="header-tag"
      >
        <i class="el-icon-info"></i> 全局通知 · 全员可见
      </el-tag>
    </div>

    <!-- 通知表单卡片 -->
    <el-card class="form-card" shadow="never">
      <div class="card-header">
        <span class="card-title">📝 通知内容</span>
        <el-divider direction="vertical"></el-divider>
        <span class="card-tip">请填写完整信息后发送</span>
      </div>

      <el-form
          ref="notifyForm"
          :model="notifyForm"
          :rules="rules"
          label-width="100px"
          size="small"
          class="notify-form"
      >
        <!-- 通知标题 -->
        <el-form-item label="通知标题" prop="title">
          <el-input
              v-model="notifyForm.title"
              placeholder="请输入通知标题，如：系统维护公告"
              maxlength="50"
              show-word-limit
              clearable
              class="form-input"
          />
        </el-form-item>

        <!-- 通知内容 -->
        <el-form-item label="通知内容" prop="content">
          <el-input
              type="textarea"
              v-model="notifyForm.content"
              placeholder="请输入通知详细内容，支持换行排版..."
              :rows="8"
              maxlength="500"
              show-word-limit
              resize="vertical"
              class="form-textarea"
          />
          <div class="textarea-toolbar">
            <span class="toolbar-tip">💡 支持换行，建议分段清晰</span>
            <span class="char-count">{{ notifyForm.content.length }}/500</span>
          </div>
        </el-form-item>

        <!-- 提示说明卡片 -->
        <el-alert
            title="📌 发送须知"
            type="info"
            :closable="false"
            show-icon
            class="notify-tip"
            effect="light"
        >
          <template #default>
            <div class="tip-list">
              <div class="tip-item">
                <i class="el-icon-user"></i>
                <span>系统通知对所有注册用户可见，无需选择接收人</span>
              </div>
              <div class="tip-item">
                <i class="el-icon-warning-outline"></i>
                <span>通知发布后无法撤回，发送前请仔细确认内容</span>
              </div>
              <div class="tip-item">
                <i class="el-icon-tickets"></i>
                <span>支持换行和基础排版，建议内容简洁明了，重点突出</span>
              </div>
            </div>
          </template>
        </el-alert>

        <!-- 操作按钮 -->
        <el-form-item class="form-footer">
<!--          <el-button-->
<!--              @click="handleReset"-->
<!--              :disabled="submitting"-->
<!--              class="btn-reset"-->
<!--          >-->
<!--            <i class="el-icon-refresh-left"></i> 重置-->
<!--          </el-button>-->
          <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              class="btn-submit"
              :class="{ 'btn-pulse': notifyForm.title && notifyForm.content && !submitting }"
          >
            <i class="el-icon-paperclip"></i>
            {{ submitting ? '发送中...' : '立即发送' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 发送成功弹窗 -->
    <el-dialog
        :visible.sync="successDialog"
        title=""
        width="420px"
        :close-on-click-modal="false"
        :show-close="false"
        center
        class="success-dialog"
        custom-class="success-dialog-custom"
    >
      <div class="success-wrapper">
        <div class="success-animation">
          <div class="checkmark">
            <div class="checkmark-circle">
              <div class="background"></div>
              <div class="checkmark-draw"></div>
            </div>
          </div>
        </div>
        <h3 class="success-title">🎉 发送成功</h3>
        <p class="success-text">系统通知已成功发布，所有用户立即可见</p>

        <div class="success-preview">
          <div class="preview-label">通知预览</div>
          <div class="preview-content">
            <div class="preview-title">{{ notifyForm.title }}</div>
            <div class="preview-body">{{ notifyForm.content }}</div>
          </div>
        </div>

        <div class="success-meta">
          <span class="meta-item">
            <i class="el-icon-time"></i>
            {{ formatTime(new Date()) }}
          </span>
          <span class="meta-item">
            <i class="el-icon-user"></i>
            接收范围：全部用户
          </span>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="medium" @click="handleSuccessClose" class="btn-confirm">
          确定，返回列表
        </el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminSendSystemNotification',

  data() {
    // 自定义验证规则
    const validateTitle = (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('请输入通知标题'))
      } else if (value.trim().length < 2) {
        callback(new Error('标题至少 2 个字符'))
      } else {
        callback()
      }
    }

    const validateContent = (rule, value, callback) => {
      if (!value || !value.trim()) {
        callback(new Error('请输入通知内容'))
      } else if (value.trim().length < 10) {
        callback(new Error('内容至少 10 个字符'))
      } else {
        callback()
      }
    }

    return {
      notifyForm: {
        title: '',
        content: ''
      },
      rules: {
        title: [
          { required: true, validator: validateTitle, trigger: 'blur' },
          { max: 50, message: '标题不超过 50 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, validator: validateContent, trigger: 'blur' },
          { max: 500, message: '内容不超过 500 个字符', trigger: 'blur' }
        ]
      },
      submitting: false,
      successDialog: false
    }
  },

  methods: {
    // 格式化时间显示
    formatTime(date) {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      const h = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      return `${y}-${m}-${d} ${h}:${min}`
    },

    // 提交表单
    async handleSubmit() {
      try {
        await this.$refs.notifyForm.validate()
      } catch {
        this.$message.warning({
          message: '请完善表单信息后再发送',
          duration: 2000,
          showClose: true
        })
        return
      }

      this.submitting = true

      try {
        const resp = await axios.post('/api/admin/notification/sendSystem', {
          title: this.notifyForm.title.trim(),
          content: this.notifyForm.content.trim()
        })

        if (resp.data.code === 1) {
          this.successDialog = true
          this.$message.success({
            message: resp.data.msg || '✅ 通知发送成功',
            duration: 2000
          })
        } else {
          this.$message.error({
            message: resp.data.msg || '❌ 发送失败，请稍后重试',
            duration: 3000,
            showClose: true
          })
        }
      } catch (error) {
        console.error('发送通知异常:', error)
        const msg = error.response?.data?.msg || '🌐 网络异常，请检查连接后重试'
        this.$message.error({
          message: msg,
          duration: 3000,
          showClose: true
        })
      } finally {
        this.submitting = false
      }
    },

    // 重置表单
    handleReset() {
      if (this.submitting) return

      this.$confirm('确定要重置表单吗？已填写的内容将丢失', '提示', {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }).then(() => {
        this.notifyForm = { title: '', content: '' }
        this.$refs.notifyForm?.resetFields()
        this.$message.info({
          message: '🔄 表单已重置',
          duration: 1500
        })
      }).catch(() => {})
    },

    // 成功弹窗关闭
    handleSuccessClose() {
      this.successDialog = false
      // this.handleReset()
      // 可选：返回上一页或刷新列表
      // this.$router.back()
    }
  }
}
</script>

<style scoped>
/* ========== 全局变量 ========== */
.notify-send {
  --primary-color: #4f46e5;
  --primary-hover: #4338ca;
  --primary-light: rgba(79, 70, 229, 0.1);
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --bg-page: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f0f4ff 100%);
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-glow: 0 0 40px rgba(79, 70, 229, 0.15);

  padding: 24px;
  min-height: 100vh;
  background: var(--bg-page);
  position: relative;
  overflow-x: hidden;
}

/* 背景装饰 */
.page-bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 300px;
  background: radial-gradient(ellipse at top, rgba(79, 70, 229, 0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ========== 页面标题 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 24px 0;
  padding: 0 8px;
  position: relative;
  z-index: 1;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.35);
  flex-shrink: 0;
}

.title-icon i {
  font-size: 24px;
  color: white;
}

.title-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

.header-tag {
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
}

/* ========== 表单卡片 ========== */
.form-card {
  margin: 0 auto 24px;
  max-width: 760px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  animation: cardEnter 0.5s ease-out 0.1s backwards;
  position: relative;
  z-index: 1;
}

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-tip {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.notify-form {
  padding: 24px;
}

/* 表单输入框美化 */
.form-input ::v-deep .el-input__inner {
  border-radius: 10px;
  border: 2px solid var(--border-color);
  padding: 10px 14px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f8fafc;
}

.form-input ::v-deep .el-input__inner:hover {
  border-color: #cbd5e1;
  background: white;
}

.form-input ::v-deep .el-input__inner:focus {
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

.form-input ::v-deep .el-input__prefix {
  margin-right: 4px;
}

.form-input ::v-deep .el-input__prefix i {
  color: var(--text-muted);
  font-size: 14px;
}

.form-textarea ::v-deep .el-textarea__inner {
  border-radius: 12px;
  border: 2px solid var(--border-color);
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.2s;
  background: #f8fafc;
  resize: vertical;
}

.form-textarea ::v-deep .el-textarea__inner:hover {
  border-color: #cbd5e1;
  background: white;
}

.form-textarea ::v-deep .el-textarea__inner:focus {
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 4px var(--primary-light);
}

/* 文本域工具栏 */
.textarea-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
}

.toolbar-tip {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.char-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
}

/* 提示说明卡片 */
.notify-tip {
  margin: 24px 0 28px;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

.notify-tip ::v-deep .el-alert__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tip-item i {
  color: var(--primary-color);
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
}

/* 表单底部按钮 */
.form-footer {
  margin: 32px 0 8px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-reset {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 500;
  border: 2px solid var(--border-color);
  transition: all 0.2s;
}

.btn-reset:hover:not(:disabled) {
  border-color: #94a3b8;
  color: var(--text-primary);
  background: #f8fafc;
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit {
  padding: 10px 32px;
  border-radius: 10px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.45);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  background: #cbd5e1;
  box-shadow: none;
  cursor: not-allowed;
}

/* 发送按钮脉冲动画 */
.btn-pulse {
  animation: btnPulse 2s infinite;
}

@keyframes btnPulse {
  0% { box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); }
  50% { box-shadow: 0 6px 20px rgba(79, 70, 229, 0.55); }
  100% { box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); }
}

/* ========== 成功弹窗 ========== */
.success-dialog-custom {
  border-radius: 20px !important;
  overflow: hidden;
}

.success-dialog-custom >>> .el-dialog {
  border-radius: 20px;
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.success-dialog-custom >>> .el-dialog__header {
  padding: 0;
  margin: 0;
}

.success-dialog-custom >>> .el-dialog__body {
  padding: 32px 28px 24px;
}

.success-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* 成功动画 */
.success-animation {
  margin-bottom: 20px;
}

.checkmark {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  stroke-width: 3;
  stroke: white;
  stroke-miterlimit: 10;
  box-shadow: inset 0 0 0 var(--success-color);
  animation: fill 0.4s ease-in-out 0.2s forwards, scale 0.3s ease-in-out 0.6s forwards;
  position: relative;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  position: relative;
}

.checkmark-circle .background {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--success-color);
  position: absolute;
}

.checkmark-draw {
  top: 18px;
  left: 24px;
  width: 32px;
  height: 48px;
  position: absolute;
  border-radius: 2px 28px 28px 0;
  border: 3px solid white;
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
  animation: draw 0.4s ease-out 0.5s forwards;
  opacity: 0;
}

@keyframes draw {
  0% { opacity: 0; transform: rotate(45deg) scale(0.5); }
  50% { opacity: 1; }
  100% { opacity: 1; transform: rotate(45deg) scale(1); }
}

@keyframes fill {
  to { box-shadow: inset 0 0 0 80px var(--success-color); }
}

@keyframes scale {
  to { transform: scale(1.05); }
}

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.success-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
  line-height: 1.5;
}

/* 通知预览 */
.success-preview {
  width: 100%;
  max-width: 340px;
  margin-bottom: 20px;
}

.preview-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: left;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-content {
  background: #f8fafc;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  line-height: 1.4;
}

.preview-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 成功弹窗元信息 */
.success-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.meta-item i {
  font-size: 13px;
}

.dialog-footer {
  padding: 0 28px 28px;
  display: flex;
  justify-content: center;
}

.btn-confirm {
  padding: 11px 36px;
  border-radius: 10px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  transition: all 0.2s;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.45);
}

/* ========== 暗黑模式适配 ========== */
@media (prefers-color-scheme: dark) {
  .notify-send {
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --bg-page: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    --bg-card: #1e293b;
    --border-color: #334155;
  }

  .form-input ::v-deep .el-input__inner,
  .form-textarea ::v-deep .el-textarea__inner {
    background: #334155;
    color: var(--text-primary);
  }

  .form-input ::v-deep .el-input__inner:focus,
  .form-textarea ::v-deep .el-textarea__inner:focus {
    background: #475569;
  }

  .notify-tip {
    background: linear-gradient(135deg, #1e293b, #334155);
    border-color: #475569;
  }

  .char-count {
    background: #334155;
  }

  .preview-content {
    background: #334155;
    border-color: #475569;
  }
}

/* ========== 响应式适配 ========== */
@media (max-width: 768px) {
  .notify-send {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }

  .header-left {
    width: 100%;
  }

  .header-tag {
    align-self: flex-start;
  }

  .form-card {
    margin: 0;
    border-radius: 16px;
  }

  .card-header {
    padding: 16px 20px 12px;
  }

  .notify-form {
    padding: 20px;
  }

  /* ========== 表单底部按钮 - 修复间距 ========== */
  .form-footer {
    margin: 32px 0 8px;
    display: flex;
    justify-content: flex-end;
    gap: 20px;              /* 🔧 从 12px → 20px，增加按钮间距 */
    padding-top: 24px;      /* 🔧 略微增加上内边距，更透气 */
    border-top: 1px solid var(--border-color);
  }

  .btn-reset {
    padding: 10px 28px;     /* 🔧 水平内边距 +4px，按钮更宽 */
    min-width: 90px;        /* 🔧 新增：确保最小宽度，视觉平衡 */
    border-radius: 10px;
    font-weight: 500;
    font-size: 14px;
    border: 2px solid var(--border-color);
    transition: all 0.2s;
    letter-spacing: 0.3px;  /* 🔧 微调字间距，更精致 */
  }

  .btn-reset:hover:not(:disabled) {
    border-color: #94a3b8;
    color: var(--text-primary);
    background: #f8fafc;
    transform: translateY(-1px);  /* 🔧 添加轻微上浮动效 */
  }

  .btn-reset:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-submit {
    padding: 10px 36px;     /* 🔧 水平内边距 +4px，与重置按钮协调 */
    min-width: 100px;       /* 🔧 新增：确保主按钮略宽于重置 */
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
    border: none;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;  /* 🔧 新增：确保图标+文字居中 */
    gap: 8px;                 /* 🔧 图标与文字间距微调 */
    letter-spacing: 0.3px;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.45);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-submit:disabled {
    background: #cbd5e1;
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
  }

  .success-dialog-custom {
    margin: 0 12px;
  }

  .success-dialog-custom >>> .el-dialog {
    width: calc(100% - 24px) !important;
  }
}

/* Element UI 组件微调 */
::v-deep .el-form-item__label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

::v-deep .el-form-item__error {
  font-size: 12px;
  padding-top: 4px;
}

::v-deep .el-input__count {
  font-size: 11px;
  color: var(--text-muted);
  background: transparent;
  margin-top: 4px;
}

::v-deep .el-alert__content {
  padding-right: 0;
}

::v-deep .el-divider--vertical {
  margin: 0 8px;
  height: 14px;
  border-color: var(--border-color);
}
</style>