<template>
  <div>
    <!-- 悬浮按钮 -->
    <div class="ai-chat-fab" @click="openPanel" v-show="!panelVisible">
      <i class="el-icon-chat-dot-round" style="font-size: 24px; color: white;"></i>
      <span v-if="unread > 0" class="fab-badge">{{ unread }}</span>
    </div>

    <!-- 聊天面板 -->
    <div :class="['ai-chat-panel', { fullscreen: isFullscreen }]" v-show="panelVisible">
      <!-- 头部 -->
      <div class="panel-header">
        <div class="header-avatar">
          <i class="el-icon-cpu" style="font-size: 18px; color: white;"></i>
        </div>
        <div class="header-info">
          <span class="header-title">AI 学习助手</span>
          <span class="header-sub"><i class="online-dot"/>在线答疑</span>
        </div>
        <div class="header-actions">
          <i class="el-icon-delete action-icon" @click="clearMessages" title="清空对话"></i>
          <i class="action-icon" @click="toggleFullscreen"
             :class="!isFullscreen ? 'el-icon-full-screen' : 'el-icon-aim'"
             :title="!isFullscreen ? '全屏' : '退出全屏'"></i>
          <i class="el-icon-close action-icon" @click.stop="closePanel" title="关闭"></i>
        </div>
      </div>

      <!-- 快捷建议（首次打开时显示） -->
      <div class="suggest-bar" v-if="messages.length <= 1">
        <span v-for="s in SUGGESTIONS" :key="s" class="suggest-tag" @click="sendSuggestion(s)">
          {{ s }}
        </span>
      </div>

      <!-- 消息列表 -->
      <div class="message-list" ref="messageListRef">
        <div v-for="(msg, index) in messages" :key="index" :class="['msg-row', msg.role]">
          <div class="msg-avatar">
            <i v-if="msg.role === 'assistant'" class="el-icon-cpu"></i>
            <i v-else class="el-icon-user"></i>
          </div>

          <!-- AI 回复：支持 Markdown 渲染 -->
          <div v-if="msg.role === 'assistant'" class="bubble assistant">
            <span v-html="renderMd(msg.content)"></span>
            <!-- 流式输出时的光标 -->
            <span v-if="index === messages.length - 1 && streaming" class="cursor-blink">|</span>
          </div>

          <!-- 用户消息：纯文本 -->
          <div v-else class="bubble user">
            {{ msg.content }}
          </div>
        </div>

        <!-- 思考中动画 -->
        <div class="msg-row assistant" v-if="waiting">
          <div class="msg-avatar"><i class="el-icon-cpu"></i></div>
          <div class="bubble assistant typing-bubble">
            <span class="dot"/><span class="dot"/><span class="dot"/>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <el-input
            v-model="inputText"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="输入问题，按 Enter 发送..."
            resize="none"
            @keydown.enter.exact.prevent="sendMessage"
            :disabled="streaming || waiting"
            class="chat-input"
        />
        <el-button
            type="primary"
            icon="el-icon-s-promotion"
            circle
            :disabled="!inputText.trim() || streaming || waiting"
            @click="sendMessage"
            class="send-btn"
        />
      </div>
    </div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'

export default {
  name: 'AiAssistant',

  data() {
    return {
      // API 配置（根据你的项目调整）
      API_URL: '/api/chat/stream',

      // 欢迎语 + 快捷建议（适配教学场景）
      GREETING: '你好！我是你的 **课程学习助手** 🎓，可以帮你：\n- 解答课程相关问题\n- 指导作业提交流程\n- 解释系统功能使用',
      SUGGESTIONS: [
        '如何提交作业？',
        '课程资源怎么下载？',
        '作业迟交了怎么办？',
        '如何向老师提问？'
      ],

      // 会话管理
      sessionId: '',

      // 状态控制
      panelVisible: false,
      isFullscreen: false,
      inputText: '',
      streaming: false,
      waiting: false,
      unread: 0,

      // 消息列表
      messages: [],

      // Markdown 渲染器
      md: null
    }
  },

  created() {
    // 初始化
    this.sessionId = this.generateSessionId()
    this.md = new MarkdownIt({
      html: false,        // 禁用 HTML 标签（防 XSS）
      linkify: true,      // 自动识别链接
      typographer: true   // 优化标点
    })

    // 初始消息
    this.messages = [{role: 'assistant', content: this.GREETING}]
  },

  methods: {
    // 生成会话 ID（简单版）
    generateSessionId() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    // 打开面板
    openPanel() {
      this.panelVisible = true
      this.unread = 0
      this.$nextTick(this.scrollToBottom)
    },

    // 关闭面板
    closePanel() {
      this.panelVisible = false
      this.isFullscreen = false
    },

    // 切换全屏
    toggleFullscreen() {
      this.isFullscreen = !this.isFullscreen
      this.$nextTick(this.scrollToBottom)
    },

    // 清空对话
    clearMessages() {
      this.messages = [{role: 'assistant', content: this.GREETING}]
      this.sessionId = this.generateSessionId()  // 新会话 = 新记忆
      this.$message.success('对话已清空')
    },

    // 发送快捷建议
    sendSuggestion(text) {
      this.inputText = text
      this.sendMessage()
    },

    // 发送消息（核心方法）
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.streaming || this.waiting) return

      // 1. 添加用户消息
      this.messages.push({role: 'user', content: text})
      this.inputText = ''
      this.waiting = true
      this.$nextTick(this.scrollToBottom)

      // 2. 准备接收 AI 回复
      this.messages.push({role: 'assistant', content: ''})
      const lastIdx = this.messages.length - 1
      this.waiting = false
      this.streaming = true

      // 3. 创建 SSE 连接（流式请求）
      const url = `${this.API_URL}?message=${encodeURIComponent(text)}&sessionId=${this.sessionId}`
      const es = new EventSource(url)

      // 4. 监听流式响应
      es.onmessage = (event) => {
        // 🔍 调试：打印原始数据
        // console.log('📦 event.data:', JSON.stringify(event.data))

        // ⭐ 安全兜底：如果还带引号，手动去掉（临时兼容）
        let content = event.data;
        if (content.startsWith('"') && content.endsWith('"')) {
          content = content.slice(1, -1);  // 去掉首尾引号
          // 处理转义字符（如 \" → "）
          console.log('📦 event.data:', JSON.stringify(content))
          // content = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        // ⭐ 清洗 2: 替换字面量的 \ndata: 为真正换行（核心修复！）
        // 匹配：\n + data: + 可选空白 → 替换为 \n
        content = content.replace(/\\n\s*data:\s*/g, '\n');

        this.messages[lastIdx].content += content;
        this.$nextTick(this.scrollToBottom);
      }

      // 5. 错误处理
      es.onerror = () => {
        es.close()
        this.streaming = false

        // 如果面板关闭了，增加未读计数
        if (!this.panelVisible) {
          this.unread++
        }

        // 如果内容为空，给个友好提示
        if (!this.messages[lastIdx].content.trim()) {
          this.messages[lastIdx].content = '⚠️ 连接中断，请重试或联系人工客服。'
        }
      }
    },

    // 滚动到底部
    scrollToBottom() {
      const el = this.$refs.messageListRef
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    },

    // 渲染 Markdown（安全版）
    renderMd(content) {
      if (!content) return ''
      // 过滤掉可能的 script 标签（双重保险）
      const safe = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      return this.md.render(safe)
    }
  },

  beforeDestroy() {
    // 组件销毁时清理（可选）
  }
}
</script>

<style scoped>
/* AiAssistant.vue style 中添加 */
.bubble.assistant v:deep ol {
  margin: 0 0 8px 0;
  padding-left: 20px;
  color: #303133;
}

.bubble.assistant ::v-deep ol li {
  margin: 4px 0;
  line-height: 1.6;
}

/* ✅ Vue 2 兼容写法 */
.bubble.assistant ::v-deep strong {
  color: #409eff;
  font-weight: 600;
}

.bubble.assistant v:deep code {
  background: #f4f4f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: Consolas, monospace;
  font-size: 12px;
  color: #e6a23c;
}
/* ========== 悬浮按钮 ========== */
.ai-chat-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #1d7fe4);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9997;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ai-chat-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(64, 158, 255, 0.65);
}

.fab-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #f56c6c;
  border: 2px solid white;
  font-size: 11px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ========== 聊天面板 ========== */
.ai-chat-panel {
  position: fixed;
  bottom: 96px;
  right: 28px;
  width: 360px;
  height: 520px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  transition: all 0.3s ease;
}

.ai-chat-panel.fullscreen {
  bottom: 0 !important;
  right: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
}

/* ========== 头部样式 ========== */
.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #409eff, #1d7fe4);
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.header-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  display: flex;
  align-items: center;
  gap: 4px;
}

.online-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #67c23a;
  box-shadow: 0 0 5px #67c23a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 16px;
  transition: color 0.15s;
}

.action-icon:hover {
  color: white;
}

/* ========== 快捷建议 ========== */
.suggest-bar {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  overflow-x: auto;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.suggest-bar::-webkit-scrollbar {
  display: none;
}

.suggest-tag {
  font-size: 12px;
  padding: 4px 10px;
  white-space: nowrap;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  color: #606266;
  cursor: pointer;
  background: white;
  transition: all 0.15s;
  user-select: none;
}

.suggest-tag:hover {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
}

/* ========== 消息列表 ========== */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
}

.message-list::-webkit-scrollbar {
  width: 4px;
}

.message-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 2px;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 100%;
}

.msg-row.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e8f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  color: #409eff;
}

.bubble {
  max-width: min(600px, 65%);
  padding: 10px 13px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.bubble.assistant {
  background: white;
  color: #303133;
  border-radius: 2px 12px 12px 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.bubble.user {
  background: #409eff;
  color: white;
  border-radius: 12px 2px 12px 12px;
}

/* Markdown 内容样式 */
.bubble.assistant :deep(p) {
  margin: 0 0 8px 0;
}

.bubble.assistant :deep(p:last-child) {
  margin-bottom: 0;
}

.bubble.assistant :deep(ul),
.bubble.assistant :deep(ol) {
  margin: 0 0 8px 0;
  padding-left: 20px;
}

.bubble.assistant :deep(code) {
  background: #f4f4f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: Consolas, monospace;
  font-size: 12px;
}

.bubble.assistant :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}

.bubble.assistant :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

/* ========== 打字机动画 ========== */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 12px 16px;
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: dotBounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: translateY(0);
    background: #c0c4cc;
  }
  40% {
    transform: translateY(-7px);
    background: #409eff;
  }
}

.cursor-blink {
  color: #409eff;
  animation: cursorBlink 0.7s infinite;
  margin-left: 2px;
}

@keyframes cursorBlink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ========== 输入区域 ========== */
.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #ebeef5;
  background: white;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  padding: 8px 10px;
  resize: none;
}

.send-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

/* ========== 响应式适配 ========== */
@media (max-width: 480px) {
  .ai-chat-panel {
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 70vh !important;
    border-radius: 16px 16px 0 0 !important;
  }

  .ai-chat-fab {
    bottom: 20px;
    right: 20px;
  }
}
</style>