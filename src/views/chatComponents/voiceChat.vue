<template>
  <el-dialog
      v-model="dialogVisible"
      width="1000px"
      class="dialogWrapper"
      @close="handleClose"
  >

    <div class="chatWrapper">
      <div class="instruct" v-if="isStart">您的指令是： <p style="font-size: 18px">决定是否就可回收废旧手机和微软等哈觉得大家还记得</p></div>
      <canvas ref="canvas" class="canvas"></canvas>

      <div class="btnOut" @click="openAudio">
        <img src="../../assets/huatong.png"
             width="68">
      </div>


      <audio ref="audio" style="display: none" :src="mp3" @play="play" @pause="audioEnded" @ended="audioEnded"
             controls></audio>
    </div>


  </el-dialog>
</template>

<script setup lang="ts">
import mp3 from './1.mp3'

defineOptions({
  name: 'VoiceChat',
})

const audio = ref()
const canvas = ref()
const dialogVisible = ref(false)
const audCon = ref()
const source = ref()
const handleShow = () => {
  dialogVisible.value = true
}
const handleClose = () => {
  dialogVisible.value = false
}

// 定义数组和音频分析器
let dataArray = ref(), analyser = ref()
watch(
    () => dialogVisible.value,
    (dialogVisible) => {
      console.log(dialogVisible)
      nextTick(() => {
        init()

      })
    }
)

const init = () => {
  // 初始化

  // 初始化canvas的尺寸
  canvas.value.width = window.innerWidth // 窗口的内部宽度
  canvas.value.height = window.innerHeight / 2 //窗口的内部高度
  audCon.value = new AudioContext() // 创建音频上下文
  source.value = audCon.value.createMediaElementSource(audio.value) // 创建音频源节点
}

const isStart = ref(false)

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
}

.instruct {
  width: 280px;
  padding: 10px;
  color: rgba(255,255,255,.9);
  font-size: 16px;
  background: rgba(255,255,255,.12);
  letter-spacing: 1px;
  //margin: 0 auto;
  //transform: translateY(100px);
}
</style>