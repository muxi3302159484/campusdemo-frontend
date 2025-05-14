const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'babel-loader', // 添加需要转译的依赖
    'webpack-dev-server'
  ]
})
