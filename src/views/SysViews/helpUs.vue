<template>
  <el-container>
    <el-header style="font-size: 40px;background-color: rgb(238, 241, 246)">
      帮助
      <router-link to="/products" style="margin-left: 80%">返回</router-link>
    </el-header>
    <el-main>
      <el-tabs v-model="activeName" @tab-click="handleClick">
        <el-tab-pane label="软件概述" name="first">
          <div style="width: 80%;margin: 0 auto">
            <h2 style="font-size: 50px;color: cornflowerblue">
              软件概述
            </h2>
            <h2 style="font-size: 40px;color: steelblue">
              软件用途
            </h2>
            <p style="font-size: 20px">
              校园帮帮榜软件，通过搭建一个基于网页的网上交流平台吗，给校园内的需求方和供应方一个方便快捷的交流平台
            </p>
            <h2 style="font-size: 40px;color: steelblue">
              功能概述
            </h2>
            <ul>
              <li>
                <p style="font-size: 20px">
                  1.软件开发管理员可以管理后台数据。
                </p>
              </li>
              <li>
                <p style="font-size: 20px">
                  2.用户可以进行登录并增加，删除，查看，编辑自己的商单信息，同时查看在这个平台上其他用户发布的商单信息。
                </p>
              </li>
              <li>
                <p style="font-size: 20px">
                  3.用户可以对自己和他人的商单信息进行有条件的模糊查询。
                </p>
              </li>
              <li>
                <p style="font-size: 20px">
                  4.用户可以查看自己的登录状态，修改自己的个人信息。
                </p>
              </li>
            </ul>
          </div>
        </el-tab-pane>

        <el-tab-pane label="登陆界面" name="second">
          <div style="width: 80%;margin: 0 auto">
            <h2 style="font-size: 50px;color: cornflowerblue">
              登陆界面
            </h2>
            <img src="../../images/login.png" alt="加载失败" style="width: 80%">
            <p style="font-size: 20px">
              进入网络软件后，默认进入登陆界面，输入自己的用户名（为自己的学号）和密码(默认123456)，点击“提交”按钮，若用户名和密码正确，网页则会跳出跳出“登录成功”的提示，若是用户名和密码不正确，则跳出“登陆失败”的提示。
              注：若要进行账号的新增注册，请联系后台管理人员。
            </p>

          </div>
        </el-tab-pane>
        <el-tab-pane label="主页" name="third">
          <div style="width: 80%;margin: 0 auto">
            <h2 style="font-size: 50px;color: cornflowerblue">
              主页
            </h2>
            <p style="font-size: 20px">
              在用户登录成功之后将进入该网络软件的主页，在主页中展示的是这个平台中所有的用户发布的未完成的商单信息，用户可以在下方的表格中看到商单编号，商单的图片，商单描述和商单的发布人和联系电话以及商单的发布时间。
            </p>
            <p style="font-size: 20px">
              在主页的左上角有一个下拉图标按钮，用户可以点击该按钮选择下拉选项：退出登录或查看自己的登录详情。
            </p>
            <img src="../../images/mainFrame.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              在主页的侧边栏的功能下拉功能栏，可以对不同的功能模块进行导航，点击主页即跳转到本页面，点击我的可以跳转到对我的商单页面。
            </p>
            <p style="font-size: 20px">
              在右侧主要内容部分上，用户可以在表格中查看这个平台中所有的用户发布的未完成的商单信息。并且可以在上方的搜索框内对商品描述这一栏的内容进行模糊查询，并且通过商品的发布日期对查询结果进行筛选和过滤。
            </p>
            <img src="../../images/mainFrame2.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              为了防止数据过多导致用户查询不便，主页在下方设置了分页条，用户可以通过分页条对多页数据进行查询，还可以自行挑选每页的记录条数。
            </p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="我的商单页面" name="fourth">

          <div style="width: 80%;margin: 0 auto">
            <h2 style="font-size: 50px;color: cornflowerblue">
              我的商单页面
            </h2>
            <p style="font-size: 20px">
              用户在侧边栏点击我的导航栏按钮之后即可进入我的商单页面，在我的商单页面中展示的是用户自己发布的所有商单信息，用户可以在下方的表格中看到商单编号，商单的图片，商单描述和商单的状态，并可以对商单的各种信息进行编辑。
            </p>
            <img src="../../images/myOrder.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              在主页的侧边栏的功能下拉功能栏，可以对不同的功能模块进行导航，点击主页即跳转到本页面，点击我的可以跳转到对我的商单页面。
              在右侧主要内容部分上，用户可以在表格中查看这个平台中所有的用户发布的未完成的商单信息。并且可以在上方的搜索框内对商品描述这一栏的内容进行模糊查询，并且通过商品的发布日期对查询结果进行筛选和过滤。
            </p>
            <img src="../../images/myOrder2.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              在搜索框附近的新增按钮在点击之后可以弹出一个新增商单的页面，用户可以在这个弹出表单的页面填写自己的要求和描述
            </p>
            <img src="../../images/myOrder3.png" alt="加载失败" style="width: 40%;margin-left: 100px;float: left">
            <img src="../../images/myOrder4.png" alt="加载失败" style="width: 40%;margin-left: 0px;float: left">
            <div style="clear: both"></div>
            <p style="font-size: 20px">
              批量删除按钮，可以对用户选中的商单执行删除操作，在用户成功删除之后浏览器会跳出删除成功提示。
              注：为了防止误触，在用户未选中时改按钮处于不可用状态
            </p>
            <img src="../../images/myOrder5.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              在表格的操作栏目中，点击编辑的操作按钮会弹出当前选中商单的详情，用户可以在此页面上对商单的描述，状态，图片进行修改。
            </p>
            <img src="../../images/myOrder6.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              点击删除按钮，用户可以对表格当前行的商单进行删除。
              为了防止数据过多导致用户查询不便，主页在下方设置了分页条，用户可以通过分页条对多页数据进行查询，还可以自行挑选每页的记录条数。
            </p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="登录详情界面" name="fifth">
          <div style="width: 80%;margin: 0 auto">
            <h2 style="font-size: 50px;color: cornflowerblue">
              我的登录详情
            </h2>
            <p style="font-size: 20px">
              在该页面显示了用户当前的登录信息，用户可以在这个页面对自己的信息进行编辑并点击下方的修改进行修改。
            </p>
            <img src="../../images/loginDetail.png" alt="加载失败" style="width: 40%;margin-left: 30%">
            <p style="font-size: 20px">
              页面将弹出是否修改的提示。
            </p>
            <img src="../../images/loginDetail2.png" alt="加载失败" style="width: 80%;margin-left: 100px">
            <p style="font-size: 20px">
              在操作完成之后点击返回主页即可跳转回主页。
            </p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-main>
    <el-footer>

    </el-footer>
  </el-container>

</template>
<script>
export default {
  data() {
    return {
      activeName: 'first'
    };
  },
  methods: {
    handleClick(tab, event) {
      console.log(tab, event);
    }
  }
};
</script>
<style>
p {
  text-indent: 2em;
}

ul {
  list-style: none;
}
</style>