<template>
  <span class="preview">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { useFont } from './FontPickerUtils';

const props = defineProps<{
  fontFamily: string;
}>();

useFont(props.fontFamily);
</script>

<style scoped lang="css">
/* @import url(v-bind("getFontCssImportUrl($props.fontFamily)")); */
.preview {
  font-family: v-bind("$props.fontFamily || 'sans-serif'");
}
</style>
