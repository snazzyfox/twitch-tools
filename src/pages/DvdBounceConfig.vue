<template>
  <q-page class="q-ma-xl q-gutter-md">
    <h5>DVD Bounce</h5>
    <p>
      A simple small tool that lets you bounce an image around the screen. No built-in integration -
      simply enable the source when you'd like to show it.
    </p>

    <q-form ref="form">
      <h5>Configuration</h5>
      <q-banner class="bg-warning q-mb-lg" rounded>
        OBS limitations make it impossible to include the image in a Browser Source URL. To get
        around this, your image will be uploaded to
        <a href="https://bashupload.com">bashupload.com</a>. They will delete your image as soon as
        it's used once, so your widget URL will only be valid in the first browser you load it in.
      </q-banner>
      <q-uploader
        label="Image File"
        url="https://bashupload.com"
        auto-upload
        field-name="file"
        accept="image/*"
        @uploaded="handleFileUploaded"
      />

      <h5>Customization</h5>
      <slider-field label="Image Size" :min="1" :max="100" unit="%" v-model="config.size" />
      <slider-field
        label="Animation Speed"
        :min="0.1"
        :max="10"
        :step="0.05"
        unit="px"
        v-model="config.speed"
      />
    </q-form>
    <h5>Preview</h5>
    <resizable-preview :default-width="800" :default-height="400">
      <dvd-bounce-widget v-bind="config" preview :image-data-url="previewImageDataUrl" />
    </resizable-preview>

    <h5>Broadcaster Software Settings</h5>
    <generate-copy-widget-link route-name="DvdBounceWidget" :config="config" :form="form" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QForm } from 'quasar';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DvdBounceWidgetConfig } from './widgets/DvdBounceWidget.vue';
import ResizablePreview from 'src/components/ResizablePreview.vue';
import { useStorage } from '@vueuse/core';
import SliderField from 'src/components/SliderField.vue';
import DvdBounceWidget from './DvdBounceWidget.vue';
import GenerateCopyWidgetLink from 'src/components/GenerateCopyWidgetLink.vue';

const form = ref<QForm>();
const config = useStorage('dvdBounce.config', {
  imageUrl: '',
  size: 50,
  speed: 1.0,
} as DvdBounceWidgetConfig);
const previewImageDataUrl = ref('');

function handleFileUploaded({ files, xhr }: { files: readonly File[]; xhr: XMLHttpRequest }) {
  const response = /wget (.*)/.exec(xhr.responseText);
  if (response) {
    config.value.imageUrl = response[1] + '?download=1';
  }
  const reader = new FileReader();
  reader.onload = () => (previewImageDataUrl.value = reader.result as string);
  reader.readAsDataURL(files[0]);
}
</script>

<style scoped lang="sass">
.image-preview
  max-height: 25%
  max-width: 40%
</style>
