<template>
  <div class="notify-send">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">📢 发送系统通知</h2>
      <el-tag type="warning" size="medium">系统通知将发送给所有用户</el-tag>
    </div>

    <!-- 通知表单卡片 -->
    <el-card class="form-card" shadow="never">
      <el-form
          ref="notifyForm"
          :model="notifyForm"
          :rules="rules"
          label-width="100px"
          size="small"
      >
        <!-- 通知标题 -->
        <el-form-item label="通知标题" prop="title">
          <el-input
              v-model="notifyForm.title"
              placeholder="请输入通知标题（2-50个字符）"
              maxlength="50"
              show-word-limit
              clearable
          />
        </el-form-item>

        <!-- 通知内容 -->
        <el-form-item label="通知内容" prop="content">
          <el-input
              type="textarea"
              v-model="notifyForm.content"
              placeholder="请输入通知详细内容..."
              :rows="10"
              maxlength="500"
              show-word-limit
              resize="vertical"
          />
        </el-form-item>

        <!-- 提示说明 -->
        <el-alert
            title="发送说明"
            type="info"
            :closable="false"
            show-icon
            class="notify-tip"
        >
          <template #default>
            <div>• 系统通知对所有用户可见，无需选择接收人</div>
            <div>• 通知发布后无法撤回，请确认内容无误</div>
            <div>• 支持换行和基础排版，建议内容简洁明了</div>
          </template>
        </el-alert>

        <!-- 操作按钮 -->
        <el-form-item class="form-footer">
          <el-button @click="handleReset">重置</el-button>
          <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
              icon="el-icon-paperclip"
          >
            {{ submitting ? '发送中...' : '立即发送' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 发送成功弹窗 -->
    <el-dialog
        :visible.sync="successDialog"
        title="✅ 发送成功"
        width="400px"
        :close-on-click-modal="false"
        :show-close="false"
        center
        class="success-dialog"
    >
      <div class="success-content">
        <i class="el-icon-check success-icon"></i>
        <p class="success-text">系统通知已成功发布，所有用户可见</p>
        <p class="success-subtext">通知标题：{{ notifyForm.title }}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="handleSuccessClose">确定</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminSendSystemNotification',

  data() {
    return {
      notifyForm: {
        title: '',
        content: ''
      },
      rules: {
        title: [
          { required: true, message: '请输入通知标题', trigger: 'blur' },
          { min: 2, max: 50, message: '标题长度在 2-50 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入通知内容', trigger: 'blur' },
          { min: 10, max: 500, message: '内容长度在 10-500 个字符', trigger: 'blur' }
        ]
      },
      submitting: false,
      successDialog: false
    }
  },

  methods: {
    async handleSubmit() {
      try {
        await this.$refs.notifyForm.validate()
      } catch {
        this.$message.warning('请完善表单信息')
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
          this.$message.success(resp.data.msg || '发送成功')
        } else {
          this.$message.error(resp.data.msg || '发送失败')
        }
      } catch (error) {
        console.error('发送通知异常:', error)
        const msg = error.response?.data?.msg || '网络异常，请检查连接'
        this.$message.error(msg)
      } finally {
        this.submitting = false
      }
    },

    handleReset() {
      this.notifyForm = {
        title: '',
        content: ''
      }
      this.$refs.notifyForm?.resetFields()
      this.$message.info('表单已重置')
    },

    handleSuccessClose() {
      this.successDialog = false
      this.handleReset()
    }
  }
}
</script>

<style scoped>
/* 纯 CSS 版本 - 无需 sass-loader */

.notify-send {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px;
}

.page-header .page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.form-card {
  margin: 0 20px 20px 20px;
  max-width: 800px;
}

.form-card .notify-tip {
  margin-bottom: 20px;
}

.form-card .form-footer {
  margin-top: 10px;
  text-align: right;
}

.form-card .form-footer .el-button {
  margin-left: 10px;
}

/* 成功弹窗样式 - 使用 ::v-deep 穿透（Vue2 语法） */
.success-dialog >>> .el-dialog__body {
  padding: 30px 20px;
}

.success-content {
  text-align: center;
}

.success-content .success-icon {
  font-size: 60px;
  color: #67c23a;
  margin-bottom: 15px;
}

.success-content .success-text {
  color: #606266;
  font-size: 16px;
  margin: 10px 0 5px;
}

.success-content .success-subtext {
  color: #909399;
  font-size: 13px;
  margin: 0;
}

/* 响应式适配 */
@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .form-card {
    margin: 0 10px 10px 10px;
  }
}
</style>