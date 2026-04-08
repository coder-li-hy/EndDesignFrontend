<template>
  <div>
    <el-container>

      <el-header style="font-size: 40px;background-color: rgb(238, 241, 246)">我的信息
        <el-col :span="12">
        </el-col>
      </el-header>
      <br>
      <br>
      <br>
      <br>
      <el-main>
        <el-form :model="infoForm" label-width="100px" class="demo-ruleForm">
          <el-form-item label="用户id">
            <el-input v-model="infoForm.id"></el-input>
          </el-form-item>
          <el-form-item label="用户昵称">
            <el-input v-model="infoForm.name" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户头像">
            <el-upload
                class="avatar-uploader"
                action="http://localhost:8080/upload"
                :show-file-list="false"
                :headers="headers"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload">
              <img v-if='imageUrl' :src='imageUrl' class="avatar">
              <img v-else-if="infoForm.img" :src="infoForm.img" class="avatar">
              <i v-else class="el-icon-plus avatar-uploader-icon"></i>
            </el-upload>
          </el-form-item>
          <el-form-item label="用户性别">
            <el-select v-model="infoForm.gender" placeholder="请选择性别">
              <el-option
                  v-for="item in options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="用户电话">
            <el-input v-model="infoForm.phone" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户学院">
            <el-input v-model="infoForm.college" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户专业">
            <el-input v-model="infoForm.profession" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="用户班级">
            <el-input v-model="infoForm.cla" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="danger" @click="change()">修改</el-button>
            <el-dialog
                title="提示"
                :visible.sync="dialogVisible"
                width="30%"
            >
              <span>是否确认修改</span>
              <span slot="footer" class="dialog-footer">
    <el-button @click="dialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="confirm()">确 定</el-button>
  </span>
            </el-dialog>
            <el-button type="primary" @click="back()">返回主页</el-button>
          </el-form-item>
        </el-form>
      </el-main>
    </el-container>

  </div>
</template>
<script>
// import axios from "axios";

import axios from "axios";

export default {
  data() {
    return {
      //选项框的数据
      options: [{
        value: 0,
        label: '女'
      }, {
        value: 1,
        label: '男'
      }],
      data: [],
      //将数据绑定到搜索表单
      infoForm: {
        id: '',
        name: '',
        img: '',
        gender: 1,
        cla: '',
        profession: '',
        college: '',
        password: '',
      },
      imageUrl: '',
      dialogVisible: false,
      headers: {
        Authorization: localStorage.getItem('token')
      }
    };
  },
  //页面挂载，查询回显用户信息
  mounted() {
    //携带token前端发起请求，获取用户信息
    axios.get("http://localhost:8080/mine", {
      headers: {
        Authorization: localStorage.getItem('token'),
      }
    }).then(resp => {
      this.infoForm = resp.data.data;
    });
  },
  methods: {
    change() {
      //点击修改之后，将表格的显示选项生效，弹出表格
      this.dialogVisible = true;
    },

    confirm() {
      // 确认修改，向后端发起请求并发送请求数据
      axios.put("http://localhost:8080/mine", JSON.stringify(this.infoForm), {
        headers: {
          Authorization: localStorage.getItem('token'),
          "Content-Type": "application/json"
        }
      });
      //  修改后重新发起请求请求数据
      axios.get("http://localhost:8080/mine", {headers: {Authorization: localStorage.getItem('token')}}).then(resp => {
        this.infoForm = resp.data.data;
      });

      this.dialogVisible = false
    },
    // 返回主页
    back() {
      this.$router.push('products')
    },
    handleAvatarSuccess(res, file) {
      //成功回调函数
      //在页面上回显
      this.imageUrl = URL.createObjectURL(file.raw);
      //将返回的url地址绑定到表单中
      this.infoForm.img = res.data;
    },
    beforeAvatarUpload(file) {
      const isLt2M = file.size / 1024 / 1024 < 10;
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 10MB!');
      }
      return isLt2M;
    }


  },

}


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
</style>