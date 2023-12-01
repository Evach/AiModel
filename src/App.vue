<template>
  <div id="app">
    <robot @handleShowVoice="handleShowVoice"/>
    <chat />
    <voice-chat ref="voice"/>
  </div>
</template>
<script setup>

import robot from '@/views/robotComponents/robot'
import Chat from "@/views/chatComponents/chat.vue";
import VoiceChat from "@/views/chatComponents/voiceChat.vue";

const voice = ref()
const handleShowVoice = () => {
  voice.value.handleShow()
}
</script>
