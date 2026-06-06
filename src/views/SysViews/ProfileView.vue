<template>
  <div class="profile-container">
    <!-- 背景装饰元素（与登录页保持一致） -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <el-container class="main-container">
      <!-- 头部 -->
      <el-header class="header">
        <div class="logo-section">
          <i class="el-icon-s-platform logo-icon"></i>
          <span class="logo-text">智慧教学平台</span>
        </div>
        <div class="slogan">智能匹配 · 高效招聘 · 精准触达</div>
      </el-header>

      <el-main class="main-content">
        <!-- 个人中心卡片 -->
        <div class="profile-card">
          <div class="card-header">
            <h2>个人中心</h2>
            <p class="sub-title">查看和修改您的账户信息</p>
          </div>

          <!-- Tab 切换 -->
          <el-tabs v-model="activeTab" class="profile-tabs">

            <!-- Tab 1: 基本信息 -->
            <el-tab-pane label="基本信息" name="info">
              <el-form :model="userInfo" label-position="top" class="profile-form">

                <!-- 用户名（不可编辑） -->
                <el-form-item label="用户名">
                  <el-input
                      v-model="userInfo.username"
                      prefix-icon="el-icon-user"
                      class="custom-input"
                      disabled
                  ></el-input>
                </el-form-item>

                <!-- 角色（不可编辑） -->
                <el-form-item label="角色">
                  <el-input
                      v-model="roleText"
                      prefix-icon="el-icon-s-custom"
                      class="custom-input"
                      disabled
                  ></el-input>
                </el-form-item>

                <!-- 邮箱 -->
                <el-form-item label="邮箱">
                  <el-input
                      v-model="userInfo.email"
                      placeholder="请输入邮箱"
                      prefix-icon="el-icon-message"
                      class="custom-input"
                  ></el-input>
                </el-form-item>

                <!-- 手机号 -->
                <el-form-item label="手机号">
                  <el-input
                      v-model="userInfo.phone"
                      placeholder="请输入手机号"
                      prefix-icon="el-icon-phone"
                      class="custom-input"
                  ></el-input>
                </el-form-item>

                <!-- 按钮组 -->
                <el-form-item>
                  <el-button
                      type="primary"
                      @click="handleSaveInfo"
                      class="submit-btn"
                      :loading="infoLoading"
                  >
                    {{ infoLoading ? '保存中...' : '保存修改' }}
                  </el-button>
                  <el-button @click="handleReset" class="reset-btn">
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <!-- Tab 2: 修改密码 -->
            <el-tab-pane label="修改密码" name="password">
              <el-form
                  :model="pwdForm"
                  :rules="pwdRules"
                  ref="pwdFormRef"
                  label-position="top"
                  class="profile-form"
              >
                <!-- 原密码 -->
                <el-form-item label="原密码" prop="oldpassword">
                  <el-input
                      type="password"
                      v-model="pwdForm.oldpassword"
                      placeholder="请输入原密码"
                      prefix-icon="el-icon-lock"
                      class="custom-input"
                      show-password
                      autocomplete="off"
                  ></el-input>
                </el-form-item>

                <!-- 新密码 -->
                <el-form-item label="新密码" prop="newpassword">
                  <el-input
                      type="password"
                      v-model="pwdForm.newpassword"
                      placeholder="请输入新密码（6-20位）"
                      prefix-icon="el-icon-key"
                      class="custom-input"
                      show-password
                      autocomplete="new-password"
                  ></el-input>
                </el-form-item>

                <!-- 确认新密码 -->
                <el-form-item label="确认新密码" prop="confirmpassword">
                  <el-input
                      type="password"
                      v-model="pwdForm.confirmpassword"
                      placeholder="请再次输入新密码"
                      prefix-icon="el-icon-key"
                      class="custom-input"
                      show-password
                      autocomplete="new-password"
                  ></el-input>
                </el-form-item>

                <!-- 按钮 -->
                <el-form-item>
                  <el-button
                      type="primary"
                      @click="handleChangePwd"
                      class="submit-btn"
                      :loading="pwdLoading"
                  >
                    {{ pwdLoading ? '修改中...' : '确认修改' }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

          </el-tabs>
        </div>

        <!-- 页脚 -->
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
    // 自定义验证：确认密码是否一致（注意字段名小驼峰）
    const validateConfirm = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.pwdForm.newpassword) {
        callback(new Error('两次输入密码不一致'));
      } else {
        callback();
      }
    };

    return {
      activeTab: 'info',
      infoLoading: false,
      pwdLoading: false,

      // 用户信息表单（字段名与 SysUser 实体类一致）
      userInfo: {
        userId: null,
        username: '',
        role: '',      // ADMIN / TEACHER / STUDENT
        email: '',
        phone: '',
        status: ''
      },
      originalInfo: {},  // 保存原始数据用于重置

      // 修改密码表单（字段名与 SysUserDto 一致：小驼峰）
      pwdForm: {
        oldpassword: '',
        newpassword: '',
        confirmpassword: ''
      },

      // 密码表单验证规则
      pwdRules: {
        oldpassword: [
          { required: true, message: '请输入原密码', trigger: 'blur' }
        ],
        newpassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmpassword: [
          { required: true, validator: validateConfirm, trigger: 'blur' }
        ]
      }
    };
  },

  computed: {
    // 角色英文转中文
    roleText() {
      const roleMap = {
        'ADMIN': '系统管理员',
        'TEACHER': '教师',
        'STUDENT': '学生'
      };
      return roleMap[this.userInfo.role] || this.userInfo.role;
    }
  },

  methods: {
    // 获取用户信息
    fetchUserInfo() {
      // 使用 Session，不需要手动加 Token，浏览器自动携带 Cookie
      axios.get('/api/auth/info')
          .then(resp => {
            // 适配你的 R<T> 返回格式
            if (resp.data.code === 200 || resp.data.code === 1) {
              this.userInfo = { ...resp.data.data };
              this.originalInfo = { ...resp.data.data };
            } else {
              this.$message.error(resp.data.msg || '获取信息失败');
              // 如果未登录，跳转登录页
              if (resp.data.code === 401) {
                this.$router.push('/login');
              }
            }
          })
          .catch(err => {
            this.$message.error('网络请求失败，请检查连接');
            console.error('Fetch profile error:', err);
          });
    },

    // 保存个人信息
    handleSaveInfo() {
      // 简单校验邮箱
      if (this.userInfo.email && !this.isValidEmail(this.userInfo.email)) {
        this.$message.warning('邮箱格式不正确');
        return;
      }

      this.infoLoading = true;

      // 构造请求数据（只传可修改的字段）
      const params = {
        email: this.userInfo.email,
        phone: this.userInfo.phone
        // 如果需要修改其他字段，在这里添加
      };

      axios.put('/api/auth/profile', params)
          .then(resp => {
            if (resp.data.code === 200 || resp.data.code === 1) {
              this.$message.success('信息保存成功');
              this.originalInfo = { ...this.userInfo };
            } else {
              this.$message.error(resp.data.msg);
            }
          })
          .catch(err => {
            this.$message.error('网络请求失败');
            console.error('Save profile error:', err);
          })
          .finally(() => {
            this.infoLoading = false;
          });
    },

    // 重置表单
    handleReset() {
      this.userInfo = { ...this.originalInfo };
      this.$message.info('已恢复原始数据');
    },

    // 修改密码
    handleChangePwd() {
      this.$refs.pwdFormRef.validate(valid => {
        if (!valid) return;

        this.pwdLoading = true;

        // 字段名必须与后端 SysUserDto 完全一致（小驼峰）
        const params = {
          oldpassword: this.pwdForm.oldpassword,
          newpassword: this.pwdForm.newpassword
        };

        axios.put('/api/auth/password', params)
            .then(resp => {
              if (resp.data.code === 200 || resp.data.code === 1) {
                this.$message.success('密码修改成功，请重新登录');
                // 清空 Session（后端会处理），前端清除本地缓存
                localStorage.clear();
                sessionStorage.clear();
                // 跳转登录页
                this.$router.push('/login');
              } else {
                this.$message.error(resp.data.msg || '修改失败');
                // 清空密码输入框
                this.pwdForm.oldpassword = '';
                this.pwdForm.newpassword = '';
                this.pwdForm.confirmpassword = '';
              }
            })
            .catch(err => {
              this.$message.error('网络请求失败');
              console.error('Change password error:', err);
            })
            .finally(() => {
              this.pwdLoading = false;
            });
      });
    },

    // 邮箱格式校验
    isValidEmail(email) {
      const reg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return reg.test(email);
    }
  },

  mounted() {
    this.fetchUserInfo();
  }
}
</script>

<style scoped>
/* ========== 样式与 LoginView.vue 完全保持一致 ========== */

.profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.main-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

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

.main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 40px 50px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
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

.profile-tabs >>> .el-tabs__nav-wrap { padding: 0 20px; }
.profile-tabs >>> .el-tabs__item { font-size: 15px; color: #666; padding: 0 25px; }
.profile-tabs >>> .el-tabs__item.is-active { color: #667eea; font-weight: 500; }
.profile-tabs >>> .el-tabs__active-bar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.profile-form { width: 100%; padding: 10px 10px 0 10px; }

.custom-input >>> .el-input__inner {
  border-radius: 10px;
  border: 2px solid #e8e8e8;
  height: 48px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: #fafafa;
}
.custom-input >>> .el-input__inner:hover { border-color: #667eea; }
.custom-input >>> .el-input__inner:focus {
  border-color: #667eea;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}
.custom-input >>> .el-input__inner:disabled {
  background: #f5f7fa;
  color: #999;
  cursor: not-allowed;
}
.custom-input >>> .el-input__prefix { left: 15px; }
.custom-input >>> .el-input__prefix i { color: #999; font-size: 18px; }
.custom-input >>> .el-input__inner { padding-left: 45px; }

.el-form-item__label {
  color: #555;
  font-weight: 500;
  font-size: 14px;
  padding-bottom: 8px;
}

.el-form-item:last-child {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.submit-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}
.submit-btn:active { transform: translateY(0); }

.reset-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
  border-radius: 10px;
  border: 2px solid #e8e8e8;
  background: #fff;
  color: #666;
  transition: all 0.3s ease;
}
.reset-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.footer-info {
  margin-top: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}
.footer-info p { margin: 0 0 10px 0; }
.footer-link { margin: 0 12px; font-size: 13px; }
.footer-link:hover { color: #fff; }

@media (max-width: 768px) {
  .profile-card { padding: 30px 35px; margin: 0 20px; max-width: 100%; }
  .logo-text { font-size: 28px; }
  .slogan { font-size: 12px; letter-spacing: 2px; }
  .card-header h2 { font-size: 24px; }
  .el-form-item:last-child { flex-direction: column; }
}

.el-message { z-index: 9999 !important; }
</style>