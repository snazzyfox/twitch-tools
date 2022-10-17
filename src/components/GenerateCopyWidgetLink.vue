<template>
  <p>
    You can add this widget to OBS (or other similar broadcasting software) with a Browser source
    using this URL:
  </p>
  <q-btn type="submit" :icon="ionCheckmark" @click="generateUrl" color="primary">
    Generate URL
  </q-btn>
  <template v-if="widgetUrl">
    <q-btn :icon="ionCopyOutline" @click="copyUrlToClipboard" color="secondary">
      Copy to Clipboard
    </q-btn>
    <q-input readonly v-model="widgetUrl" type="textarea" />
  </template>
</template>

<script setup lang="ts">
import { ionCopyOutline } from '@quasar/extras/ionicons-v6';
import { ionCheckmark } from '@quasar/extras/ionicons-v6';
import { compressToEncodedURIComponent } from 'lz-string';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { QForm } from 'quasar';
const quasar = useQuasar();
const router = useRouter();
const props = defineProps<{
  routeName: string;
  config: object;
  form?: QForm;
}>();

const widgetUrl = ref('');

const configString = computed(() => {
  return compressToEncodedURIComponent(JSON.stringify(props.config));
});

async function generateUrl() {
  let validated = true;
  if (props.form) {
    validated = await props.form.validate(true);
  }
  if (validated) {
    widgetUrl.value =
      window.location.origin +
      window.location.pathname +
      router.resolve({ name: props.routeName, query: { cf: configString.value } }).href;
  } else {
    widgetUrl.value = '';
  }
}

function copyUrlToClipboard() {
  navigator.clipboard.writeText(widgetUrl.value);
  quasar.notify({ color: 'primary', message: 'Copied!' });
}

watch(props.config, () => (widgetUrl.value = ''));
</script>
