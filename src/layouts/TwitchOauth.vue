<template>
  <centered-card>
    <p>Signing you in, please wait...</p>
    <q-skeleton type="rect" />
  </centered-card>
</template>

<script setup lang="ts">
import CenteredCard from 'src/components/CenteredCard.vue';
import authStore from 'src/stores/TwitchAuth';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const store = authStore();

onMounted(async () => {
  const paramStr = route.hash.slice(1);
  await store.setAuth(paramStr);
  window.close();
});
</script>
