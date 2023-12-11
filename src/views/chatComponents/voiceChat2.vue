<template>
  <el-dialog
      v-model="dialogVisible"
      width="1000px"
      class="dialogWrapper"
      @close="handleClose"
  >

    <div class="chatWrapper">
      <div class="instruct" >您的指令是： <span >{{textData}}</span>
<!--        <v-md-editor v-model="textRes" height="400px"></v-md-editor>-->
        <v-md-preview :text="textRes" ></v-md-preview>
      </div>
      <canvas ref="canvas" class="canvas"></canvas>

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

<!--      <p ref="status"></p>-->
<!--      <p ref="output"></p>-->

      <audio ref="audio" style="display: none" :src="mp3" @play="play" @pause="audioEnded" @ended="audioEnded"
             controls></audio>



    </div>


  </el-dialog>
</template>

<script setup >
import mp3 from './1.mp3'
import IatRecorder from '@/utils/IatRecorder.js'
import axios from "axios";
import XunfeiReader from '@/utils/js/index'



defineOptions({
  name: 'VoiceChat',
})

const audio = ref()
const canvas = ref()
const dialogVisible = ref(false)
const audCon = ref()
const source = ref()

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
  // Observe.observe('event',log)
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
}
// 录音结束
const startListenT = () => {
  iatRecorder.onTextChange = function (text) {
    console.log('text', text)
    let inputText = text
    textData.value = inputText.substring(0, inputText.length - 1) //文字处理，因为不知道为什么识别输出的后面都带‘。’，这个方法是去除字符串最后一位
    iatRecorder.stop()
    askWenxin(text)
  }
}

const askWenxin = (mes)=>{
  axios.post("https://lfz4dexaiad3c9ac.aistudio-hub.baidu.com/chat/completions",{
    "messages": [
      {
        "role": "user",
        "content": mes
      }
    ]
  },{headers: {
      "Authorization": "token 8a39dd589e063378a89150c47f089c0edd21942c",
      "Content-Type": "application/json"
    }}).then(res=>{
    if(res.status === 200){
      //json是返回的response提供的一个方法,会把返回的json字符串反序列化成对象,也被包装成一个Promise了
      console.log('res',res)
      textRes.value = res.data.result
      XunfeiReader(textRes.value)
      // startRead()
      // vmsTextDriver()
    }else{
      return {}
    }
  });
}

const speak = (text) => {
  const msg = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(msg);
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
   nextTick(()=>{

    // init()
    // audio.value.play()
    // isStart.value = true
  })

}
const handleClose = () => {
  dialogVisible.value = false
}

// 定义数组和音频分析器
let dataArray = ref(), analyser = ref()


const init = () => {
  // 初始化

  // 初始化canvas的尺寸
  canvas.value.width = window.innerWidth // 窗口的内部宽度
  canvas.value.height = window.innerHeight / 2 //窗口的内部高度
  audCon.value = new AudioContext() // 创建音频上下文
  source.value = audCon.value.createMediaElementSource(audio.value) // 创建音频源节点
}



const openAudio = () => {
  if (isStart.value) {
    audio.value.pause()
    isStart.value = false
  } else {
    audio.value.play()
    isStart.value = true
  }
}
const play = () => {
  // 创建音频分析器
  analyser.value = audCon.value.createAnalyser()
  // 快速傅里叶变换的长度必须为2的整数幂
  analyser.value.fftSize = 512 // 这里把快速傅里叶变换的长度设置为512
  // 连接音频源节点到音频分析器上
  source.value.connect(analyser.value)
  // 连接音频分析器到音频终端上
  analyser.value.connect(audCon.value.destination)
  // 创建数组，用于接收分析器节点的分析数据
  // Uint8Array 数组类型表示一个 8 位无符号整型数组
  // frequencyBinCount是fftSize值的一半作为可视化音频的数组长度
  dataArray.value = new Uint8Array(analyser.value.frequencyBinCount)
  draw()

}

const draw = () => {
  const con = canvas.value.getContext('2d')
// 把分析出的波形绘制到canvas上
  // 动画帧，按帧绘制canvas
  requestAnimationFrame(draw)
  // 清空画布
  const {width, height} = canvas.value
  // if(!width) return
  con.clearRect(0, 0, width, height)
  // 让分析器节点分析出数据到数组中
  analyser.value.getByteFrequencyData(dataArray.value)
  // 设置canvas上下文绘制的颜色
  con.fillStyle = 'skyblue'
  // len表示获取分析到的音频数据数组长度的
  // 这里除以2.5是剔除不经常出现的高频的部分
  const len = dataArray.value.length / 2.5
  // barWidth表示每个波形矩形的宽度
  // 这里除以2是为了绘制对称的波形图
  const barWidth = width / len / 2
  // const barWidth = 20
  for (let i = 0; i < len; i++) {
    // data是8位数组的每个数据，因为是一个字节，即data的值都是 <= 255
    const data = dataArray.value[i]
    // barHeight表示每个波形矩形的高度，值为单位长度乘canvas容器的高
    const barHeight = (data / 255) * height
    // 绘制点y
    const y = height - barHeight
    // 绘制点x1
    const x1 = i * barWidth + width / 2
    // 绘制点x2
    const x2 = width / 2 - (i + 1) * barWidth
    // 绘制右半部分波形图
    con.fillRect(x1, y, barWidth - 2, barHeight)
    // 绘制左半部分波形图
    con.fillRect(x2, y, barWidth - 2, barHeight)
  }
}

const audioEnded = () => {

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