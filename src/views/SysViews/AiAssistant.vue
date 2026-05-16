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
            <!-- 时间戳 -->
            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>

            <!-- 操作按钮（仅最后一条且非流式时显示） -->
            <div v-if="index === messages.length - 1 && !streaming && msg.content.trim()" class="msg-actions">
              <el-button size="mini" type="text" icon="el-icon-document-copy" @click="copyMessage(msg.content)"
                         class="action-btn">
                复制
              </el-button>
              <el-button v-if="messages.length > 2" size="mini" type="text" icon="el-icon-refresh"
                         @click="regenerateLast" class="action-btn">
                重新生成
              </el-button>
            </div>
          </div>

          <!-- 用户消息：纯文本 -->
          <div v-else class="bubble user">
            {{ msg.content }}
            <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
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
            placeholder="输入问题，Ctrl+Enter 换行，Enter 发送..."
            resize="none"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.ctrl.enter="insertNewline"
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
import debounce from 'lodash/debounce'

export default {
  name: 'AiAssistant',

  data() {
    return {
      // API 配置
      API_URL: '/api/chat/stream',
      STORAGE_KEY: 'ai_chat_history_v1',  // localStorage 键名

      // 欢迎语 + 快捷建议
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
    // 初始化 Markdown
    this.md = new MarkdownIt({
      html: false,
      linkify: true,
      typographer: true
    })

    // 生成会话 ID
    this.sessionId = this.generateSessionId()

    // 加载历史对话
    this.loadHistory()

    // 如果无历史，显示欢迎语
    if (this.messages.length === 0) {
      this.messages = [{
        role: 'assistant',
        content: this.GREETING,
        timestamp: Date.now()
      }]
    }
  },

  methods: {

    // ========== 基础方法 ==========

    generateSessionId() {
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    },

    // 格式化时间：今天显示"14:30"，其他显示"05-16 14:30"
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()

      const h = String(date.getHours()).padStart(2, '0')
      const m = String(date.getMinutes()).padStart(2, '0')

      return isToday ? `${h}:${m}` : `${now.getMonth() + 1}-${date.getDate()} ${h}:${m}`
    },
    decodeUnicode(str) {
      return str.replace(/\\u([dD][89abAB][\dA-Fa-f]{2})\\u([\dA-Fa-f]{4})|\\u([\dA-Fa-f]{4})/g,
          (match, high, low, single) => {
            if (high && low) {
              // 代理对：如 \uD83D\uDC4B → 👋
              return String.fromCharCode(
                  parseInt(high, 16),
                  parseInt(low, 16)
              );
            } else if (single) {
              // 单字符：如 \u2728 → ✨
              return String.fromCharCode(parseInt(single, 16));
            }
            return match;
          }
      );
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
      this.messages = [{
        role: 'assistant',
        content: this.GREETING,
        timestamp: Date.now()
      }]
      this.sessionId = this.generateSessionId()
      localStorage.removeItem(this.STORAGE_KEY)
      this.$message.success('对话已清空')
    },

    // 发送快捷建议
    sendSuggestion(text) {
      this.inputText = text
      this.sendMessage()
    },

    // ========== 输入处理 ==========

    // Ctrl+Enter 换行
    insertNewline(event) {
      const textarea = event.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      this.inputText =
          this.inputText.substring(0, start) +
          '\n' +
          this.inputText.substring(end)

      this.$nextTick(() => {
        if (textarea) {
          textarea.selectionStart = textarea.selectionEnd = start + 1
        }
      })

      event.preventDefault()
      event.stopPropagation()
    },

    // ========== 消息发送（核心）==========

    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.streaming || this.waiting) return

      // 1. 添加用户消息（带时间戳）
      this.messages.push({
        role: 'user',
        content: text,
        timestamp: Date.now()
      })
      this.inputText = ''
      this.waiting = true
      this.$nextTick(this.scrollToBottom)
      this.saveHistory()  // 保存历史

      // 2. 准备接收 AI 回复（带时间戳）
      this.messages.push({
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      })
      const lastIdx = this.messages.length - 1
      this.waiting = false
      this.streaming = true

      // 3. 创建 SSE 连接
      const url = `${this.API_URL}?message=${encodeURIComponent(text)}&sessionId=${this.sessionId}`
      const es = new EventSource(url)

      // 4. 监听流式响应
      es.onmessage = (event) => {
        let content = event.data

        // 清洗引号
        if (content.startsWith('"') && content.endsWith('"')) {
          content = content.slice(1, -1)
          content = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        }

        // 清洗 \ndata: 为真正换行
        content = content.replace(/\\n\s*data:\s*/g, '\n')
        this.decodeUnicode(content)

        this.messages[lastIdx].content += content
        this.$nextTick(this.scrollToBottom)
        this.saveHistory()  // 实时保存
      }

      // 5. 错误处理
      es.onerror = () => {
        es.close()
        this.streaming = false

        if (!this.panelVisible) this.unread++

        if (!this.messages[lastIdx].content.trim()) {
          this.messages[lastIdx].content = '⚠️ 连接中断，请重试或联系人工客服。'
        }
        this.saveHistory()
      }
    },

    // ========== 实用功能 ==========

    // 复制消息（去掉 Markdown 标记）
    copyMessage(content) {
      const plain = content
          .replace(/\*\*([^*]+)\*\*/g, '$1')      // 去掉加粗
          .replace(/`([^`]+)`/g, '$1')            // 去掉代码标记
          .replace(/^- /gm, '')                   // 去掉列表标记
          .replace(/#{1,6}\s+/g, '')              // 去掉标题标记
          .trim()

      if (navigator.clipboard) {
        navigator.clipboard.writeText(plain).then(() => {
          this.$message.success('✓ 已复制')
        }).catch(() => this.fallbackCopy(plain))
      } else {
        this.fallbackCopy(plain)
      }
    },

    // 兼容旧浏览器的复制
    fallbackCopy(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      textarea.style.top = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        this.$message.success('✓ 已复制')
      } catch (e) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(textarea)
    },

    // 重新生成最后一条回复
    regenerateLast() {
      // 找到最后一个用户消息
      const lastUserIndex = [...this.messages].reverse()
          .findIndex(m => m.role === 'user')

      if (lastUserIndex === -1) return

      const actualIndex = this.messages.length - 1 - lastUserIndex
      const lastUserMsg = this.messages[actualIndex]

      // 移除最后一条 AI 回复
      this.messages.pop()

      // 重新发送
      this.inputText = lastUserMsg.content
      this.sendMessage()
      this.$message.info('🔄 重新生成中...')
    },

    // ========== 历史存储 ==========

    // 加载历史记录
    loadHistory() {
      try {
        const saved = localStorage.getItem(this.STORAGE_KEY)
        if (saved) {
          const history = JSON.parse(saved)
          if (Array.isArray(history) && history.length > 0) {
            this.messages = [
              {role: 'assistant', content: this.GREETING, timestamp: Date.now()},
              ...history
            ]
            this.$message.info('📚 已恢复上次对话')
          }
        }
      } catch (e) {
        console.warn('Load history failed:', e)
      }
    },

    // 保存历史记录（防抖）
    saveHistory: debounce(function () {
      try {
        // 只保存对话内容（去掉欢迎语）
        const history = this.messages.slice(1).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
      } catch (e) {
        console.warn('Save history failed:', e)
      }
    }, 1000),

    // ========== 滚动 ==========

    // 防抖 + 平滑滚动
    scrollToBottom: debounce(function () {
      const el = this.$refs.messageListRef
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 50),

    // ========== Markdown 渲染 ==========

    renderMd(content) {
      if (!content) return ''
      // 过滤 script 标签（防 XSS）
      const safe = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      return this.md.render(safe)
    }
  },

  beforeDestroy() {
    // 清理
    this.md = null
  }
}
</script>

<style scoped>
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
  /* 消息入场动画 */
  animation: msgFadeIn 0.2s ease-out;
}

@keyframes msgFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.msg-row.user {
  flex-direction: row-reverse;
  /* 用户消息从右侧滑入 */
  animation: msgSlideInRight 0.2s ease-out;
}

@keyframes msgSlideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  position: relative;
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

/* 时间戳样式 */
.msg-time {
  display: block;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
  text-align: right;
}

.msg-row.user .msg-time {
  text-align: left;
  color: rgba(255, 255, 255, 0.8);
}

/* 操作按钮区域 */
.msg-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  border-top: 1px dashed #ebeef5;
  padding-top: 6px;
}

.action-btn {
  font-size: 12px !important;
  color: #909399 !important;
  padding: 0 8px !important;
  height: 24px !important;
  margin: 0 !important;
}

.action-btn:hover {
  color: #409eff !important;
}

/* ========== Markdown 内容样式 ========== */
.bubble.assistant ::v-deep p {
  margin: 0 0 8px 0;
}

.bubble.assistant ::v-deep p:last-child {
  margin-bottom: 0;
}

.bubble.assistant ::v-deep ul,
.bubble.assistant ::v-deep ol {
  margin: 0 0 8px 0;
  padding-left: 20px;
}

.bubble.assistant ::v-deep ol li {
  margin: 4px 0;
  line-height: 1.6;
}

.bubble.assistant ::v-deep strong {
  color: #409eff;
  font-weight: 600;
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
}

.bubble.assistant ::v-deep code {
  background: #f4f4f5;
  padding: 2px 5px;
  border-radius: 3px;
  font-family: Consolas, monospace;
  font-size: 12px;
  color: #e6a23c;
}

.bubble.assistant ::v-deep pre {
  background: #1e1e1e !important;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.bubble.assistant ::v-deep pre code {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 13px;
  line-height: 1.5;
}

.bubble.assistant ::v-deep a {
  color: #409eff;
  text-decoration: none;
  border-bottom: 1px dashed #409eff;
  transition: all 0.15s;
}

.bubble.assistant ::v-deep a:hover {
  color: #66b1ff;
  border-bottom-style: solid;
  cursor: pointer;
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

.chat-input ::v-deep .el-textarea__inner {
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

  .bubble {
    max-width: 85%;
  }
}
</style>