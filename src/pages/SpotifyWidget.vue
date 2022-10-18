<template>
  <transition>
    <div v-if="playbackState && visible" :key="playbackState?.item?.name || ''" class="container">
      <q-resize-observer @resize="handleResize" />
      <q-icon :name="mdiSpotify" class="spotify-logo" />
      <img class="album-art" :src="playbackState.item.album.images?.[0].url" alt="Album Art" />
      <div class="text-container">
        <div class="track-name">
          <marquee-text
            name="track"
            :speed="$props.player.scroll.speed"
            :enabled="$props.player.scroll.enabled"
          >
            {{ playbackState.item.name }}
          </marquee-text>
        </div>
        <div class="artist-name" v-if="props.player.artistName.enabled">
          <marquee-text
            name="artist"
            :speed="$props.player.scroll.speed"
            :enabled="$props.player.scroll.enabled"
          >
            {{ artistNames }}
          </marquee-text>
        </div>
        <div class="album-name" v-if="props.player.albumName.enabled">
          <marquee-text
            name="album"
            :speed="$props.player.scroll.speed"
            :enabled="$props.player.scroll.enabled"
          >
            {{ playbackState.item.album.name }}
          </marquee-text>
        </div>
        <div class="progress-bar-container">
          <div
            class="time elapsed"
            v-if="props.player.progress.bar && props.player.progress.elapsed"
          >
            {{ formatTime(localProgressMs) }}
          </div>
          <div class="progress-bar" v-if="props.player.progress.bar">
            <div class="progress-bar-elapsed" />
          </div>
          <div class="time total" v-if="props.player.progress.bar && props.player.progress.length">
            {{ formatTime(playbackState.item.duration_ms) }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { SpotifyAuth } from 'src/stores/SpotifyAuth';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { mdiSpotify } from '@quasar/extras/mdi-v7';
import SpotifyWebApi from 'spotify-web-api-js';
import MarqueeText from 'src/components/MarqueeText.vue';
import { useStorage } from '@vueuse/core';
import authStore from 'src/stores/SpotifyAuth';
import ComfyJS from 'comfy.js';

export interface SpotifyWidgetOptions {
  preview?: boolean;

  spotifyAuth?: SpotifyAuth;
  twitchBot: {
    twitchAuth?: { username: string; token: string };
    channelName: string;
    commands: {
      info: { text: string; enabled: boolean };
      show: { text: string; enabled: boolean };
    };
  };
  player: {
    background: { color: string; shadow: string };
    trackName: { color: string; size: number };
    artistName: { enabled: boolean; color: string; size: number };
    albumName: { enabled: boolean; color: string; size: number };
    progress: { bar: boolean; elapsed: boolean; length: boolean; color: string };
    scroll: { enabled: boolean; speed: number };
    autohide: { enabled: boolean; delaySeconds: number };
  };
}

// This is a subclass of what spotify returns so we dont have to bother mocking all the other fields for preview
interface PlaybackState {
  progress_ms: number | null;
  is_playing: boolean;
  item: {
    duration_ms: number;
    album: { name: string; images: Array<{ url: string }> | null };
    artists: Array<{ name: string }>;
    name: string;
    external_urls: { spotify: string };
  };
}
const spotify = new SpotifyWebApi();
const props = defineProps<SpotifyWidgetOptions>();
const playbackState = ref<PlaybackState | null>(null);
const lastKnownToken = useStorage<string>('spotify.auth.lastKnownToken', null);
const store = authStore();
const visible = ref(true);
// progress_ms from spotify jumps back and forth. We keep local progress and only update if out of sync.
const localProgressMs = ref(0);
const size = ref(0);

const MAX_POLL_INTERVAL = 5000;
const artistNames = computed(() => playbackState.value?.item.artists.map((a) => a.name).join(', '));
let timeoutId = -1;
let comfyJsConnected = false;

onMounted(() => {
  if (props.preview) {
    playbackState.value = {
      progress_ms: 69000,
      is_playing: true,
      item: {
        duration_ms: 621000,
        album: {
          name: 'Album Name Goes Here',
          images: [{ url: 'https://via.placeholder.com/800' }],
        },
        artists: Array(4).fill({ name: 'Artist Name' }),
        name: 'This is a Song with a Somewhat Long Name',
        external_urls: { spotify: '' },
      },
    };
    localProgressMs.value = playbackState.value.progress_ms || 0;
  } else {
    if (props.spotifyAuth) {
      startSpotifyBot();
    } else {
      console.error('No spotify auth provided in props.');
    }
    if (props.twitchBot.twitchAuth) {
      startTwitchBot();
    }
  }
});

onUnmounted(() => {
  if (comfyJsConnected) {
    ComfyJS.Disconnect();
  }
});

function startSpotifyBot() {
  if (!store.auth || !lastKnownToken.value || props.spotifyAuth?.token !== lastKnownToken.value) {
    // Only read token from URL if the user passed a new one in. The widget may have refreshed the token itself which will invalidate the URL.
    store.setLocalAuth(props.spotifyAuth);
    lastKnownToken.value = props.spotifyAuth.token;
    spotify.setAccessToken(props.spotifyAuth.token || '');
  } else {
    spotify.setAccessToken(store.auth.token || '');
  }
  updatePlaybackState();
}

async function updatePlaybackState() {
  const lastSong = playbackState.value;
  try {
    const newState = (await spotify.getMyCurrentPlaybackState()) as PlaybackState;
    if (newState.is_playing && newState.item) {
      playbackState.value = newState;
    }
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (e.status === 401 && e.response.includes('token expired')) {
      await store.refreshToken();
    }
  }

  if (lastSong?.item.name !== playbackState.value?.item.name) {
    showPlayer();
  }
  let nextUpdateIn: number;
  if (playbackState.value) {
    nextUpdateIn = Math.min(
      MAX_POLL_INTERVAL,
      playbackState.value.item.duration_ms - (playbackState.value.progress_ms || 0) + 2000 ||
        MAX_POLL_INTERVAL
    );
    if (Math.abs(localProgressMs.value - (playbackState.value.progress_ms || 0)) > 1000) {
      localProgressMs.value = playbackState.value.progress_ms || 0;
    }
  } else {
    localProgressMs.value = 0;
    nextUpdateIn = MAX_POLL_INTERVAL;
  }

  // refresh playback status 1 sec after the current track ends, or in 10 secs, whichever is shorter
  setTimeout(updatePlaybackState, nextUpdateIn);
}

function showPlayer() {
  if (playbackState.value) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    visible.value = true;
    if (props.player.autohide.enabled) {
      timeoutId = window.setTimeout(
        () => (visible.value = false),
        props.player.autohide.delaySeconds * 1000
      );
    }
  }
}

function formatTime(millis: number): string {
  let result = '';
  const hours = Math.floor(millis / 3600000);
  if (hours > 0) {
    result += hours.toString() + ':';
  }
  let minutes = Math.floor((millis % 3600000) / 60000).toString();
  if (hours > 0) {
    minutes = minutes.padStart(2, '0');
  }
  result += minutes + ':';
  const seconds = Math.floor((millis % 60000) / 1000);
  result += seconds.toString().padStart(2, '0');
  return result;
}

function handleResize(newSize: { height: number }) {
  size.value = newSize.height;
}

async function startTwitchBot() {
  if (props.twitchBot.twitchAuth) {
    ComfyJS.onConnected = () => (comfyJsConnected = true);
    ComfyJS.onCommand = (user, command) => {
      if (props.twitchBot.commands.info.enabled && command === props.twitchBot.commands.info.text) {
        if (playbackState.value) {
          ComfyJS.Say(
            `@${user} -> now playing ${playbackState.value.item.name} by ${artistNames.value} on Spotify: ${playbackState.value.item.external_urls.spotify}`,
            props.twitchBot.channelName
          );
        } else {
          ComfyJS.Say(
            `@${user} -> nothing is playing on Spotify at the moment.`,
            props.twitchBot.channelName
          );
        }
      }
      if (props.twitchBot.commands.show.enabled && command === props.twitchBot.commands.show.text) {
        showPlayer();
      }
    };
    ComfyJS.Init(
      props.twitchBot.twitchAuth.username,
      props.twitchBot.twitchAuth.token,
      props.twitchBot.channelName
    );
  }
}
</script>

<style scoped lang="sass">
$background-radius: 1vmin

.v-enter-active, .v-leave-active
  transition: all 0.5s ease

.v-enter-from, .v-leave-to
  opacity: 0
  transform: translateY(100px)

.container
  --main-margin: 12px
  align-items: center
  background: v-bind("$props.player.background.color")
  border-radius: $background-radius
  box-shadow: v-bind("$props.player.background.shadow") 0 0 calc(var(--main-margin) / 2)
  box-sizing: border-box
  display: flex
  font-size: v-bind("size / 100 + 'px'")
  gap: 1%
  padding: 3%
  position: absolute
  height: calc(100% - 4 * var(--main-margin))
  width: calc(100% - 4 * var(--main-margin))
  margin: var(--main-margin)

.spotify-logo
  color: white
  position: absolute
  top: 0.2em
  right: 0.2em
  font-size: 12em

.album-art
  flex: 0 0 auto
  box-shadow: v-bind("$props.player.background.shadow") 0 0 10%
  height: 100%

.text-container
  display: flex
  flex-direction: column
  justify-content: space-between
  height: 70em
  max-width: calc(100% - 90em)
  flex: 1 0 auto

  .track-name
    color: v-bind("$props.player.trackName.color")
    font-size: v-bind("$props.player.trackName.size + 'em'")
    font-weight: 600
    margin-bottom: 0.25em

  .album-name
    color: v-bind("$props.player.albumName.color")
    font-size: v-bind("$props.player.albumName.size + 'em'")

  .artist-name
    color: v-bind("$props.player.artistName.color")
    font-size: v-bind("$props.player.artistName.size + 'em'")

.progress-bar-container
  align-items: center
  justify-content: space-between
  display: flex
  gap: 2.5%
  margin-left: 1rem

.time
  color: v-bind("$props.player.progress.color")
  font-family: monospace
  font-size: 7em

  &.total
    text-align: right

.progress-bar
  background: #ffffff66
  border-radius: 1.2em
  flex: 1
  height: 2.5em
  width: 95%

  .progress-bar-elapsed
    background: v-bind("$props.player.progress.color")
    border-radius: 1.2em
    height: 100%
    max-width: 100%
    width: v-bind("(playbackState ? localProgressMs / playbackState.item.duration_ms * 100 : 0) + '%'")
</style>
