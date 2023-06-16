<template>
  <div class="container" id="dvd-bounce-widget-container">
    <img :src="imageDataUrl" id="dvd-bounce-widget-img" />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useStorage } from '@vueuse/core';
import { onMounted, watch } from 'vue';

export interface DvdBounceWidgetConfig {
  preview?: boolean;
  imageUrl: string;
  imageDataUrl?: string;
  size: number;
  speed: number;
}

let dx = Math.random() > 0.5 ? 1 : -1,
  dy = Math.random() > 0.5 ? 1 : -1;

const props = defineProps<DvdBounceWidgetConfig>();
const savedImageUrl = useStorage('dvdBounceWidget.imageUrl', '');
const savedImageDataUrl = useStorage('dvdBounceWidget.image', '');
let container: HTMLDivElement;
let img: HTMLImageElement;
let position = { left: 0, top: 0 };

onMounted(async () => {
  if (props.preview) {
    // image transfer urls are single-use. Don't waste it on the preview
    watch(
      () => props.imageDataUrl,
      (value) => (savedImageDataUrl.value = value)
    );
  } else if (savedImageUrl.value !== props.imageUrl) {
    // Check if imageUrl has changed since image was last downloaded.
    // Since we use a temp file hosting service, the file will most likely be gone after initial use.
    const response = await fetch(props.imageUrl);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onload = () => (savedImageDataUrl.value = reader.result!.toString());
    reader.readAsDataURL(blob);
    savedImageUrl.value = props.imageUrl;
  }

  img = document.getElementById('dvd-bounce-widget-img') as HTMLImageElement;
  container = document.getElementById('dvd-bounce-widget-container') as HTMLDivElement;
  position = {
    left: (container.clientWidth - img!.clientWidth) * Math.random(),
    top: (container.clientHeight - img!.clientHeight) * Math.random(),
  };
  animate();
});

function animate() {
  // flip direction if at edge
  if (position.left < 0) {
    dx = 1;
  } else if (position.left > container.clientWidth - img!.clientWidth) {
    dx = -1;
  }
  if (position.top < 0) {
    dy = 1;
  } else if (position.top > container.clientHeight - img!.clientHeight) {
    dy = -1;
  }
  // move the image
  position.left += dx * props.speed;
  position.top += dy * props.speed;

  // note: animation is achieved by accessing the image directly, outside of vue, for better performance.
  img!.style.height = (img!.naturalHeight * props.size) / 100 + 'px';
  img!.style.width = (img!.naturalWidth * props.size) / 100 + 'px';
  img!.style.left = position.left.toString() + 'px';
  img!.style.top = position.top.toString() + 'px';
  window.requestAnimationFrame(animate);
}
</script>

<style scoped lang="sass">
.container
  position: relative
  height: 100%
  width: 100%

img
  position: absolute
</style>
