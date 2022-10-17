<template>
  <q-field :label="label" :model-value="modelValue" :prefix="modelValue + (unit || '')" stack-label>
    <q-slider
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :min="min"
      :max="max"
      :step="step"
    />
  </q-field>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number;
  unit?: string;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}>();
</script>
