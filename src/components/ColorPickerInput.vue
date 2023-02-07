<template>
  <q-input
    :clearable="clearable"
    :label="label"
    :rules="[(val) => !val || /#[0-9a-z]{8}/.test(val) || 'You must enter a valid color code.']"
    :disable="disable"
    :model-value="modelValue"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  >
    <template #prepend>
      <q-icon :name="mdiSquare" :style="{ color: modelValue }" />
    </template>
    <q-popup-proxy>
      <q-color
        no-header
        format-model="hexa"
        :disable="disable"
        :model-value="modelValue"
        @update:model-value="(value) => $emit('update:modelValue', value)"
      />
    </q-popup-proxy>
  </q-input>
</template>

<script setup lang="ts">
import { mdiSquare } from '@quasar/extras/mdi-v7';

defineProps<{
  label?: string;
  clearable?: boolean;
  disable?: boolean;
  modelValue: string;
}>();
</script>
