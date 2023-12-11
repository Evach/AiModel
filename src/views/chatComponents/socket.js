class Socket {
  constructor (wsurl) {
    this.wsurl = wsurl;
    this.websock = null;// 建立的连接
    this.lockReConnect = false;// 是否真正建立连接
    this.timeout = 30 * 1000;
    this.resetTimeout = 5 * 1000;
    this.callback = null;
    this.agentData = null;
    this.timer = null;
    this.heartbeat = null;
    this.heartbeatTimerout = null;
    this.closeConnct = false; // 是否真的关闭连接
    this.initWebSocket();
    this.heartCheck();
  }

  initWebSocket () {
    const that = this;

    try {
      if ('WebSocket' in window) {
        this.websock = new WebSocket(this.wsurl);
        // websocketObj.push(this.websock);
        console.log('重新连接');
        this.websock.onmessage = function (e) {
          that.webMessage(e);
        };
        this.websock.onclose = function (e) {
          that.webClose(e);
        };
        this.websock.onopen = function () {
          that.webOpen();
        };
        this.websock.onerror = function () {
          console.error(
            'websocket连接中断！请刷新重试',
            'error',
            'vab-hey-message-error'
          )
          that.reConnect();
        };
      }
    } catch (e) {
      this.reConnect();
      console.log('reConnect', e);
    }
  }

  reConnect () {
    if (this.websock.readyState === 1) {
      // 状态为1 代表连接正常
      return;
    }
    /* 重新连接 */
    if (this.lockReconnect) {
      return;
    }
    ;
    this.lockReconnect = true;
    // 没连接上会一直重连，设置延迟避免请求过多
    const that = this;
    setTimeout(function () {
      // 新连接
      that.initWebSocket();
      that.lockReconnect = false;
    }, that.resetTimeout);

    // this.heartCheck();
  }

  sendSock () {
    // this.callback = callback;
    // this.heartCheck(agentData);
    // if (this.agentData) {
    const that = this;
    clearTimeout(this.heartbeat);
    clearTimeout(this.heartbeatTimerout);
    this.heartbeatTimerout = null;
    this.heartbeat = null;
    this.heartbeat = setTimeout(() => {
      if (that.websock.readyState == 1) {
        // 心跳连接正常 后端返回一个心跳信息
        that.webSend();
        // 心跳发送后 超时未响应 则断开, 响应了会被重置心跳定时器
        that.heartbeatTimerout = setTimeout(() => {
          // that.webClose();
          if (that.websock.readyState) {
            that.sendSock();
            return;
          }
          console.log('超时未响应');
          that.websock.close();
        }, that.timeout);
      } else {
        that.reConnect();
      }
    }, that.resetTimeout);
    // }
  }

  heartCheck () {
    const that = this;
    that.timer = setInterval(() => {
      that.agentData = {
        eventName: 'heartBeat',
        message: new Date()
      };
      that.webSend();
    }, 60 * 1000);
  }

  webMessage (e) {
    console.log('message');
    this.callback(e);
  }

  webSend () {
    this.websock.send(JSON.stringify(this.agentData));
  }

  webClose (e) {
    console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean);
    clearTimeout(this.heartbeat);
    clearTimeout(this.heartbeatTimerout);
    this.heartbeatTimerout = null;
    this.heartbeat = null;
    if (!this.closeConnct) {
      this.reConnect();
    } else {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  webOpen () {
    console.log('连接成功 start');
    this.sendSock();
  }

  webStart (agentData, callback) {
    this.agentData = agentData;
    this.callback = callback;
  }

  destoryWebsocket () {
    this.closeConnct = true;
    this.websock.close();
  }
}

export default Socket;
