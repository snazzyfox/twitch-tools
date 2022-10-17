<template>
  <q-layout view="hHr LpR lfr">
    <q-header reveal bordered class="bg-primary text-white" height-hint="90">
      <q-toolbar>
        <q-toolbar-title> <q-icon :name="mdiSword" /> Snazzy's Twitch Tools </q-toolbar-title>
        <!-- <q-btn flat :icon="ionChatboxOutline" @click="toggleRightDrawer" /> -->
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/timer" label="Timer Overlay" />
        <q-route-tab to="/dvd-bounce" label="DVD Bounce" />
      </q-tabs>
    </q-header>

    <!-- <q-drawer show-if-above v-model="rightDrawerOpen" side="right" bordered> -->
    <!-- drawer content -->
    <!-- </q-drawer> -->

    <q-page-container class="page-width">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { mdiSword } from '@quasar/extras/mdi-v7';
// import { ionChatboxOutline } from '@quasar/extras/ionicons-v6';
// import { ref } from 'vue';

// const rightDrawerOpen = ref(false);

// function toggleRightDrawer() {
// rightDrawerOpen.value = !rightDrawerOpen.value;
// }
</script>
