<template>
  <body>
  <div class="container">
    <div class="profile-info">
      <img src="../../images/profile.jpg" alt="Profile Picture" class="profile-img">
      <h1>李杭阳</h1>
      <p>前端开发工程师 | 热爱技术与创新</p>
    </div>

    <div class="section">
      <h2>个人简介</h2>
      <p>
        你好，我是一名前端开发工程师，专注于使用HTML、CSS和JavaScript构建用户友好的界面。我热爱技术，喜欢不断学习新技术，并将其应用于实际项目中。在业余时间，我喜欢阅读和旅行。</p>
    </div>

    <div class="section">
      <h2>技能</h2>
      <div class="skills">
        <ul>
          <li>HTML5</li>
          <li>CSS3</li>
          <li>JavaScript</li>
          <li>Java</li>
          <li>C</li>
          <li>Python</li>
          <li>Git</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>项目经验</h2>
      <div class="projects">
        <ul>
          <li>
            <h3>项目名称：<a href="http://localhost:8081/backend/page/login/login.html">在线商城</a></h3>
            <p>
              开发了一个完整的在线商城，包括用户注册、登录、商品展示、购物车和订单管理等功能。使用的技术栈包括Redis,MyBatis,Springboot,vue。</p>
          </li>
          <li>
            <h3>项目名称：<a href="http://localhost:7000/">网上交易平台</a></h3>
            <p>创建了一个网上交易平台，用户可以发布订单，评论和分享内容。使用的技术栈包括MyBatis,Springboot,vue。</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>联系方式</h2>
      <form class="contact-form">
        <label for="name">姓名</label>
        <input type="text" id="name" name="name" required>
        <label for="email">邮箱</label>
        <input type="email" id="email" name="email" required>
        <label for="message">消息</label>
        <textarea id="message" name="message" rows="4" required></textarea>
        <button type="submit">发送</button>
        <router-link to="/products" style="margin: 0 auto;margin-top: 20px">返回</router-link>
      </form>
    </div>
  </div>
  </body>
</template>

<style>
body {
  /* 设置字体为Arial或sans-serif */
  font-family: Arial, sans-serif;
  /* 设置外边距为0 */
  margin: 0;
  /* 设置内边距为0 */
  padding: 0;
  /* 设置背景颜色为#f4f4f4 */
  background-color: #f4f4f4;
  /* 设置文字颜色为#333 */
  color: #333;
  /* 设置动画为fadeIn，持续时间为2s，动画效果为ease-in-out */
  animation: fadeIn 0.8s ease-in-out;
}

a {
  text-decoration: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.container {
  /* 设置容器最大宽度为800px */
  max-width: 800px;
  /* 设置容器左右外边距为0，上下外边距为auto，使容器水平居中 */
  margin: 0 auto;
  /* 设置容器内边距为20px */
  padding: 20px;
  /* 设置容器背景颜色为白色 */
  background: #fff;
  /* 设置容器阴影，阴影大小为10px，颜色为rgba(0, 0, 0, 0.1) */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  /* 设置容器圆角半径为8px */
  border-radius: 8px;
  /* 设置容器变换效果，变换时间为0.5s，变换方式为ease-in-out */
  transition: transform 0.5s ease-in-out;
}

.container:hover {
  transform: scale(1);
}

/* 设置h1、h2、h3标签的字体颜色为#2c3e50 */
h1, h2, h3 {
  color: #2c3e50;
}

.profile-img {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 20px;
  //animation: bounce 1s ease-in-out infinite;
}

/* 定义一个名为bounce的动画，从上到下再回到原位 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 设置个人资料信息样式 */
.profile-info {
  /* 文本居中对齐 */
  text-align: center;
  /* 设置底部外边距为40px */
  margin-bottom: 40px;
}

/* 设置个人资料信息的标题样式 */
.profile-info h1 {
  /* 设置标题字体大小为2.5em */
  font-size: 2.5em;
  /* 设置标题上下边距为10px */
  margin: 10px 0;
}

.profile-info p {
  font-size: 1.2em;
  color: #777;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  border-bottom: 2px solid #2c3e50;
  padding-bottom: 10px;
}

.skills ul, .projects ul {
  list-style-type: none;
  padding: 0;
}

.skills li, .projects li {
  background: #ecf0f1;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.skills li:hover, .projects li:hover {
  transform: scale(1.03);
}

.contact-form {
  /* 设置元素为弹性布局 */
  display: flex;
  flex-direction: column;
}

.contact-form label {
  margin-bottom: 5px;
}

.contact-form input, .contact-form textarea {
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  transition: border-color 0.3s ease-in-out;
}

.contact-form input:focus, .contact-form textarea:focus {
  border-color: #2c3e50;
}

.contact-form button {
  padding: 10px;
  background: #2c3e50;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
}

.contact-form button:hover {
  background: #34495e;
}

a {
  text-decoration: none;
}
</style>
<script setup>
</script>