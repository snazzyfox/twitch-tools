<template>
  <q-field :label="label" :model-value="modelValue" stack-label>
    <q-slider
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      label
      label-always
      switch-label-side
      :label-value="modelValue + (unit || '')"
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
