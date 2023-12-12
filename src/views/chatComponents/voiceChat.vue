<template>
  <el-dialog
      v-model="dialogVisible"
      width="1000px"
      class="dialogWrapper"
      @close="handleClose"
  >
    <wake-up @wakeUp="handleChat"/>

    <div class="chatWrapper">
      <div class="instruct" >您的指令是： <span >{{textData}}</span>
        <v-md-preview :text="textRes" />
      </div>

      <div class="btnOut" @click="handleChat"  >
        <img src="../../assets/huatong.png"
             width="68">
        <p class="btnText">{{start?'开始':'结束'}}</p>
      </div>

      <div  class="musical-scale">
        <div class="scale">
          <div class="em" v-for="(item,index) in 15" :key="index"></div>
        </div>
      </div>

    </div>


  </el-dialog>
</template>

<script setup >
import IatRecorder from '@/utils/IatRecorder.js'
import axios from "axios";
import XunfeiReader from '@/utils/js/index'
import  { EventStreamContentType, fetchEventSource } from "@microsoft/fetch-event-source";
import WakeUp from "@/views/chatComponents/wakeUp.vue";
defineOptions({
  name: 'VoiceChat',
})

const dialogVisible = ref(false)


const APPID = 'fe55ce9c'
const API_SECRET = 'NDQ0YWU5OTIwNTU0YTQwYTc5ZDY3YjM5'
const API_KEY = '64289189a3ec355895b97b8654213155'
const iatRecorder = reactive(new IatRecorder())


const start = ref(true)
const textData = ref('')
const textRes = ref('')

// 录音开始
const startListen = ()=>{
  textData.value = ''
  iatRecorder.start()
  let seconds = 0

  const count = setInterval(() => {
    seconds++
    if (seconds >= 60) {
      iatRecorder.stop()
      start.value = true
      clearInterval(count)
    }
  }, 1000)

  iatRecorder.onWillStatusChange = function(oldStatus, newStatus){
    if(newStatus==='end') {
      console.log('结束听写', this.text)
      setTimeout(() => {
        askWenxin(this.text)
      }, 1000)

    }
  }

}
// 录音结束
const startListenT = () => {
  iatRecorder.stop()
}

const askWenxin = async (mes)=>{
  textData.value = mes
  console.log(9999999999, mes)

  const parmas = {
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
      body: JSON.stringify(parmas),
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
        if (message === '[DONE]') {
        } else if (message?.startsWith('[ERROR]')) {
          // textRes.value = message?.replace('[ERROR]', '')
          // XunfeiReader(textRes.value)
        } else {
          const endIndex = message.indexOf('<references>')
          console.log(endIndex)
          textRes.value = endIndex !== -1 ? message.slice(0, endIndex) : message
        }
      },
    });
    XunfeiReader(textRes.value)
  } catch (err) {

    console.log('Sorry, We meet some error, please try agin later.');
  }

}



const handleChat = () => {
  if (start.value) {
    startListen()
    start.value = false
  } else {
    startListenT()
    start.value = true
  }
}


const handleShow = () => {
  dialogVisible.value = true
}

const handleClose = () => {
  dialogVisible.value = false
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
.chatWrapper {
  background-image: url("../../assets/bg2.png");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 100%;
  height: 500px;
}

.canvas {
  width: 100%;
  height: 100px;
  position: absolute;
  bottom: 0;
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

.instruct {
  min-width: 300px;
  padding: 10px;
  color: rgba(255,255,255,.9);
  font-size: 16px;
  background: rgba(255,255,255,.12);
  letter-spacing: 1px;
  //margin: 0 auto;
  //transform: translateY(100px);
}




.musical-scale {
  position: absolute;
  top: 36%;
  left: 27%;
  width: 80%;
  height: 96px;
  border-radius: 48px;
  z-index: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .scale {
    width: 65%;
    height: 56px;
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
        opacity: 0;
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

</style>
