const { defineConfig } = require('@vue/cli-service')
// vue.config.js
// const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')



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
  },

})
