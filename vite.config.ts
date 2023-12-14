import { defineConfig, loadEnv } from 'vite'
import type { ConfigEnv } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { viteMockServe } from 'vite-plugin-mock'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd())
  return {

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        'cp': resolve(__dirname, 'src/components'),
      },
      extensions: ['.js', '.json', '.ts', '.vue'], // 使用路径别名时想要省略的后缀名，可以自己 增减
    },
    build: {
      target: 'esnext',
    },
    server: {
      proxy: {
        // 使用 proxy 实例
        '/api': {
          target: env.VITE_APP_API_BASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
        '/wenxin': {
          target: 'https://lfz4dexaiad3c9ac.aistudio-hub.baidu.com', // 代理的目标地址
          changeOrigin: true, // 搭建代理服务器，开启代理
          // secure: true, // 是否代理https接口
          // ws: true, // 是否代理websockets
          // rewrite: path => path.replace('', '') // 不用路径重写
        },
        '/vmss': {
          target: 'http://vms.cn-huadong-1.xf-yun.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/vmss/, '')
        }
      },
    },

    devServer:{
      port: 150000,
    },
    plugins: [
      vue({
        // 默认开启响应性语法糖
        reactivityTransform: true,
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        // 自定引入 Vue VueRouter API,如果还需要其他的可以自行引入
        imports: ['vue', 'vue-router'],
        // 调整自动引入的文件位置
        dts: 'src/type/auto-import.d.ts',
        // 解决自动引入eslint报错问题 需要在eslintrc的extend选项中引入
        eslintrc: {
          enabled: true,
          // 配置文件的位置
          filepath: './.eslintrc-auto-import.json',
          globalsPropValue: true,
        },
      }),
      /*Components({
        resolvers: [ElementPlusResolver()],
        dts: 'src/type/components.d.ts',
      })*/

    ]
  }
})
