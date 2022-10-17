<template>
  <q-card class="preview-card q-pa-md" :style="style">
    <div class="preview-container">
      <q-resize-observer @resize="(size) => (value = size)" />
      <slot />
    </div>
  </q-card>
  <p>
    Drag the card corner to change the preview size. Once you find something that looks good, set
    your broadcasting software to use the size shown below.
  </p>
  <p>
    Width <code>{{ value.width }}px</code>; Height <code>{{ value.height }}px</code>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ref } from 'vue';

const props = defineProps<{
  defaultWidth: number;
  defaultHeight: number;
}>();
const padding = 12;

const value = ref({ width: props.defaultWidth, height: props.defaultHeight });
const style = computed(() => ({
  width: (value.value.width + padding * 2).toString() + 'px',
  height: (value.value.height + padding * 2).toString() + 'px',
}));
</script>

<style scoped lang="sass">
.preview-card
  display: block
  padding: v-bind("padding + 'px'")
  resize: both
  overflow: hidden

.preview-container
  $stripe1: #00000005
  $stripe2: #ffffff05
  background: repeating-linear-gradient(45deg, $stripe1, $stripe1 40px, $stripe2 40px, $stripe2 80px)
  margin: 0
  padding: 0
  height: 100%
  width: 100%
  overflow: clip
</style>
