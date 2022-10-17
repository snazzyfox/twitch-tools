<template>
  <q-page class="row items-center justify-evenly page-width">
    <centered-card>
      <h3>Snazzy's Twitch Tools</h3>
      <p>Select a tool in the navigation bar at the top to start.</p>
    </centered-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import CenteredCard from 'src/components/CenteredCard.vue';

export default defineComponent({
  name: 'IndexPage',
  components: { CenteredCard },
});
</script>
