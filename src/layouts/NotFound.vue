<template>
  <centered-card>
    <h3>Page Not Found.</h3>
    <q-separator />
    <q-card-actions align="stretch">
      <q-btn flat :to="{ name: 'Index' }">Go to the home page.</q-btn>
    </q-card-actions>
  </centered-card>
</template>

<script setup lang="ts">
import CenteredCard from 'src/components/CenteredCard.vue';
</script>
