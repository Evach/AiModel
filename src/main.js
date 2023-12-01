import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入 vue-router
// import router from './router'
// 引入 pinia
// import { useUserStore } from './store'
// import store from './store'
// import 'animate.css'
// // 单独引入 ElMessage 和 ElMessageBox 的样式
// import 'element-plus/theme-chalk/el-message.css'
// import 'element-plus/theme-chalk/el-message-box.css'
const app = createApp(App)


app.use(ElementPlus).mount('#app')
