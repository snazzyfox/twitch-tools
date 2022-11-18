<template>
  <q-layout view="hHh LpR fFf">
    <q-header reveal bordered class="bg-primary text-white" height-hint="90">
      <q-toolbar>
        <q-toolbar-title> <q-icon :name="mdiSword" /> Snazzy's Twitch Tools </q-toolbar-title>
        <q-btn
          flat
          :icon="ionLogoGithub"
          href="https://github.com/snazzyfox/twitch-tools"
          target="_blank"
          label="Github"
        />
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/timer" label="Timer Overlay" />
        <q-route-tab to="/dvd-bounce" label="DVD Bounce" />
        <q-route-tab to="/spotify" label="Spotify Overlay" />
        <q-route-tab to="/copy-pasta" label="Copy Pasta Saver" />
      </q-tabs>
    </q-header>

    <q-page-container class="page-width">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { mdiSword } from '@quasar/extras/mdi-v7';
import { ionLogoGithub } from '@quasar/extras/ionicons-v6';
</script>
