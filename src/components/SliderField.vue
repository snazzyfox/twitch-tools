<template>
  <q-field :label="label" :model-value="modelValue" stack-label class="slider-field">
    <q-slider
      class="slider"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      :min="min"
      :max="max"
      :step="step"
      :disable="disable"
    />
    <template v-slot:after>
      <q-input
        class="input"
        type="number"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', Number($event))"
        :suffix="unit"
        :disable="disable"
      />
    </template>
    <template v-slot:prepend><slot name="prepend" /></template>
    <template v-slot:before><slot name="before" /></template>
    <template v-slot:append><slot name="append" /></template>
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
