<template>
  <q-field :label="label" :model-value="modelValue" stack-label class="slider-field" borderless>
    <q-slider
      class="slider"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :min="min"
      :max="max"
      :step="step"
      :disable="disable"
    />
    <template #after>
      <q-input
        borderless
        class="input"
        type="number"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', Number($event))"
        :suffix="unit"
        :disable="disable"
      />
    </template>
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

<style scoped lang="sass">
.slider-field
  flex-grow: 1
</style>
