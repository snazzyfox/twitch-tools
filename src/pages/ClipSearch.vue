<template>
  <q-page>
    <q-drawer side="left" bordered :model-value="true" :width="450" :breakpoint="500">
      <q-scroll-area class="fit q-pa-lg">
        <div class="text-h4">Twitch Clip Search</div>
        <p>
          Fetches the list of clips from Twitch API and lets you perform some filtering (or not) to find just that one
          clip
          you're looking for.
        </p>
        <q-form>
          <div class="text-h5 q-my-md">Sign In</div>
          <p>Sign in to Twitch with your own account. Signing in allows us to pull Twitch data on your behalf.</p>
          <twitch-signin v-model="options.twitchAuth" />
        </q-form>
        <q-separator />
        <q-form class="q-gutter-sm">
          <div class="text-h5 q-my-md">Get Clip Data from Twitch</div>
          <twitch-channel-selection v-model="options.channelName" v-model:user-id="options.channelId"
            label="Channel to Search"
            hint="Username of the broadcaster to search for. Either this or game name must be set." clearable />
          <twitch-game-selection v-model="options.gameId" v-model:game-name="options.gameName" label="Game Name to Search"
            hint="Game name to search for. Either this or channel name must be set." clearable />
          <q-input class="col-4" v-model="options.dateRange.from" label="Clip created after"
            hint="YYYY-MM-DD format, UTC timezone." mask="####-##-##" clearable />
          <q-input class="col-4" v-model="options.dateRange.to" label="Clip created before"
            hint="YYYY-MM-DD format, UTC timezone." mask="####-##-##" clearable />
          <q-btn class="q-my-lg" color="primary" :icon="ionDownloadOutline" :loading="loading" @click="getClipsData">
            Download Clip Data
            <template #loading><q-spinner-tail class="on-left" /> {{ loadingAmount }} clips loaded</template>
          </q-btn>
        </q-form>

        <q-form class="q-gutter-sm q-mb-sm" v-if="clipData.length">
          <div class="text-h5 q-my-md">Additional Filters</div>
          <q-input v-model="clipSearch.author.search" label="Clip Author Name" />
          <q-btn-toggle v-model="clipSearch.author.match" :options="[
            { label: 'includes', value: 'include' },
            { 'label': 'starts with', value: 'prefix' },
            { label: 'is exactly', value: 'exact' }
          ]" />

          <q-input v-model="clipSearch.title.search" label="Clip Title" />
          <q-btn-toggle v-model="clipSearch.title.match" :options="[
            { label: 'any word', value: 'any' },
            { label: 'all words', value: 'all' },
            { label: 'whole phrase', value: 'phrase' },
          ]" />
        </q-form>
      </q-scroll-area>
    </q-drawer>

    <div class="q-mb-xl" v-if="clipData.length">
      <q-banner v-if="!filteredClipData.length" class="bg-error">
        There are no clips based on the search criteria you selected.
      </q-banner>

      <div class="row q-col-gutter-md q-ma-md">
        <div v-for="clip in paginatedClipData" :key="clip.id" class="col-4">
          <q-card>
            <a :href="clip.url" target="_blank">
              <q-img class="clip-img" :src="clip.thumbnail_url">
                <div class="absolute-bottom text-subtitle2">{{ clip.title }}</div>
              </q-img>
            </a>
            <q-card-section class="row q-gutter-md align-center">
              <q-img class="game-img col-2" :src="games[clip.game_id]?.box_art_url" />
              <div class="col">
                <div><q-icon :name="ionGameControllerOutline" /> {{ games[clip.game_id]?.name }}</div>
                <div><q-icon :name="ionTvOutline" /> <a :href="'https://www.twitch.tv/' + clip.broadcaster_name"
                    target="_blank"> {{ clip.broadcaster_name }}</a></div>
                <div><q-icon :name="ionPersonOutline" /> <a :href="'https://www.twitch.tv/' + clip.creator_name"
                    target="_blank"> {{ clip.creator_name }}</a></div>
                <div><q-icon :name="ionCalendarClearOutline" /> {{ clip.created_at.substring(0, 10) }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-pagination class="flex flex-center" v-model="currentPage" :max="Math.ceil(filteredClipData.length / PAGE_SIZE)"
        boundary-numbers direction-links max-pages="10" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { QForm, QInput, QBtn } from 'quasar';

import TwitchSignin from 'src/components/TwitchSignin.vue';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';
import TwitchGameSelection from 'src/components/TwitchGameSelection.vue';
import { useStorage } from '@vueuse/core';
import { ionDownloadOutline, ionTvOutline, ionPersonOutline, ionCalendarClearOutline, ionGameControllerOutline } from '@quasar/extras/ionicons-v6';
import { computed, ref } from 'vue';
import { getClips, getGames, TwitchClip, TwitchGame } from 'src/api/twitch';
import { useQuasar } from 'quasar';

interface ClipSearchOptions {
  twitchAuth?: { username: string; token: string };
  channelName?: string,
  channelId?: string,
  gameName?: string,
  gameId?: string,
  dateRange: { from?: string, to?: string };
}
const quasar = useQuasar();

const options = useStorage('clipsearch.config', {
  dateRange: {}
} as ClipSearchOptions);
const clipData = ref<TwitchClip[]>([]);
const loading = ref(false);
const loadingAmount = ref(0);
const clipSearch = ref({
  author: {
    search: '',
    match: 'include' as 'include' | 'prefix' | 'exact'
  },
  title: {
    search: '',
    match: 'any' as 'any' | 'all' | 'phrase'
  }
})
const PAGE_SIZE = 15;
const currentPage = ref(1);
const games = ref<{ [key: string]: TwitchGame }>({});

async function getClipsData() {
  try {
    loading.value = true;
    loadingAmount.value = 0;
    clipData.value = [];
    const dates = {
      started_at: options.value.dateRange.from && new Date(options.value.dateRange.from).toISOString(),
      ended_at: options.value.dateRange.to && new Date(options.value.dateRange.to).toISOString(),
    }
    if (options.value.channelId) {
      clipData.value = await getClips({ broadcaster_id: options.value.channelId, ...dates }, (data) => loadingAmount.value = data.length)
    } else if (options.value.gameId) {
      clipData.value = await getClips({ game_id: options.value.gameId, ...dates }, (data) => loadingAmount.value = data.length)
    } else {
      quasar.notify({
        message: 'You must provide at least a channel name or a game name to search. I cannot pull the list of all clips across all of twitch.',
        type: 'negative',
      })
    }
    if (clipData.value.length) {
      const gameIds = [...new Set(clipData.value.map((clip) => clip.game_id))];
      const newGameIds = gameIds.filter((g) => !games.value[g]);
      if (newGameIds.length) {
        const newGames = await getGames({ id: newGameIds });
        newGames.forEach((g) => games.value[g.id] = g);
      }
    }
  } finally {
    currentPage.value = 1;
    loading.value = false;
  }
}

const filteredClipData = computed(() => clipData.value.filter((clip) =>
  (!options.value.gameId || clip.game_id == options.value.gameId)
  && (
    !clipSearch.value.author.search
    || (clipSearch.value.author.match === 'include' && clip.creator_name.toLowerCase().includes(clipSearch.value.author.search.toLowerCase()))
    || (clipSearch.value.author.match === 'prefix' && clip.creator_name.toLowerCase().startsWith(clipSearch.value.author.search.toLowerCase()))
    || (clipSearch.value.author.match === 'exact' && clip.creator_name.toLowerCase() == clipSearch.value.author.search.toLowerCase())
  ) && (
    !clipSearch.value.title.search
    || (clipSearch.value.title.match === 'all' && clipSearch.value.title.search.toLowerCase().split(/\s+/).every(
      (kwd) => clip.title.toLowerCase().split(/\s+/).some((word) => kwd && word.startsWith(kwd))))
    || (clipSearch.value.title.match === 'any' && clipSearch.value.title.search.toLowerCase().split(/\s+/).some(
      (kwd) => clip.title.toLowerCase().split(/\s+/).some((word) => kwd && word.startsWith(kwd))))
    || (clipSearch.value.title.match === 'phrase' && clip.title.toLowerCase().includes(clipSearch.value.title.search.toLowerCase()))
  )
))

const paginatedClipData = computed(() => filteredClipData.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE))

</script>

<style scoped lang="sass">
.clip-img
  width: 100%

</style>
