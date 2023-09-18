<template>
  <q-field :label="label" :model-value="modelValue" stack-label class="row" borderless>
    <template #control>
      <q-slider
        class="col-grow vertical-middle"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :min="min"
        :max="max"
        :step="step"
        :disable="disable"
      />
      <input
        class="no-border col-3 vertical-middle"
        type="number"
        :value="modelValue"
        @input="$emit('update:modelValue', Number($event.target.value))"
        :disable="disable"
      />
      <span class="vertical-middle">{{ unit }}</span>
    </template>
    <template #after> </template>
    <template #prepend><slot name="prepend" /></template>
    <template #before><slot name="before" /></template>
    <template #append><slot name="append" /></template>
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
  disable?: boolean;
}>();
</script>
