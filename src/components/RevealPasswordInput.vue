<template>
  <q-input
    :model-value="$props.modelValue"
    @update:model-value="($event) => $emit('update:modelValue', $event)"
    :type="showSecret ? 'text' : 'password'"
    :label="$props.label"
    :hint="$props.hint"
  >
    <template v-slot:append>
      <q-btn
        :icon="showSecret ? ionEyeOutline : ionEyeOffOutline"
        flat
        round
        @click="showSecret = !showSecret"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { ionEyeOffOutline, ionEyeOutline } from '@quasar/extras/ionicons-v7';

defineProps<{
  modelValue: string;
  label?: string;
  hint?: string;
}>();

defineEmits(['update:modelValue']);

const showSecret = ref(false);
</script>
