<template>
  <q-page class="q-ma-xl q-gutter-md">
    <div class="text-h4">Spotify Player Overlay</div>
    <p>
      An overlay that displays what you're playing in Spotify, and optionally react to Twitch chat.
    </p>

    <q-form ref="form">
      <div class="text-h5 q-my-md">Configuration</div>
      <spotify-signin v-model="config.spotifyAuth" required />
      <slider-field
        v-model="config.player.autohide.delaySeconds"
        :min="1"
        :max="30"
        :step="1"
        unit="seconds"
        label="Hide Player after"
        hint="Automatically hide the overlay after it's on screen for some time. The overlay will become visible again as soon as a new song starts playing."
        :disable="!config.twitchBot.twitchAuth || !config.player.autohide.enabled"
      >
        <template v-slot:before>
          <q-toggle v-model="config.player.autohide.enabled" />
        </template>
      </slider-field>

      <div class="text-h5 q-my-md">Twitch Bot</div>
      <twitch-signin
        hint="Sign in if you want Twitch related functionalities"
        v-model="config.twitchBot.twitchAuth"
        @update:model-value="handleTwitchAuthChange"
      />

      <twitch-channel-selection
        v-model="config.twitchBot.channelName"
        label="Twitch Channel"
        hint="Twitch channel to listen for commands in"
      />
      <q-input
        v-model="config.twitchBot.commands.info.text"
        label="Command to request song info in chat"
        hint="Viewers can use this command in chat get a reply with the name and link to the playing song."
        :disable="!config.twitchBot.twitchAuth?.token || !config.twitchBot.commands.info.enabled"
        prefix="!"
      >
        <template v-slot:before>
          <q-toggle
            v-model="config.twitchBot.commands.info.enabled"
            :disable="!config.twitchBot.twitchAuth?.token"
          />
        </template>
      </q-input>
      <q-input
        v-model="config.twitchBot.commands.show.text"
        label="Command to show overlay if hidden"
        hint="Viewers can use this command in chat to make the overlay pop up if it's hidden. You can set this to the same command as song info if you want both to happen at the same time."
        :disable="
          !config.twitchBot.twitchAuth?.token ||
          !config.twitchBot.commands.show.enabled ||
          !config.player.autohide.enabled
        "
        prefix="!"
      >
        <template v-slot:before>
          <q-toggle
            v-model="config.twitchBot.commands.show.enabled"
            :disable="!config.twitchBot.twitchAuth?.token || !config.player.autohide.enabled"
          />
        </template>
      </q-input>

      <div class="text-h5 q-my-md">Customization</div>

      <div class="q-gutter-sm row">
        <color-picker-input v-model="config.player.background.color" label="Background Color" />
        <color-picker-input v-model="config.player.background.shadow" label="Background Shadow" />
      </div>

      <div class="q-gutter-sm row">
        <q-toggle
          :model-value="true"
          label="Track Name"
          @click="$q.notify('You can\'t turn off the track name.')"
        />
        <color-picker-input v-model="config.player.trackName.color" label="Color" />
        <slider-field
          v-model="config.player.trackName.size"
          :min="1"
          :max="30"
          :step="0.1"
          unit="%"
          label="Font Size"
        />
      </div>

      <div class="q-gutter-sm row">
        <q-toggle v-model="config.player.artistName.enabled" label="Artist Name" />
        <color-picker-input
          v-model="config.player.artistName.color"
          label="Color"
          :disable="!config.player.artistName.enabled"
        />
        <slider-field
          v-model="config.player.artistName.size"
          :disable="!config.player.artistName.enabled"
          :min="1"
          :max="30"
          :step="0.1"
          unit="%"
          label="Font Size"
        />
      </div>

      <div class="q-gutter-sm row">
        <q-toggle v-model="config.player.albumName.enabled" label="Album Name" />
        <color-picker-input
          v-model="config.player.albumName.color"
          label="Color"
          :disable="!config.player.albumName.enabled"
        />
        <slider-field
          v-model="config.player.albumName.size"
          :disable="!config.player.albumName.enabled"
          :min="1"
          :max="30"
          :step="0.1"
          unit="%"
          label="Font Size"
        />
      </div>

      <div class="q-gutter-sm row">
        <q-toggle v-model="config.player.scroll.enabled" label="Scroll Long Text" />
        <slider-field
          v-model="config.player.scroll.speed"
          :min="0.1"
          :max="5"
          :step="0.1"
          unit="px/s"
          label="Speed"
          :disable="!config.player.scroll.enabled"
        />
      </div>

      <div class="q-gutter-sm row">
        <q-toggle v-model="config.player.progress.bar" label="Show Progress Bar" />
        <q-toggle
          v-model="config.player.progress.elapsed"
          label="Show Elapsed Time"
          :disable="!config.player.progress.bar"
        />
        <q-toggle
          v-model="config.player.progress.length"
          label="Show Song Length"
          :disable="!config.player.progress.bar"
        />
        <color-picker-input
          v-model="config.player.progress.color"
          label="Progress Row Color"
          :disable="!config.player.progress.bar"
        />
      </div>
    </q-form>
    <div class="text-h5 q-my-md">Preview</div>
    <resizable-preview :default-width="640" :default-height="240">
      <spotify-widget v-bind="config" preview />
    </resizable-preview>

    <div class="text-h5 q-my-md">Broadcaster Software Settings</div>
    <generate-copy-widget-link route-name="SpotifyWidget" :config="config" :form="form" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QForm } from 'quasar';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ResizablePreview from 'src/components/ResizablePreview.vue';
import { useStorage } from '@vueuse/core';
import SliderField from 'src/components/SliderField.vue';
import GenerateCopyWidgetLink from 'src/components/GenerateCopyWidgetLink.vue';
import { SpotifyWidgetOptions } from './SpotifyWidget.vue';
import TwitchSignin from 'src/components/TwitchSignin.vue';
import SpotifySignin from 'src/components/SpotifySignin.vue';
import ColorPickerInput from 'src/components/ColorPickerInput.vue';
import SpotifyWidget from './SpotifyWidget.vue';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';

const form = ref<QForm>();
const config = useStorage('spotify.config', {
  twitchBot: {
    channelName: '',
    commands: {
      info: { text: 'song', enabled: true },
      show: { text: 'song', enabled: true },
    },
  },
  player: {
    background: { color: '#191414e0', shadow: '#1914144f' },
    trackName: { color: '#ffffffff', size: 14 },
    artistName: { enabled: true, color: '#ffffffff', size: 8 },
    albumName: { enabled: true, color: '#ffffffff', size: 8 },
    progress: { bar: true, elapsed: true, length: true, color: '#ffffffff' },
    scroll: { enabled: true, speed: 1.5 },
    autohide: { enabled: false, delaySeconds: 10 },
  },
} as SpotifyWidgetOptions);

function handleTwitchAuthChange(auth?: { username: string }) {
  if (auth && !config.value.twitchBot.channelName) {
    config.value.twitchBot.channelName = auth.username;
  } else {
    config.value.twitchBot.channelName = '';
  }
}
</script>

<style scoped lang="sass"></style>
