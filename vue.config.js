const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer:{
    port :7000,
    // proxy:{
    //   ["/dev-api"]:{
    //     target:'http://localhost:20011',
    //     changeOrigin:true,
    //     pathRewrite: {
    //       ['^' + "/dev-ap"]: ''
    //     }
    //   }
    // }
  }
})
