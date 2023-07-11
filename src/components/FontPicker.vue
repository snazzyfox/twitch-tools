<template>
  <q-select
    :model-value="$props.modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :options="fonts"
  >
    <template v-slot:option="option">
      <q-item v-bind="option.itemProps">
        <q-item-section>{{ option.opt }}</q-item-section>
        <q-item-section>
          <font-picker-preview :font-family="option.opt" preview-text="1:23:45">{{
            previewText || option.opt
          }}</font-picker-preview>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import FontPickerPreview from 'src/components/FontPickerPreview.vue';

defineProps<{
  modelValue: string;
  previewText?: string;
}>();

const fonts = [
  'Bebas Neue',
  'Belvesnut Sans',
  'Broaek',
  'Captain Falcon',
  'Courage-Kid',
  'Despair Time',
  'Digital-7 Mono',
  'EGOSTA',
  'Gameplaya',
  'Geologica',
  'Help Alex',
  'Incheon Nights',
  'Legal Vandal Stencil',
  'Monzane',
  'Neo Robotix',
  'Nevolasty',
  'Oblim',
  'Phantom Storm',
  'Rebaston',
  'Robots Revenge',
  'Salma Pro',
  'THEBREAKER',
];
</script>
