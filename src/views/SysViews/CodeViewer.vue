<template>
  <div class="code-viewer">
    <div ref="editorContainer" class="editor-container"></div>
  </div>
</template>

<script>
export default {
  name: 'CodeViewer',
  props: {
    code: { type: String, default: '' },
    language: { type: String, default: 'plaintext' },
    readOnly: { type: Boolean, default: true },
    theme: { type: String, default: 'vs-light' }
  },
  data() {
    return { editor: null }
  },
  watch: {
    code(newVal) { this.editor?.setValue(newVal) },
    language(newVal) {
      if (this.editor) {
        // UMD 版本需要这样设置语言
        const model = this.editor.getModel()
        if (model) {
          window.monaco.editor.setModelLanguage(model, newVal)
        }
      }
    }
  },
  mounted() {
    // 确保 monaco 已加载
    if (window.monaco) {
      this.initEditor()
    } else {
      // 如果 CDN 还没加载完，等待一下
      const check = setInterval(() => {
        if (window.monaco) {
          clearInterval(check)
          this.initEditor()
        }
      }, 100)
    }
  },
  beforeDestroy() {
    this.editor?.dispose()
  },
  methods: {
    initEditor() {
      this.editor = window.monaco.editor.create(this.$refs.editorContainer, {
        value: this.code,
        language: this.language,
        theme: this.theme,
        readOnly: this.readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        contextmenu: false,
        quickSuggestions: false,
        folding: false
      })
    }
  }
}
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 400px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
</style>