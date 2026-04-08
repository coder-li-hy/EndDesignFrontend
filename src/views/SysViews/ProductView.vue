<template>
  <div>
    <el-container style="height: 900px; border: 1px solid #eee">
      <el-header style="font-size: 40px;background-color: rgb(238, 241, 246)">校园帮帮
        <i class="el-icon-user-solid"></i>
        <el-col :span="12">
          <el-dropdown trigger="click">
      <span class="el-dropdown-link">
        <i class="el-icon-arrow-down el-icon--right"></i>
      </span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item icon="el-icon-close">
                <router-link to="/login">退出</router-link>
              </el-dropdown-item>
              <!--点击登陆详情进入我的详情页面-->
              <el-dropdown-item icon="el-icon-circle-plus">
                <el-button type="text" @click="learnmore()">登陆详情</el-button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-col>
      </el-header>

      <el-container style="color: #ffffff">
        <el-aside width="230px" style="border: 1px solid #eee;background-color: white">
          <el-menu :default-openeds="['1', '3']">
            <el-submenu index="1">
              <template slot="title"><i class="el-icon-message"></i>功能</template>
              <el-menu-item index="1-1">
                <router-link to="/products">主页</router-link>
              </el-menu-item>

              <el-menu-item index="1-2">
                <!--                后期需改变前端路由路径-->
                <router-link to="/myproducts">我的</router-link>
              </el-menu-item>
            </el-submenu>
            <el-submenu index="2">
              <template slot="title"><i class="el-icon-message"></i>关于本软件</template>
              <el-menu-item index="1-1">
                <router-link to="/aboutus">关于我</router-link>
              </el-menu-item>

              <el-menu-item index="1-2">
                <router-link to="/helpus">帮助</router-link>
              </el-menu-item>
            </el-submenu>
          </el-menu>
        </el-aside>
        <el-main style="margin-top: 80px">
          <!--          表单-->
          <el-form :inline="true" :model="searchForm" class="demo-form-inline">
            <el-form-item label="商单描述">
              <el-input v-model="searchForm.info" placesholder="请输入商单描述"></el-input>
            </el-form-item>
            <!--            <el-form-item label="性别">-->
            <!--              <el-select v-model="searchForm.gender" placeholder="请选择">-->
            <!--                <el-option label="男" value=1></el-option>-->
            <!--                <el-option label="女" value=2></el-option>-->
            <!--              </el-select>-->
            <!--            </el-form-item>-->
            <!--              日期-->
            <el-form-item label="商品创建日期">
              <el-date-picker
                  v-model="searchForm.startTime"
                  value-format="yyyy-MM-dd"
                  type="date"
                  placeholder="选择开始日期"
                  format="yyyy-MM-dd"
              >
              </el-date-picker>
              到
              <el-date-picker
                  v-model="searchForm.endTime"
                  value-format="yyyy-MM-dd"
                  type="date"
                  placeholder="选择结束日期"
                  format="yyyy-MM-dd">
              </el-date-picker>
            </el-form-item>
            <span>    </span>
            <el-form-item>
              <el-button type="primary" @click="search()">查询</el-button>
            </el-form-item>
          </el-form>
          <!--          表格-->
          <el-table :data="tableData" border>
            <el-table-column prop="img" label="相关照片">
              <template slot-scope="scope">
                <img :src="scope.row.img" width="80">
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述">
              <!--              声明一个插槽-->
              <!--              <template slot-scope="scope">-->
              <!--                &lt;!&ndash;                利用插值表达式显示目标内容&ndash;&gt;-->
              <!--                &lt;!&ndash;                scope.row表示获得这一整行的数据&ndash;&gt;-->
              <!--                {{ scope.row.gender == 1 ? '男' : '女' }}-->
              <!--              </template>-->
            </el-table-column>
            <el-table-column prop="name" label="发布人">
            </el-table-column>
            <el-table-column prop="phone" label="联系电话">
            </el-table-column>
            <el-table-column prop="createTime" label="发布时间">
            </el-table-column>
          </el-table>
          <br>
          <!--          增加分页条-->
          <el-pagination
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
              layout="total, sizes, prev, pager, next, jumper"
              :total=getTotal()
              :page-size="10"
              :current-page="1">

          </el-pagination>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script>
import axios from "axios";

export default {
  methods: {
    learnmore() {
      this.$router.push('mine');
    },
    search() {
      // 配置url
      let url = "http://localhost:8080/products/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });


    },
    handleSizeChange(val) {
      //当页面大小改变时，改变pagebean中的参数
      this.pagebean.pageSize = val;
      //发送异步请求获取数据
      // 配置url
      let url = "http://localhost:8080/products/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });

    },
    handleCurrentChange(val) {
      //当页面页码改变时，改变pagebean中的参数
      this.pagebean.page = val;
      //发送异步请求获取数据
      // 配置url
      let url = "http://localhost:8080/products/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });
    },
    getTotal() {
      let count;
      //  连接数据库获取所有数据记录数目
      // 配置url
      let url = "http://localhost:8080/products/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        count = resp.data.data.total;
      })
      return count;
    },
  },
  mounted() {
    // // 在页面挂载完成之后获取来自其他页面的token
    // let to = JSON.parse(this.$route.params.Authorization);
    // //如果未解析到该请求
    // if (to != null) {
    //   this.token = to;
    // }

    // 配置url
    let url = "http://localhost:8080/products/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
        "&endTime=" + this.searchForm.endTime;
    // 进行请求并且配置请求头
    axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
      this.tableData = resp.data.data.rows;
    })

  },
  data() {
    return {
      //将token保存在本地页面以便使用
      tableData: [],
      searchForm: {
        info: '',
        startTime: '',
        endTime: ''
      },
      //pagebean用来绑定当前页面的页码和页面大小
      pagebean: {
        // 默认当前页码
        page: 1,
        pageSize: 10,
      }
    }
  },
};
</script>


<style>
/* 重置 router-link 的默认样式 */
router-link {
  color: inherit; /* 继承父元素的颜色 */
  text-decoration: none; /* 去掉下划线 */
  cursor: pointer; /* 鼠标悬停时显示为指针 */
}

/* 鼠标悬停时的样式 */
router-link:hover {
  text-decoration: none; /* 保持没有下划线 */
}
a {
  text-decoration: none;
}
a:hover {
  color:cornflowerblue;
}
a:visited {
  color:black;
}
</style>