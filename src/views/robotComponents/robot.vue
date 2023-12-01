<script setup lang="ts">
defineOptions({
  name: 'Robot',
})

const emit = defineEmits(['handleShowVoice'])

</script>

<template>
  <div class="robot" @click="emit('handleShowVoice')">
    <img
      src="https://gd-hbimg.huaban.com/c19a4ff73d2b1df1131978fd9747f8d5d3123fd2605a1-XppYJS_fw658webp"
      width="100"
    />
  </div>
</template>

<style scoped lang="postcss">
.robot{
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}
</style>