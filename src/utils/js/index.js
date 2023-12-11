// import {AudioPlayer} from '../dist/index.d.ts'
import './crypto-js'
import './base64'
import '../dist/index.umd.js'
const APPID = 'fe55ce9c'
const API_SECRET = 'NDQ0YWU5OTIwNTU0YTQwYTc5ZDY3YjM5'
const API_KEY = '64289189a3ec355895b97b8654213155'
const audioPlayer = new AudioPlayer("../dist");
audioPlayer.onPlay = () => {
  // changeBtnStatus("PLAY");
};
audioPlayer.onStop = (audioDatas) => {
  console.log(audioDatas);
  // btnStatus === "PLAY" && changeBtnStatus("STOP");
};
function getWebSocketUrl(apiKey, apiSecret) {
  var url = "wss://tts-api.xfyun.cn/v2/tts";
  var host = location.host;
  var date = new Date().toGMTString();
  var algorithm = "hmac-sha256";
  var headers = "host date request-line";
  var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`;
  var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
  var signature = CryptoJS.enc.Base64.stringify(signatureSha);
  var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  var authorization = btoa(authorizationOrigin);
  url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
  return url;
}
function encodeText(text, type) {
  if (type === "unicode") {
    let buf = new ArrayBuffer(text.length * 4);
    let bufView = new Uint16Array(buf);
    for (let i = 0, strlen = text.length; i < strlen; i++) {
      bufView[i] = text.charCodeAt(i);
    }
    let binary = "";
    let bytes = new Uint8Array(buf);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } else {
    return Base64.encode(text);
  }
}

let ttsWS;
function connectWebSocket(readText) {
  const url = getWebSocketUrl(API_KEY, API_SECRET);
  if ("WebSocket" in window) {
    ttsWS = new WebSocket(url);
  } else if ("MozWebSocket" in window) {
    ttsWS = new MozWebSocket(url);
  } else {
    alert("浏览器不支持WebSocket");
    return;
  }
  // changeBtnStatus("CONNECTING");

  ttsWS.onopen = (e) => {
    audioPlayer.start({
      autoPlay: true,
      sampleRate: 16000,
      resumePlayDuration: 1000
    });
    // changeBtnStatus("PLAY");
    var text =
      readText.trim() ||
      "请输入您要合成的文本";
    // var tte = document.getElementById("tte").checked ? "unicode" : "UTF8";
    var tte = "unicode";
    var params = {
      common: {
        app_id: APPID,
      },
      business: {
        aue: "raw",
        auf: "audio/L16;rate=16000",
        vcn: 'xiaoqi',
        // vcn: 'xiaofeng',
        speed: 50,
        volume: 50,
        pitch: 50,
        bgs: 1,
        tte,
      },
      data: {
        status: 2,
        text: encodeText(text, tte),
      },
    };
    ttsWS.send(JSON.stringify(params));
  };
  ttsWS.onmessage = (e) => {
    let jsonData = JSON.parse(e.data);
    // 合成失败
    if (jsonData.code !== 0) {
      console.error(jsonData);
      // changeBtnStatus("UNDEFINED");
      return;
    }
    audioPlayer.postMessage({
      type: "base64",
      data: jsonData.data.audio,
      isLastData: jsonData.data.status === 2,
    });
    if (jsonData.code === 0 && jsonData.data.status === 2) {
      ttsWS.close();
    }
  };
  ttsWS.onerror = (e) => {
    console.error(e);
  };
  ttsWS.onclose = (e) => {
    // console.log(e);
  };
}

export default connectWebSocket
