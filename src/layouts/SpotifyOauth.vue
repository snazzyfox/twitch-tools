<template>
  <centered-card>
    <p>Signing you in, please wait...</p>
    <q-skeleton type="rect" />
  </centered-card>
</template>

<script setup lang="ts">
import CenteredCard from 'src/components/CenteredCard.vue';
import authStore from 'src/stores/SpotifyAuth';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const store = authStore();

onMounted(async () => {
  // Spotify sends "correct" url with query before has, but router can't read that. Reload the page to flip url order
  // see https://github.com/vuejs/vue-router/issues/2125#issuecomment-519521424
  if (location.search) {
    location.replace(location.pathname + location.hash + location.search);
    return;
  }
  await store.setAuth(route.query as { code: string; state: string });
  window.close();
});
</script>
