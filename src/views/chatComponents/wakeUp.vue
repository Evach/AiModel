<script setup>
import Socket from "./socket";
const emit = defineEmits(['wakeUp'])
const websocket = ref()
// socket操作
const initWebsocket = () => {
  if (!websocket.value) {
    const tenantId = 200
    const username = 'hecq'
    const workCenterCode = '01'
    let url = `ws://192.168.0.202:9979/websocket/${tenantId},${username},${workCenterCode}`;
    // app端不支持replaceAll
    const ws = url.indexOf('wss://') === 0 ? 'wss://' : 'ws://';
    url = ws + url.replace(ws, '').replace('http://', '').replace('https://', '').replace('//', '/');

    websocket.value = new Socket(url);
    const agentData = {
      eventName: 'heartBeat',
      message: new Date()
    };
    websocket.value.webStart(agentData, websocketOnMessage);
  }
}
const websocketOnMessage = (e) => {
  if (!e?.data) return;
  const { eventName, message } = JSON.parse(e.data);
  console.log('eventName, message', eventName, message)
  if(eventName === 'test'){
    emit('wakeUp')
  }
}
const closeWebSocket = () => {
  if (websocket.value != null) {
    websocket.value.destoryWebsocket();
  }
}

onMounted(()=>{
  initWebsocket()
})
</script>


