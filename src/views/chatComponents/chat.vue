<script setup >
import {
  Position
} from '@element-plus/icons-vue'

defineOptions({
  name: 'Chat',
})

const dialogVisible = ref(false)
const messages = ref([
    {
      type: 'my',
      content: "你好"
    },
    {
      type: 'ai',
      content: "你是"
    },
  {
    type: 'my',
    content: "你好"
  },
])
const newMessage = ref('')

const sendMessage = () => {
  if(String(newMessage.value)){
    messages.value.push({
      type: 'my',
      content: newMessage.value
    })
  }

}
const handleClose = () => {

}
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      title="聊天对话框"
      width="80%"
      @close="handleClose"
  >
    <div class="chat-content">
      <div class="chat-messages" >
        <div  v-for="(message, index) in messages" :key="index" class="message">
          <span :class="['message-avatar', message.type]">
            <img
                :src="message.type === 'my'?'https://gd-hbimg.huaban.com/9c6b71b0b6ef248bac5eb9f39c55275f54937590148ab-SAYLeA_fw658webp':'https://gd-hbimg.huaban.com/917bb8b171e089eed4e0951fabcd369a013b1c0d71f26-E73A6B_fw658webp'"
                width="40"
                alt="">
          </span>
          <div :class="['message-text', message.type]">{{ message.content }}</div>
        </div>
      </div>
      <div class="chat-input">
        <el-input
            v-model="newMessage"
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 8 }"
            placeholder="输入消息..."

        />
        <el-button type="primary" class="send-btn" @click="sendMessage"  :icon="Position"  />
      </div>
    </div>
    <template #footer>
      <div class="chat-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </template>

  </el-dialog>
</template>

<style scoped lang="scss">

.chat-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 50px); /* 减去底部输入框的高度 */

}
.chat-messages {
  flex: 1;
  overflow-y: auto;

}
.message {
  display: flex;
  margin-bottom: 10px;
}
.message-text{
  flex: 1;
  padding: 8px 2px;
  color: #000;
}
.message-text.ai{
  border-radius: 8px;
  padding: 10px;
  background: #fbe7c6;
  margin-bottom: 30px;
  color: #333;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  //background-color: #ccc;
  overflow: hidden;
}
.message-avatar.my {
  //background-color: #1890ff; /* 蓝色，表示自己的头像 */
}
.message-avatar.ai {
  //background-color: #faad14; /* 橙色，表示对方的头像 */
}
.message-text {
  margin-left: 10px; /* 消息文本与头像之间的间距 */
}
.chat-input {
  display: flex;
  justify-content: space-between;
  padding: 40px 0 0;
  margin-left: 50px;
  position: relative;
}
.send-btn{
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 20px;
  border-radius: 20px;
  background: linear-gradient(to right top, #c6e6e8, #10aec2);
  border: none;

}
.chat-footer {
  text-align: right; /* 底部按钮居右对齐 */
}

.chat-content{
   :deep(.el-textarea__inner){
     border: solid 1px transparent!important;
     box-shadow: none;
     background: rgba(0,0,0,.04);
     &:focus{
       border: solid 1px #10aec2!important;

     }

  }
}

</style>