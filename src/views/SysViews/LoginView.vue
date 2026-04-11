<template>
  <div class="login-container">
    <!-- 背景装饰元素 -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <el-container class="main-container">
      <el-header class="header">
        <div class="logo-section">
          <i class="el-icon-s-platform logo-icon"></i>
          <span class="logo-text">智慧教学平台</span>
        </div>
        <div class="slogan">智能匹配 · 高效招聘 · 精准触达</div>
      </el-header>

      <el-main class="main-content">
        <div class="login-card">
          <div class="card-header">
            <h2>欢迎登录</h2>
            <p class="sub-title">请输入您的账号信息</p>
          </div>

          <el-form
              :model="ruleForm"
              label-position="top"
              class="demo-ruleForm"
              @keyup.enter.native="submitForm"
          >
            <el-form-item label="用户名">
              <el-input
                  v-model="ruleForm.user"
                  placeholder="请输入用户名"
                  prefix-icon="el-icon-user"
                  class="custom-input"
              ></el-input>
            </el-form-item>

            <el-form-item label="密码">
              <el-input
                  type="password"
                  v-model="ruleForm.pass"
                  placeholder="请输入密码"
                  prefix-icon="el-icon-lock"
                  autocomplete="off"
                  class="custom-input"
                  show-password
              ></el-input>
            </el-form-item>
            <el-form-item>
              <el-button
                  type="primary"
                  @click="submitForm"
                  class="submit-btn"
                  :loading="loading"
              >
                {{ loading ? '登录中...' : '立即登录' }}
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="footer-info">
          <p>© 2024 智慧教育平台 版权所有</p>
          <el-link type="info" :underline="false" class="footer-link">用户协议</el-link>
          <el-link type="info" :underline="false" class="footer-link">隐私政策</el-link>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      ruleForm: {
        user: '',
        pass: '',
      },
      rememberMe: false,
      loading: false
    };
  },
  methods: {
    submitForm() {
      // 简单校验
      if (!this.ruleForm.user || !this.ruleForm.pass) {
        this.$message.warning('请输入用户名和密码');
        return;
      }

      this.loading = true;
      let url = "/api/auth/login";
      axios.post(url, {
        "username": this.ruleForm.user,
        "password": this.ruleForm.pass,
      }).then(resp => {
        // 如果返回登陆失败信息，则跳出消息提示框提示登陆失败
        if (resp.data.msg === 'NOT_LOGIN') {
          this.$message.error('用户名或密码错误，请重试');
        }
        // 如果登陆成功
        else {
          // 设置登录状态
          sessionStorage.setItem('isLogin', 'true')

          // ✅ 关键：存储完整的用户信息（包含 role 字段）
          sessionStorage.setItem('userInfo', JSON.stringify(resp.data.data))

          // 记住我功能
          if (this.rememberMe) {
            localStorage.setItem('rememberedUser', this.ruleForm.user);
          }

          this.$message.success("登录成功");

          // ✅ 核心修改：根据角色跳转到不同界面
          const role = resp.data.data.role;  // 从后端返回的用户信息中获取角色
          const roleRoutes = {
            'ADMIN': 'admin',           // 管理员 → /admin（默认跳到 /admin/users）
            'TEACHER': 'teacher',       // 教师 → /teacher（默认跳到 /teacher/courses）
            'STUDENT': 'student'        // 学生 → /student（默认跳到 /student/market）
          };

          // 获取目标路由名称，如果角色未知则默认跳教师
          const targetRoute = roleRoutes[role] || 'teacher';

          // 跳转（带 redirect 参数，方便登录后返回原页面）
          const redirect = this.$route.query.redirect;
          if (redirect) {
            this.$router.replace(redirect);
          } else {
            this.$router.replace({ name: targetRoute });
          }
        }
      }).catch(err => {
        this.$message.error('网络请求失败，请检查连接');
        console.error('Login error:', err);
      }).finally(() => {
        this.loading = false;
      });
    },
  },
  mounted() {
    // 页面加载时检查是否有记住的用户
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      this.ruleForm.user = rememberedUser;
      this.rememberMe = true;
    }
  }
}
</script>

<style scoped>
/* 全局容器样式 */
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 背景装饰圆球 */
.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  right: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-20px) scale(1.05); }
}

/* 主容器 */
.main-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* 头部样式 */
.header {
  text-align: center;
  padding: 20px 0;
  background: transparent;
  height: auto;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  font-size: 42px;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: 36px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: 2px;
}

.slogan {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  letter-spacing: 4px;
  font-weight: 300;
}

/* 主内容区 */
.main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 登录卡片 */
.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px 50px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  text-align: center;
  margin-bottom: 35px;
}

.card-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.sub-title {
  color: #999;
  font-size: 14px;
  margin: 0;
}

/* 表单样式优化 */
.demo-ruleForm {
  width: 100%;
}

.custom-input >>> .el-input__inner {
  border-radius: 10px;
  border: 2px solid #e8e8e8;
  height: 48px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #fafafa;
}

.custom-input >>> .el-input__inner:hover {
  border-color: #667eea;
}

.custom-input >>> .el-input__inner:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.custom-input >>> .el-input__prefix {
  left: 15px;
}

.custom-input >>> .el-input__prefix i {
  color: #999;
  font-size: 18px;
}
.custom-input >>> .el-input__inner {
  padding-left: 45px;  /* 默认是 30px，增加这个值 */
}

.custom-input >>> .el-icon-user {
  left: 15px;  /* 调整图标位置 */
}
/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0 25px 0;
}

.remember-check >>> .el-checkbox__label {
  color: #666;
  font-size: 14px;
}

.remember-check >>> .el-checkbox__input.is-checked + .el-checkbox__label {
  color: #667eea;
}

.forgot-link {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.forgot-link:hover {
  color: #764ba2;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn >>> .el-button__text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 分割线 */
.divider {
  position: relative;
  text-align: center;
  margin: 30px 0 20px;
  color: #999;
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 1px;
  background: #e8e8e8;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

/* 社交登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social-btn {
  width: 45px;
  height: 45px;
  border: 2px solid #e8e8e8;
  color: #666;
  transition: all 0.3s ease;
  background: #fafafa;
}

.social-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #fff;
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.2);
}

/* 页脚 */
.footer-info {
  margin-top: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

.footer-info p {
  margin: 0 0 10px 0;
}

.footer-link {
  margin: 0 12px;
  font-size: 13px;
}

.footer-link:hover {
  color: #fff;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .login-card {
    padding: 30px 35px;
    margin: 0 20px;
  }

  .logo-text {
    font-size: 28px;
  }

  .slogan {
    font-size: 12px;
    letter-spacing: 2px;
  }

  .card-header h2 {
    font-size: 24px;
  }
}

/* Element UI 组件深度定制 */
.el-form-item__label {
  color: #555;
  font-weight: 500;
  font-size: 14px;
  padding-bottom: 8px;
}
.el-message {
  z-index: 9999 !important;
}
</style>