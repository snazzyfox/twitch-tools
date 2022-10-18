<template>
  <div class="marquee-mask">
    <div class="marquee-text" ref="textElement">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { runningMarquees } from './MarqueeTextGlobal';
const props = defineProps<{
  name: string;
  speed: number;
  enabled: boolean;
}>();

const position = ref(0);
const textElement = ref<HTMLDivElement>();
const PAUSE = 2000;

onMounted(() => {
  if (props.enabled) {
    setTimeout(animate, PAUSE);
  }
});

onUnmounted(() => {
  runningMarquees.delete(props.name);
});

function animate() {
  if (!textElement.value || !textElement.value.parentElement) {
    requestAnimationFrame(animate); // do nothing but still request a frame in case it comes back
  } else if (!props.enabled) {
    runningMarquees.delete(props.name);
    position.value = 0;
    setTimeout(animate, PAUSE);
  } else if (textElement.value.offsetWidth < textElement.value.parentElement.offsetWidth) {
    // fits on screen, no animation
    runningMarquees.delete(props.name);
    position.value = 0;
    requestAnimationFrame(animate);
  } else if (textElement.value.offsetLeft + textElement.value.offsetWidth < 0) {
    // fully off screen to the left
    runningMarquees.delete(props.name);
    if (runningMarquees.size === 0) {
      position.value = textElement.value.parentElement.offsetWidth;
    }
    requestAnimationFrame(animate);
  } else if (Math.abs(position.value) < props.speed) {
    // pause for a few secs when at left end
    position.value = 0;
    setTimeout(() => {
      runningMarquees.add(props.name);
      position.value -= props.speed;
      requestAnimationFrame(animate);
    }, PAUSE);
  } else {
    position.value -= props.speed;
    requestAnimationFrame(animate);
  }
}
</script>

<style scoped lang="sass">
.marquee-mask
  $mask-image: linear-gradient(to right, transparent 0, black 1rem, black calc(100% - 1em), transparent 100%)
  position: relative
  mask-image: $mask-image
  -webkit-mask-image: $mask-image
  white-space: nowrap
  overflow: hidden

.marquee-text
  position: relative
  width: fit-content
  left: calc(1rem + v-bind("position + 'px'"))
</style>
