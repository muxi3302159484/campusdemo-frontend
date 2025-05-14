const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: [
    'babel-loader', // 添加需要转译的依赖
    'webpack-dev-server'
  ],
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // 后端服务端口
        changeOrigin: true,
        pathRewrite: { '^/api': '/api' }
      }
    }
  }
})
