<template>
  <div>
    <el-container style="height: 900px; border: 1px solid #eee">
      <el-header style="font-size: 40px;background-color: rgb(238, 241, 246)">我的商单
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

      <el-container >
        <el-aside width="230px" style="border: 1px solid #eee;background-color: white">
          <el-menu :default-openeds="['1', '3']">
            <el-submenu index="1">
              <template slot="title"><i class="el-icon-message"></i>功能</template>
              <el-menu-item index="1-1">
                <router-link to="/products">主页</router-link>
              </el-menu-item>

              <el-menu-item index="1-2">
                <router-link to="/myproducts">我的</router-link>
              </el-menu-item>
            </el-submenu>
            <el-submenu index="2">
              <template slot="title"><i class="el-icon-message"></i>关于本软件</template>
              <el-menu-item index="1-1">
                <router-link to="/aboutus">关于我们</router-link>
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
              <el-button type="primary" @click="searchMine()">查询</el-button>
            </el-form-item>
            <el-button type="primary" icon="el-icon-edit" @click="save()" style="margin-left: 20px">新增</el-button>
            <el-dialog title="新增商单" :visible.sync="dialogFormVisible1">
              <el-form :model="form1">
                <el-form-item label="商单描述">
                  <el-input v-model="form1.description" autocomplete="off"></el-input>
                </el-form-item>
                <el-form-item label="商单图片">
                  <el-upload
                      class="avatar-uploader"
                      action="http://localhost:8080/upload"
                      :show-file-list="false"
                      :headers="headers"
                      :on-success="handleAvatarSuccess1"
                      :before-upload="beforeAvatarUpload">
                    <img v-if='imageUrl1' :src='imageUrl1' class="avatar">
                    <img v-else-if="form1.img" :src="form1.img" class="avatar">
                    <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                  </el-upload>
                </el-form-item>
              </el-form>
              <div slot="footer" class="dialog-footer">
                <el-button @click="dialogFormVisible1 = false">取 消</el-button>
                <!--                    绑定确定函数，用户点击表示确定修改-->
                <el-button type="primary" @click=confirm2()>确 定</el-button>
              </div>
            </el-dialog>
            <el-button type="primary" icon="el-icon-edit" @click="multiDelete" :disabled="multipleSelection.length===0"
                       style="margin-left: 20px">
              批量删除
            </el-button>

          </el-form>
          <!--          多选表格-->
          <el-table ref="multipleTable" :data="tableData" border :row-key="getRowkey"
                    @selection-change="handleSelectionChange"
                    @row-click="handleRowClick">
            <!--            //设置多选框-->
            <el-table-column
                type="selection"
                width="55"
                label="全选"
                :reserve-selection="true">
            </el-table-column>
            <el-table-column prop="img" label="图像">
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
            <el-table-column prop="status" label="商单状态">
              <template slot-scope="scope1">
                <!--                利用插值表达式显示目标内容-->
                <!--                scope.row表示获得这一整行的数据-->
                {{ scope1.row.status == 1 ? '完成' : '未完成' }}
              </template>
            </el-table-column>

            <el-table-column prop="createTime" label="发布时间">
            </el-table-column>
            <el-table-column label="操作">
              <!--                声明一个插槽用于存放编辑和删除-->
              <template slot-scope="scope">
                <!--声明一个按钮并将这一行的数据传入其中-->
                <el-button type="primary" size="mini" @click="edit(scope.row.id)">编辑</el-button>
                <el-dialog title="编辑商单" :visible.sync="dialogFormVisible">
                  <el-form :model="form">
                    <el-form-item label="商单描述">
                      <el-input v-model="form.description" autocomplete="off"></el-input>
                    </el-form-item>
                    <el-form-item label="商单状态">
                      <el-select v-model="form.status" placeholder="请选择商单状态">
                        <el-option label="已完成" value=1></el-option>
                        <el-option label="未完成" value=0></el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item>
                      <el-upload
                          class="avatar-uploader"
                          action="http://localhost:8080/upload"
                          :show-file-list="false"
                          :headers="headers"
                          :on-success="handleAvatarSuccess"
                          :before-upload="beforeAvatarUpload">
                        <img v-if='imageUrl' :src='imageUrl' class="avatar">
                        <img v-else-if="form.img" :src="form.img" class="avatar">
                        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                      </el-upload>
                    </el-form-item>
                  </el-form>
                  <div slot="footer" class="dialog-footer">
                    <el-button @click="dialogFormVisible = false">取 消</el-button>
                    <!--                    绑定确定函数，用户点击表示确定修改-->
                    <el-button type="primary" @click=confirm1(form.id)>确 定</el-button>
                  </div>
                </el-dialog>
                <span>  </span>
                <el-button type="primary" size="mini" @click="delet(scope.row.id)" style="margin-left: 20px">删除
                </el-button>
              </template>

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
    //新增商单的确认函数
    confirm2() {
//用户同意更新，进行更新
      //配置请求url
      let url = "http://localhost:8080/products/addmyproduct";
      //发起请求更新后端数据
      axios.post(url,
          {
            "description": this.form1.description,
            "img": this.form1.img,
          }, {
            headers: {
              Authorization: localStorage.getItem('token')
            }
          }).then(() => {
        this.$message({
          message: '新增成功',
          type: 'success'
        });
      });
      // 配置url
      let url1 = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url1, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });
      this.dialogFormVisible1 = false
    },
    //新增商单函数
    save() {
      //显示嵌套对话框的表单
      this.dialogFormVisible1 = true;
    },
    getRowkey(row) {
      return row.id;

    },
    //管理行触发事件
    handleRowClick() {

    },
    //批量删除的函数
    multiDelete() {
      let arr = [];
      if (!this.multipleSelection) {
        alert("集合为空");
      }
      this.multipleSelection.forEach(row => arr.push(row.id))
      //配置删除的url
      let url = "http://localhost:8080/products/";
      for (let i = 0; i < arr.length; i++) {
        if (i == arr.length - 1) {
          url += arr[i];
        } else {
          url += arr[i] + ',';
        }
      }
      //发送删除请求
      axios.delete(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        if (resp.data.code == 1) {
          this.$notify({
            title: '删除成功',
            message: '',
            type: 'success',
            duration: 2000
          });
          //重新加载请求
          // 配置url
          let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
              "&endTime=" + this.searchForm.endTime;
          // 进行请求并且配置请求头
          axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp1 => {
            this.tableData = resp1.data.data.rows;
          });
        } else {
          this.$message("删除失败");
        }
      });
    },
    learnmore() {
      this.$router.push('mine');
    },
    //根据自己的id进行条件分页查询
    searchMine() {
      // 配置url
      let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
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
      let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
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
      let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });
    },
    handleAvatarSuccess(res, file) {
      //成功回调函数
      //在页面上回显
      this.imageUrl = URL.createObjectURL(file.raw);
      //将返回的url地址绑定到表单中
      this.form.img = res.data;
    },
    handleAvatarSuccess1(res, file) {
      //在页面上回显
      this.imageUrl1 = URL.createObjectURL(file.raw);
      //将返回的url地址绑定到表单中
      this.form1.img = res.data;
    },
    //获取选项变化
    handleSelectionChange(val) {
      //将被选中的行集合赋值给Val
      this.multipleSelection = val;
    },
    beforeAvatarUpload(file) {
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 10MB!');
      }
      return isLt2M;
    },
    getTotal() {
      let count;
      //  连接数据库获取所有数据记录数目
      // 配置url
      let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        count = resp.data.data.total;
      })
      return count;
    },
    edit(id) {
      //配置请求url
      let url = "http://localhost:8080/products/seeproduct?id=" + id;
      //发送异步请求,获取数据到表单
      axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        //将数据库中的数据同步到form端
        this.form = resp.data.data;
      });
      // 配置url
      let url1 = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url1, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });
      //设置表单可见选项为真
      this.dialogFormVisible = true;
    },
    confirm1(id) {
      //用户同意更新，进行更新
      //将表单中的id设置为该行商单编号
      this.form.id = id;
      //配置请求url
      let url = "http://localhost:8080/products/editmyproduct";
      //发起请求更新后端数据
      axios.put(url, JSON.stringify(this.form), {
        headers: {
          Authorization: localStorage.getItem('token'),
          "Content-Type": "application/json"
        }
      });
      let url1 = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
          "&endTime=" + this.searchForm.endTime;
      // 进行请求并且配置请求头
      axios.get(url1, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.tableData = resp.data.data.rows;
      });
      this.dialogFormVisible = false
    },
    delet(id) {
      //配置url根据路径参数
      let url = "http://localhost:8080/products/" + id;
      //向后端发起请求删除对应数据
      axios.delete(url, {
        headers: {
          Authorization: localStorage.getItem('token')
        }
      }).then(resp => {
        //如果删除成功则跳出信息提示并且刷新页面数据
        if (resp.data.code == 1) {
          this.$message({message: "删除成功", type: "success"});
          // 配置url
          let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
              "&endTime=" + this.searchForm.endTime;
          // 进行请求并且配置请求头
          axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
            this.tableData = resp.data.data.rows;
          });
        } else {
          this.$message("删除失败");
        }
      });
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
    let url = "http://localhost:8080/mine/consult?page=" + this.pagebean.page + "&pageSize=" + this.pagebean.pageSize + "&info=" + this.searchForm.info + "&startTime=" + this.searchForm.startTime +
        "&endTime=" + this.searchForm.endTime;
    // 进行请求并且配置请求头
    axios.get(url, {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
      this.tableData = resp.data.data.rows;
    });

  },
  data() {
    return {
      idNow: 0,
      form: {
        id: 0,
        description: '',
        status: 0,
        img: '',
      },
      form1: {
        description: '',
        img: '',
      },
      multipleSelection: [],
      imageUrl: '',
      imageUrl1: '',
      headers: {
        'Authorization': localStorage.getItem('token')
      },
      //默认状态下设置对话框为不可见
      dialogFormVisible: false,
      dialogFormVisible1: false,
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
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

a {
  text-decoration: none;
}

a:hover {
  color: cornflowerblue;
}

a:visited {
  color: black;
}
</style>