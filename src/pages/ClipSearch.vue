<template>
  <q-page style="height: 0">
    <q-splitter v-model="splitLocation" :limits="[10, 50]" class="fit">
      <template #before>
        <div class="q-ma-lg">
          <div class="text-h4">Twitch Clip Search</div>
          <p>
            Fetches the list of clips from Twitch API and lets you perform some filtering (or not)
            to find just that one clip you're looking for.
          </p>
          <q-form>
            <div class="text-h5 q-my-md">Sign In</div>
            <p>
              Sign in to Twitch with your own account. Signing in allows us to pull Twitch data on
              your behalf.
            </p>
            <twitch-signin v-model="options.twitchAuth" />
          </q-form>
          <q-separator />
          <q-form class="q-gutter-sm">
            <div class="text-h5 q-my-md">Get Clip Data from Twitch</div>
            <twitch-channel-selection
              v-model="options.channelName"
              v-model:user-id="options.channelId"
              label="Channel to Search"
              hint="Username of the broadcaster to search for. Either this or game name must be set."
              clearable
            />
            <twitch-game-selection
              v-model="options.gameId"
              v-model:game-name="options.gameName"
              label="Game Name to Search"
              hint="Game name to search for. Either this or channel name must be set."
              clearable
            />
            <q-input
              class="col-4"
              v-model="options.dateRange.from"
              label="Clip created after"
              hint="YYYY-MM-DD format, UTC timezone."
              mask="####-##-##"
              clearable
            />
            <q-input
              class="col-4"
              v-model="options.dateRange.to"
              label="Clip created before"
              hint="YYYY-MM-DD format, UTC timezone."
              mask="####-##-##"
              clearable
            />
            <q-btn
              class="q-my-lg"
              color="primary"
              :icon="ionDownloadOutline"
              :loading="loading"
              @click="getClipsData"
            >
              Download Clip Data
              <template #loading
                ><q-spinner-tail class="on-left" /> {{ loadingAmount }} clips loaded</template
              >
            </q-btn>
          </q-form>

          <q-form class="q-gutter-sm q-mb-sm" v-if="clipData.length">
            <div class="text-h5 q-my-md">Additional Filters</div>
            <q-input v-model="clipSearch.author.search" label="Clip Author Name">
              <template #after>
                <q-select
                  dense
                  outlined
                  v-model="clipSearch.author.match"
                  emit-value
                  map-options
                  :options="[
                    { label: 'Includes', value: 'include' },
                    { label: 'Starts with', value: 'prefix' },
                    { label: 'Exact Match', value: 'exact' },
                  ]"
                />
              </template>
            </q-input>

            <q-input v-model="clipSearch.title.search" label="Clip Title">
              <template #after>
                <q-select
                  dense
                  outlined
                  v-model="clipSearch.title.match"
                  emit-value
                  map-options
                  :options="[
                    { label: 'Any word', value: 'any' },
                    { label: 'All words', value: 'all' },
                    { label: 'Whole phrase', value: 'phrase' },
                  ]"
                />
              </template>
            </q-input>
          </q-form>
        </div>
      </template>
      <template #after>
        <div v-if="clipData.length">
          <q-banner v-if="!filteredClipData.length" class="bg-error">
            There are no clips based on the search criteria you selected.
          </q-banner>

          <div class="q-ma-md clip-card-container">
            <div v-for="clip in paginatedClipData" :key="clip.id">
              <q-card>
                <a :href="clip.url" target="_blank">
                  <q-img class="clip-img" :src="clip.thumbnail_url">
                    <div class="absolute-bottom text-subtitle2">{{ clip.title }}</div>
                  </q-img>
                </a>
                <q-card-section class="row q-gutter-md align-center">
                  <q-img class="game-img col-2" :src="games[clip.game_id]?.box_art_url" />
                  <div class="col">
                    <q-chip :icon="ionGameControllerOutline" dense color="transparent">
                      {{ games[clip.game_id]?.name }}
                    </q-chip>
                    <a :href="'https://www.twitch.tv/' + clip.broadcaster_name" target="_blank">
                      <q-chip :icon="ionTvOutline" clickable dense color="transparent">
                        {{ clip.broadcaster_name }}
                      </q-chip>
                    </a>
                    <a :href="'https://www.twitch.tv/' + clip.creator_name" target="_blank">
                      <q-chip :icon="ionPersonOutline" clickable dense color="transparent">
                        {{ clip.creator_name }}
                      </q-chip>
                    </a>
                    <q-chip :icon="ionCalendarClearOutline" dense color="transparent">
                      {{ clip.created_at.substring(0, 10) }}
                    </q-chip>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <q-pagination
            class="flex flex-center q-mb-md"
            v-model="currentPage"
            :max="Math.ceil(filteredClipData.length / PAGE_SIZE)"
            boundary-numbers
            direction-links
            max-pages="10"
          />
        </div>
      </template>
    </q-splitter>
  </q-page>
</template>

<script setup lang="ts">
import { QForm, QInput, QBtn } from 'quasar';

import TwitchSignin from 'src/components/TwitchSignin.vue';
import TwitchChannelSelection from 'src/components/TwitchChannelSelection.vue';
import TwitchGameSelection from 'src/components/TwitchGameSelection.vue';
import { useStorage } from '@vueuse/core';
import {
  ionDownloadOutline,
  ionTvOutline,
  ionPersonOutline,
  ionCalendarClearOutline,
  ionGameControllerOutline,
} from '@quasar/extras/ionicons-v6';
import { computed, ref } from 'vue';
import { getClips, getGames, TwitchClip, TwitchGame } from 'src/api/twitch';
import { useQuasar } from 'quasar';

interface ClipSearchOptions {
  twitchAuth?: { username: string; token: string };
  channelName?: string;
  channelId?: string;
  gameName?: string;
  gameId?: string;
  dateRange: { from?: string; to?: string };
}
const quasar = useQuasar();

const options = useStorage('clipsearch.config', {
  dateRange: {},
} as ClipSearchOptions);
const clipData = ref<TwitchClip[]>([]);
const loading = ref(false);
const loadingAmount = ref(0);
const clipSearch = ref({
  author: {
    search: '',
    match: 'include' as 'include' | 'prefix' | 'exact',
  },
  title: {
    search: '',
    match: 'any' as 'any' | 'all' | 'phrase',
  },
});
const PAGE_SIZE = 30;
const currentPage = ref(1);
const games = ref<{ [key: string]: TwitchGame }>({});
const splitLocation = ref(25);

async function getClipsData() {
  try {
    loading.value = true;
    loadingAmount.value = 0;
    clipData.value = [];
    const dates = {
      started_at:
        options.value.dateRange.from && new Date(options.value.dateRange.from).toISOString(),
      ended_at: options.value.dateRange.to && new Date(options.value.dateRange.to).toISOString(),
    };
    if (options.value.channelId) {
      clipData.value = await getClips(
        { broadcaster_id: options.value.channelId, ...dates },
        (data) => (loadingAmount.value = data.length)
      );
    } else if (options.value.gameId) {
      clipData.value = await getClips(
        { game_id: options.value.gameId, ...dates },
        (data) => (loadingAmount.value = data.length)
      );
    } else {
      quasar.notify({
        message:
          'You must provide at least a channel name or a game name to search. I cannot pull the list of all clips across all of twitch.',
        type: 'negative',
      });
    }
    if (clipData.value.length) {
      const gameIds = [...new Set(clipData.value.map((clip) => clip.game_id))];
      const newGameIds = gameIds.filter((g) => !games.value[g]);
      if (newGameIds.length) {
        const newGames = await getGames({ id: newGameIds });
        newGames.forEach((g) => (games.value[g.id] = g));
      }
    }
  } finally {
    currentPage.value = 1;
    loading.value = false;
  }
}

const filteredClipData = computed(() =>
  clipData.value.filter(
    (clip) =>
      (!options.value.gameId || clip.game_id == options.value.gameId) &&
      (!clipSearch.value.author.search ||
        (clipSearch.value.author.match === 'include' &&
          clip.creator_name.toLowerCase().includes(clipSearch.value.author.search.toLowerCase())) ||
        (clipSearch.value.author.match === 'prefix' &&
          clip.creator_name
            .toLowerCase()
            .startsWith(clipSearch.value.author.search.toLowerCase())) ||
        (clipSearch.value.author.match === 'exact' &&
          clip.creator_name.toLowerCase() == clipSearch.value.author.search.toLowerCase())) &&
      (!clipSearch.value.title.search ||
        (clipSearch.value.title.match === 'all' &&
          clipSearch.value.title.search
            .toLowerCase()
            .split(/\s+/)
            .every((kwd) =>
              clip.title
                .toLowerCase()
                .split(/\s+/)
                .some((word) => kwd && word.startsWith(kwd))
            )) ||
        (clipSearch.value.title.match === 'any' &&
          clipSearch.value.title.search
            .toLowerCase()
            .split(/\s+/)
            .some((kwd) =>
              clip.title
                .toLowerCase()
                .split(/\s+/)
                .some((word) => kwd && word.startsWith(kwd))
            )) ||
        (clipSearch.value.title.match === 'phrase' &&
          clip.title.toLowerCase().includes(clipSearch.value.title.search.toLowerCase())))
  )
);

const paginatedClipData = computed(() =>
  filteredClipData.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
);
</script>

<style scoped lang="sass">
.clip-img
  width: 100%

.clip-card-container
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr))
  gap: 1em
</style>
