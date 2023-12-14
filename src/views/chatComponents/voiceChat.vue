<template>
  <el-dialog
      v-model="dialogVisible"
      width="1000px"
      class="dialogWrapper"
      @close="handleClose"
  >
    <wake-up @wakeUp="handleChat"/>

    <div class="chat-wrapper">
      <el-row :gutter="24" type="flex">
        <el-col :md="8" :sm="8" style="position: relative">
          <el-link v-if="mute" :underline="false" class="mute-btn" @click="handlePlay">
            <el-icon><VideoPlay /></el-icon>
          </el-link>
          <el-link v-else :underline="false" class="microphone-btn" @click="handlePause">
            <el-icon><VideoPause /></el-icon>
          </el-link>
          <div id="remote_stream"></div>
<!--          <img src="https://gd-hbimg.huaban.com/8866f440e4854c0e81eb1ad0172d6f250447d84fc96d0-WrNwop_fw658webp" alt="" width="200" style="height: 580px;margin-left: 80px" />-->
        </el-col>
        <el-col :md="16" :sm="16">
          <div class="chat-main">
            <div class="chat-cont" >
              <!--       聊天录音中界面       -->
              <div class="chatting" v-show="start">
                <div  class="musical-scale" >
                  <div class="scale">
                    <div class="em" v-for="(item, index) in 15" :key="index"></div>
                    <span class="chat-countdown">{{ countDown }}</span>
                  </div>
                  <p style="font-size: 16px; margin-top: 40px">{{ curQuestion }}</p>
                </div>


              </div>

              <el-scrollbar ref="scrollbarRef"  height="460px">
                <div ref="innerRef" >
                  <div v-for="(chat, index) in chatList"  :key="index" class="chat-list">
                    <template v-if="chat">
                      <div class="question">
                        <p class="text"> {{ chat.question }}</p>
                        <img src="@/assets/my.webp"  alt="">

                      </div>
                      <div class="answer">
                        <v-md-preview :text="chat.answer" />
                        <el-link
                          :underline="false"
                          class="break-btn"
                          :type="chatList[index].breakFlag?'info':'primary'"
                          :disabled="chatList[index].breakFlag"
                          @click="handleBreakAnswer(index)"
                        >
                          <el-icon><SwitchButton /></el-icon>
                        </el-link>

                      </div>
                    </template>
                  </div>
                </div>
              </el-scrollbar>

              <el-tag
                  v-for="item in commonTags"
                  :key="item.label"
                  :type="item.type"
                  class="chat-tag"
                  effect="light"
                  @click="askWenxin(item.label)"
              >
                {{ item.label }}
              </el-tag>

            </div>

            <!--      提问区      -->
            <div class="chat-input">
              <el-input
                  v-model="chatInput"
                  placeholder="在这里输入"
                  class="input-with-select"
                  style="height: 40px"
              >
                <template #prepend>
                  <el-button style="height: 100%" @click="handleChat">
                    <img :src="chatSrc" alt="" width="24">
                  </el-button>
                </template>
                <template #append>
                  <el-button class="send-btn" @click="askWenxin(chatInput)" >发送</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </el-col>
      </el-row>


    </div>


  </el-dialog>
</template>

<script setup >

import VMS from '@/libs/vms-web-2d-sdk/2.0.0/vms-2d-web-sdk-2.0.0.esm.min';
import { encode, decode } from "js-base64";


import IatRecorder from '@/utils/IatRecorder'
import {XunfeiReader, pause} from "@/utils/js"
import  { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source"
import WakeUp from "@/views/chatComponents/wakeUp.vue";
import chatClose from "@/assets/chat-close.png"
import chatOn from "@/assets/chat-on.png"
import {debounce} from "@/utils/common";
import {
  VideoPause, VideoPlay, SwitchButton
} from '@element-plus/icons-vue'

// AI虚拟人

defineOptions({
  name: 'VoiceChat',
})

const dialogVisible = ref(false)

const APPID = '5b8a1386'
const API_SECRET = 'ODJiYmMwZDgwMWNmZTM0NGQ0ODg1ZWFk'
const API_KEY = '541cebef8dba06869627f5e3bc2d8c2f'
const iatRecorder = reactive(new IatRecorder())

const scrollbarRef = ref() // 滚动条
const innerRef = ref() // 内部聊天内容
const start = ref(false)

const curQuestion = ref()
const chatInput = ref('')
const chatList = ref([ ])
const chatIndex = ref(0)
const chatSrc = ref()
const countDown = ref() // 倒计时计数器
const isDown = ref(false)
const mute = ref(false) // 是否静音
let clearId;

// 常用问题
const commonTags = ref([
  { type: '', label: '如何创建工单' },
  { type: 'success', label: '批记录下载失败怎么办' },
  { type: 'custom', label: '如何配置用户的功能权限' },
  { type: 'danger', label: '如何查看族谱图' },
  { type: 'warning', label: '如何同步数据' },
  { type: 'custom2', label: '如何追踪信息' },
  { type: 'custom3', label: '如何查看维修记录' },
  { type: 'custom4', label: '怎么修改电子签名权限' },
])

// 录音开始
const startListen = ()=>{
  let seconds = 0
  curQuestion.value = ''
  pause()
  iatRecorder.start()
  const count = setInterval(() => {
     curQuestion.value = iatRecorder.text
     seconds++
     if (seconds >= 60) {
       iatRecorder.stop()
       start.value = false
       clearInterval(count)
     }
  }, 1000)


  iatRecorder.onWillStatusChange = function(oldStatus, newStatus){



    if(newStatus==='end') {
      console.log('结束听写', this.text)
      curQuestion.value = this.text
      startCountdown()
      setTimeout(() => {
        // start.value = false
        askWenxin(this.text)
      }, 1000)

    }
  }

}


// 录音结束
const startListenT = () => {
  iatRecorder.stop()
}

// 设置倒计时
const startCountdown = () => {
  countDown.value = 3
  if(isDown.value) return;
  isDown.value = true
  clearId = setInterval(() => {
    console.log('countDown.value////////////', countDown.value)
    countDown.value--
    if(countDown.value === 0){
      // 关闭录音动画 清空计时器
      countDown.value = ''
      isDown.value = false
      start.value = false
      chatSrc.value = chatClose
      clearInterval(clearId)

    }
  }, 1000); // 每隔1秒调用一次
}

// 中断回答
const handleBreakAnswer = (index) => {
  chatList.value[index].breakFlag = true
}


const askWenxin = debounce(async (mes)=>{
  if(!mes) return;
  // chatInput.value = mes
  chatList.value.push({
    question: mes,
    answer: '加载中......',
    breakFlag: false
  })
  // 开始加载 滚动对应位置
  setScrollToBottom()

  console.log(9999999999, chatList.value, chatList.value[chatIndex.value])

  const params = {
    conv_uid: '49cff5ea-97f2-11ee-a134-5405dbf57f3c',
    user_input: mes,
    model_name: 'wenxin_proxyllm',
    chat_mode: 'chat_knowledge',
    select_param: 'MES'
  };
  // console.log('process.env.VITE_APP_API_BASE_URL',process.env.VITE_APP_API_BASE_URL)
  try {
    await fetchEventSource(`http://192.168.0.99:5000/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      openWhenHidden: true,
      async onopen(response) {
        if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
          return;
        }
      },
      onclose() {

      },
      onerror(err) {
        console.log('err', err)
        throw new Error(err);
      },
      onmessage: (event) => {
        const message = event.data?.replaceAll('\\n', '\n');
        if(chatList.value[chatIndex.value].breakFlag) return;
        if (message === '[DONE]') {
        } else if (message?.startsWith('[ERROR]')) {
          // textRes.value = message?.replace('[ERROR]', '')
          // XunfeiReader(textRes.value)
          chatList.value[chatIndex.value].answer = message?.replace('[ERROR]', '')
        } else {
          const endIndex = message.indexOf('<references>')
          chatList.value[chatIndex.value].answer = endIndex !== -1 ? message.slice(0, endIndex) : message
          setScrollToBottom() // 实时滚动到内容最底部
        }
      },
    });

    // 非静音状态播放相关内容
    !mute.value && XunfeiReader(chatList.value[chatIndex.value].answer)


    chatIndex.value += 1
  } catch (err) {
    chatList.value[chatIndex.value].answer = '抱歉，我们遇到了一些问题，请重新再问一次'
    console.log('抱歉，我们遇到了一些问题，请重新再问一次');
  }

}, 1000)

// 滚动到底
const setScrollToBottom = () => {
  nextTick(()=> {
    const max = innerRef.value?.clientHeight
    scrollbarRef.value?.setScrollTop(max)
  })

}



// 控制录音开始关闭
const handleChat = () => {
  if (!start.value) {
    chatSrc.value = chatOn

    startListen()
    start.value = true
  } else {
    startListenT()
    start.value = false
    chatSrc.value = chatClose
  }
}

// const handleWakeUp = () => {
//   handleChat()
//   XunfeiReader('您好，我在，我是智能小助理甘道夫，可以为您提供mes系统相关内容的服务，有什么不清楚的吗？')
// }

const handlePause = () => {
  mute.value = true
  pause()
}

const handlePlay = () => {
  mute.value = false
  XunfeiReader(chatList.value[chatIndex.value-1].answer)
}

// 启动虚拟人服务
const startVms = ()=>{
  VMS.start({
    appId: APPID,
    apiKey: API_KEY,
    apiSecret: API_SECRET,
    width: 1920, //宽度，可取 1920、1280、720
    height: 1080, // 高度，可取1080、720、405
    moveH:100,
    moveV:100,
    scale:0.8,
    maskRegion:'[0,154,1080,1472]',
    avatarId: '110017006', //形象ID马可
    // avatarId: '110278006 ', //形象ID马可
    streamDomId: 'remote_stream' //虚拟人视频流要渲染的Dom Id
  })
      .then(() => {
        console.log('启动虚拟人服务成功'); //成功回调
      })
      .catch(() => {
        console.log('启动虚拟人服务失败'); //失败回调
      });
}

// 结束虚拟人服务
const stopVms = () => {
  VMS.stop()
      .then(() => {
        console.log('结束虚拟人服务成功'); //成功回调
      })
      .catch(() => {
        console.log('结束虚拟人服务失败'); //失败回调
      });
}


// 输入文本数据，驱动虚拟人
const vmsTextDriver = () => {
  VMS.textDriver({
    parameter: {
      tts: {
        // 合成参数
        vcn: 'x3_mingge', // 发音人
        speed: 50, // 语速：[0,100]，默认50
        pitch: 50, // 语调：[0,100]，默认50
        volume: 50 // 音量：[0,100]，默认50
      }
    },
    payload: {
      text: {
        // 驱动音频
        encoding: 'utf8',
        compress: 'raw',
        format: 'json',
        text: encode(chatList.value[chatIndex.value-1].answer)
      }
    }
  })
      .then(res => {})
      .catch(e => {});
}

const handleShow = () => {
  dialogVisible.value = true
  chatSrc.value = chatClose
  // startVms()
  window.addEventListener('keydown', keyDown)
}

const handleClose = () => {
  window.removeEventListener('keydown', keyDown, false)
  dialogVisible.value = false
}



// 点击回车键登录
const keyDown = (e) => {
  if (e.keyCode === 13 || e.keyCode === 100) {
    askWenxin(chatInput.value)
  }
}

defineExpose({
  handleShow
})
</script>


<style>
.dialogWrapper {
  .el-dialog__body {
    padding: 0 !important;
  }

  .el-dialog__header {
    display: none !important;
  }
}

</style>
<style scoped lang="scss">
.chat-wrapper {
  height: 600px;
}

.mute-btn,.microphone-btn{
  font-size: 30px;
  position: absolute;
  top: 20px;
  right: 20px;
}

.btnOut {
  position: absolute;
  top: 50%;
  left: 67%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  opacity: .8;
  z-index: 9;
  .btnText{
    color: #fff;
    text-align: center;
    margin: 10px 0 0;
    font-size: 18px;
  }
}





.musical-scale {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 150px;
  transform: translate(-50%, -50%);
  border-radius: 48px;
  z-index: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .scale {
    width: 65%;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .em {
      display: block;
      background: #16a98a;
      width: 4px;
      height: 10%;
      float: left;

      &:last-child {
        margin-right: 0px;
      }

      &:nth-child(1),
      &:nth-child(15) {
        animation: load 2.5s 1.4s infinite linear;
      }

      &:nth-child(2),
      &:nth-child(14) {
        animation: load 2.5s 1.2s infinite linear;
      }

      &:nth-child(3),
      &:nth-child(13) {
        animation: load 2.5s 1s infinite linear;
      }

      &:nth-child(4),
      &:nth-child(12) {
        animation: load 2.5s 0.8s infinite linear;
      }

      &:nth-child(5),
      &:nth-child(11) {
        animation: load 2.5s 0.6s infinite linear;
      }

      &:nth-child(6),
      &:nth-child(10) {
        animation: load 2.5s 0.4s infinite linear;
      }

      &:nth-child(7),
      &:nth-child(9) {
        animation: load 2.5s 0.2s infinite linear;
      }

      &:nth-child(8) {
        animation: load 2.5s 0s infinite linear;
      }

      @keyframes load {
        0% {
          height: 10%;
        }

        50% {
          height: 100%;
        }

        100% {
          height: 10%;
        }

      }
    }
  }
}

:deep(.vuepress-markdown-body){
  background: rgba(0,0,0,.2);
  color: white;
}

.chat-cont{
  position: relative;
  border: solid 1px rgba(0,0,0,.2);
  margin: 10px;
}

.chat-list{
  display: flex;
  flex-direction: column;
  padding: 8px;

  .question{
    align-self: flex-end;
    margin: 10px 2px 20px 20px;
    display: flex;
    align-items: center;

    .text{
      background: rgba(155, 217, 217, 0.8);
      padding: 10px;
      border-radius: 8px;
      margin-right: 10px;
    }

    img{
      width: 48px;
      height: 48px;
    }
  }
  .answer{
    position: relative;
    align-self: flex-start;
    background: rgba(241, 245, 249, .96);
    margin-right: 50px;
    margin-bottom: 40px;
    border-radius: 8px;
    min-width: 120px;
    :deep(.github-markdown-body){
      padding: 10px 16px 16px;
    }
  }


}

.chatting{
  position: absolute; 
  top: 0;
  height: 100%;
  width: 100%;
  background: #fff;
  z-index: 999;
}

.chat-input{
  padding: 0 10px;
}

.send-btn{
  cursor: pointer;
  &:hover{
    color: #007b84!important;
  }
}

.chat-tag{
  margin: 5px;
  cursor: pointer;
}

.chat-countdown{
  font-size: 150px;
  color: #c45656;
  position: absolute;
  top: -100%;
  left: 211px;

  animation: flipOutY 1s ease both infinite;

}

:deep(.el-tag--custom){
  color: plum;
  background-color: rgba(221, 160, 221, 0.1);
  border-color: rgba(221, 160, 221, 0.2);
}

:deep(.el-tag--custom2){
  color: #f58db5;
  background-color: rgba(245, 141, 181, 0.1);
  border-color: rgba(245, 141, 181, 0.2);
}

:deep(.el-tag--custom4){
  color: rgba(165, 42, 42, 0.8);
  background-color: rgba(165, 42, 42, 0.1);
  border-color: rgba(165, 42, 42, 0.2);
}

:deep(.el-tag--custom3){
  color: rgba(43, 97, 168, 0.8);
  background-color: rgba(42, 95, 165, 0.1);
  border-color: rgba(42, 95, 165, 0.2);
}



@keyframes flipOutY { // 倒计时动画
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}


:deep(.github-markdown-body){
  p[data-v-md-line="1"]{

  }

  ol{
    font-size: 15px;
    color: rgba(77, 85, 99, .9);
  }
}

.break-btn{
  padding: 0;
  font-size: 20px;
  position: absolute;
  bottom: 10px;
  right: 10px;
}

</style>
