/**
 * Created by lycheng on 2019/8/1.
 *
 * 语音听写流式 WebAPI 接口调用示例 接口文档（必看）：https://doc.xfyun.cn/rest_api/语音听写（流式版）.html
 * webapi 听写服务参考帖子（必看）：http://bbs.xfyun.cn/forum.php?mod=viewthread&tid=38947&extra=
 * 语音听写流式WebAPI 服务，热词使用方式：登陆开放平台https://www.xfyun.cn/后，找到控制台--我的应用---语音听写---个性化热词，上传热词
 * 注意：热词只能在识别的时候会增加热词的识别权重，需要注意的是增加相应词条的识别率，但并不是绝对的，具体效果以您测试为准。
 * 错误码链接：
 * https://www.xfyun.cn/doc/asr/voicedictation/API.html#%E9%94%99%E8%AF%AF%E7%A0%81
 * https://www.xfyun.cn/document/error-code （code返回错误码时必看）
 * 语音听写流式WebAPI 服务，方言或小语种试用方法：登陆开放平台https://www.xfyun.cn/后，在控制台--语音听写（流式）--方言/语种处添加
 * 添加后会显示该方言/语种的参数值
 *
 */

// 1. websocket连接：判断浏览器是否兼容，获取websocket url并连接，这里为了方便本地生成websocket url
// 2. 获取浏览器录音权限：判断浏览器是否兼容，获取浏览器录音权限，
// 3. js获取浏览器录音数据
// 4. 将录音数据处理为文档要求的数据格式：采样率16k或8K、位长16bit、单声道；该操作属于纯数据处理，使用webWork处理
// 5. 根据要求（采用base64编码，每次发送音频间隔40ms，每次发送音频字节数1280B）将处理后的数据通过websocket传给服务器，
// 6. 实时接收websocket返回的数据并进行处理

// ps: 该示例用到了es6中的一些语法，建议在chrome下运行

import CryptoJS from 'crypto-js'
import './jquery.js'
import TransWorker from './transcode?worker'
let transWorker = new TransWorker()
//APPID，APISecret，APIKey在控制台-我的应用-语音听写（流式版）页面获取

const APPID = '5b8a1386'
const API_SECRET = 'ODJiYmMwZDgwMWNmZTM0NGQ0ODg1ZWFk'
const API_KEY = '541cebef8dba06869627f5e3bc2d8c2f'

/**
 * 获取websocket url
 * 该接口需要后端提供，这里为了方便前端处理
 * 接口鉴权
 */
function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    // 请求地址根据语种不同变化
    var url = 'wss://iat-api.xfyun.cn/v2/iat'
    var host = 'iat-api.xfyun.cn'
    var apiKey = API_KEY
    var apiSecret = API_SECRET
    var date = new Date().toGMTString()
    var algorithm = 'hmac-sha256'
    var headers = 'host date request-line'
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    var signature = CryptoJS.enc.Base64.stringify(signatureSha)
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    var authorization = btoa(authorizationOrigin)
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
    resolve(url)
  })
}
class IatRecorder {
  constructor({ language, accent, appId } = {}) {
    let self = this
    this.status = 'null'
    this.text = ''
    this.statusJudge = ''
    this.language = language || 'zh_cn'
    this.accent = accent || 'mandarin'
    this.appId = appId || APPID
    // 记录音频数据
    this.audioData = []
    // 记录听写结果
    this.resultText = ''
    // wpgs下的听写结果需要中间状态辅助记录
    this.resultTextTemp = ''
    transWorker.onmessage = function (event) {
      self.audioData.push(...event.data)
    }
  }
  // 修改录音听写状态
  setStatus(status) {
    // this 指向 IatRecorder类
    this.onWillStatusChange && this.status !== status && this.onWillStatusChange(this.status, status)
    this.status = status
    console.log(this.status, '修改录音听写状态')
  }
  setResultText({ resultText, resultTextTemp } = {}) {
    this.onTextChange && this.onTextChange(resultTextTemp || resultText || '')
    resultText !== undefined && (this.resultText = resultText)
    resultTextTemp !== undefined && (this.resultTextTemp = resultTextTemp)
  }
  // 修改听写参数
  setParams({ language, accent } = {}) {
    language && (this.language = language)
    accent && (this.accent = accent)
  }
  // 连接websocket
  connectWebSocket() {
    return getWebSocketUrl().then(url => {
      let iatWS
      if ('WebSocket' in window) {
        iatWS = new WebSocket(url)
      } else if ('MozWebSocket' in window) {
        iatWS = new MozWebSocket(url)
      } else {
        alert('浏览器不支持WebSocket')
        return
      }
      this.webSocket = iatWS
      this.setStatus('init')
      // 已建立链接，可进行参数发送
      iatWS.onopen = e => {
        this.setStatus('ing')
        // 重新开始录音
        setTimeout(() => {
          this.webSocketSend()
        }, 500)
      }
      // 接受服务器的返回结果
      iatWS.onmessage = e => {
        this.result(e.data)
      }
      iatWS.onerror = e => {
        this.recorderStop()
      }
      iatWS.onclose = e => {
        this.recorderStop()
      }
    })
  }
  // 初始化浏览器录音
  recorderInit() {
    // 兼容性
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia
    // 创建音频环境
    try {
      // 音频本体 webAudioApi 获取的
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      // 恢复之前暂停播放的音频
      this.audioContext.resume()
      if (!this.audioContext) {
        alert('浏览器不支持webAudioApi相关接口')
        return
      }
    } catch (e) {
      if (!this.audioContext) {
        alert('浏览器不支持webAudioApi相关接口')
        return
      }
    }

    // 支持webAudioApi 接口后，获取浏览器录音权限
    //navigator.mediaDevices 该对象可提供对相机和麦克风等媒体输入设备的连接访问，也包括屏幕共享。
    //mediaDevices.getUserMedia 会提示用户给予使用媒体输入的许可，媒体输入会产生一个MediaStream，里面包含了请求的媒体类型的轨道
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: false,
        })
        .then(stream => {
          // 成功后
          getMediaSuccess(stream)
        })
        .catch(e => {
          getMediaFail(e)
        })
    } else if (navigator.getUserMedia) {
      // 兼容性，建议采用第一种，这种方式即将被废弃
      navigator.getUserMedia(
        {
          audio: true,
          video: false,
        },
        stream => {
          getMediaSuccess(stream)
        },
        function(e) {
          getMediaFail(e)
        }
      )
    } else {
      if (navigator.userAgent.toLowerCase().match(/chrome/) && location.origin.indexOf('https://') < 0) {
        alert('chrome下获取浏览器录音功能，因为安全性问题，需要在localhost或127.0.0.1或https下才能获取权限')
      } else {
        alert('无法获取浏览器录音功能，请升级浏览器或使用chrome')
      }
      this.audioContext && this.audioContext.close()
      return
    }
    // 获取浏览器录音权限成功的回调----权限
    let getMediaSuccess = stream => {
      // 创建一个用于通过JavaScript直接处理音频
      this.scriptProcessor = this.audioContext.createScriptProcessor(0, 1, 1)
      this.scriptProcessor.onaudioprocess = e => {
        // 去处理音频数据
        if (this.status === 'ing') {
          transWorker.postMessage(e.inputBuffer.getChannelData(0))
        }
      }
      // 创建一个新的MediaStreamAudioSourceNode 对象，使来自MediaStream的音频可以被播放和操作
      this.mediaSource = this.audioContext.createMediaStreamSource(stream)
      // 连接
      this.mediaSource.connect(this.scriptProcessor)
      this.scriptProcessor.connect(this.audioContext.destination)
      this.connectWebSocket()
    }

    let getMediaFail = (e) => {
      alert('请求麦克风失败')
      this.audioContext && this.audioContext.close()
      this.audioContext = undefined
      // 关闭websocket
      if (this.webSocket && this.webSocket.readyState === 1) {
        this.webSocket.close()
      }
    }
  }
  // 开始录音
  recorderStart() {
    if (!this.audioContext) {
      this.recorderInit()
    } else {
      // 恢复之前被暂停的音频
      this.audioContext.resume()
      // 再去链接websocket
      this.connectWebSocket()
    }
  }
  // 暂停录音
  recorderStop() {

    // safari下suspend后再次resume录音内容将是空白，设置safari下不做suspend
    if (!(/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent))){
      // 方法暂停音频上下文对象中的进度
      this.audioContext && this.audioContext.suspend()
    }
    this.setStatus('end')
  }
  // 处理音频数据
  // transAudioData(audioData) {
  //   audioData = transAudioData.transaction(audioData)
  //   this.audioData.push(...audioData)
  // }
  // 对处理后的音频数据进行base64编码，
  toBase64(buffer) {
    var binary = ''
    var bytes = new Uint8Array(buffer)
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    // 转化为base64，
    return window.btoa(binary)
  }
  // 向webSocket发送数据
  webSocketSend() {
    if (this.webSocket.readyState !== 1) {
      return
    }
    let audioData = this.audioData.splice(0, 1280)
    var params = {
      common: {
        app_id: this.appId,
      },
      business: {
        language: this.language, //小语种可在控制台--语音听写（流式）--方言/语种处添加试用
        domain: 'iat', // 日常用语
        accent: this.accent, //中文方言可在控制台--语音听写（流式）--方言/语种处添加试用
        vad_eos: 1000,
        dwa: 'wpgs', //为使该功能生效，需到控制台开通动态修正功能（该功能免费）
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: this.toBase64(audioData),
      },
    }
    this.webSocket.send(JSON.stringify(params))
    this.handlerInterval = setInterval(() => {
      // websocket未连接
      if (this.webSocket.readyState !== 1) {
        this.audioData = []
        clearInterval(this.handlerInterval)
        return
      }
      // 发送音频为空
      if (this.audioData.length === 0) {
        if (this.status === 'end') {
        this.webSocket.send(
            JSON.stringify({
              data: {
                status: 2,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: '',
              },
            })
          )
          this.audioData = []
          clearInterval(this.handlerInterval)
        }
        return false
      }
      audioData = this.audioData.splice(0, 1280)
      // 中间帧
      this.webSocket.send(
        JSON.stringify({
          data: {
            status: 1,
            format: 'audio/L16;rate=16000',
            encoding: 'raw',
            audio: this.toBase64(audioData),
          },
        })
      )
    }, 40)
  }
  // 识别结束
  result(resultData) {
    console.log(this.status, 'status')
    let jsonData = JSON.parse(resultData)
    if (jsonData.data && jsonData.data.result) {
      let data = jsonData.data.result
      let str = ''
      let resultStr = ''
      let ws = data.ws
      // 拼接所有返回结果
      for (let i = 0; i < ws.length; i++) {
        str = str + ws[i].cw[0].w
      }
      // 开启wpgs会有此字段(前提：在控制台开通动态修正功能)
      // 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
      if (data.pgs) {
        if (data.pgs === 'apd') {
          // 将resultTextTemp同步给resultText
          this.setResultText({
            resultText: this.resultTextTemp,
          })
        }
        // 将结果存储在resultTextTemp中
        this.setResultText({
          resultTextTemp: this.resultText + str,
        })
      } else {
        this.setResultText({
          resultText: this.resultText + str,
        })
      }
    }
    if (jsonData.code === 0 && jsonData.data.status === 2) {
      this.webSocket.close()
    }
    if (jsonData.code !== 0) {
      this.webSocket.close()
    }
  }

  start() {
    console.log('start')
    this.recorderStart()
    this.setResultText({ resultText: '', resultTextTemp: '' })
  }
  stop() {
    this.recorderStop()

  }
  onTextChange = function (results){
    this.text = results
  }

  onWillStatusChange = function (oldStatus, newStatus){
    console.log(newStatus, 'onWillStatusChange')
    this.statusJudge = newStatus
    console.log(newStatus, oldStatus, 111111111111)
  }
}
 export default  IatRecorder
// ======================开始调用=============================
// var vConsole = new VConsole()
// let iatRecorder = new IatRecorder()
// let countInterval
// // 状态改变时触发
// iatRecorder.onWillStatusChange = function(oldStatus, status) {
//   console.log(oldStatus, status, 'eeeeeeee')
//   // 可以在这里进行页面中一些交互逻辑处理：倒计时（听写只有60s）,录音的动画，按钮交互等
//   // 按钮中的文字
//   let text = {
//     null: '开始识别', // 最开始状态
//     init: '开始识别', // 初始化状态
//     ing: '结束识别', // 正在录音状态
//     end: '开始识别', // 结束状态
//   }
//   let senconds = 0
//   $('.taste-button')
//     .removeClass(`status-${oldStatus}`)
//     .addClass(`status-${status}`)
//     .text(text[status])
//   if (status === 'ing') {
//     $('hr').addClass('hr')
//     $('.taste-content').css('display', 'none')
//     $('.start-taste').addClass('flex-display-1')
//     // 倒计时相关
//     countInterval = setInterval(()=>{
//       senconds++
//       $('.used-time').text(`0${Math.floor(senconds/60)}：${Math.floor(senconds/10)}${senconds%10}`)
//       if (senconds >= 60) {
//         this.stop()
//         clearInterval(countInterval)
//       }
//     }, 1000)
//   } else if (status === 'init') {
//     $('.time-box').show()
//     $('.used-time').text('00：00')
//   } else {
//     $('.time-box').hide()
//     $('hr').removeClass('hr')
//     clearInterval(countInterval)
//   }
// }
// // 监听识别结果的变化
// iatRecorder.onTextChange = function(text) {
//   $('#result_output').text(text)
// }
// $('#taste_button, .taste-button').click(function() {
//   if (iatRecorder.status === 'ing') {
//     iatRecorder.stop()
//   } else {
//     iatRecorder.start()
//   }
// })
