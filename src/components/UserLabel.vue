<template>
  <q-item v-bind="$props">
    <q-item-section side>
      <q-avatar size="sm">
        <q-img :src="$props.imageSrc" alt="Profile Image" />
      </q-avatar>
    </q-item-section>
    <q-item-section>{{ name }}</q-item-section>
    <slot />
  </q-item>
</template>

<script setup lang="ts">
defineProps<{
  imageSrc?: string;
  name?: string;
}>();
</script>
