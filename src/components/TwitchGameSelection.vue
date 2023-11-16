<template>
  <q-select label="Twitch Game" use-input option-value="id" :input-debounce="200" :disable="!store.isSignedIn"
    :options="filteredGamesData" :model-value="modelValue" @update:model-value="handleSelectGame" @filter="handleFilter"
    @new-value="handleNewGame" :rules="[(val) => !!val || 'You must select a game.']">
    <template #selected>
      <user-label v-if="game" :name="game.name" :image-src="game.box_art_url" dense />
    </template>
    <template #option="{ itemProps, opt }">
      <user-label :name="opt.name" :image-src="opt.box_art_url" v-bind="itemProps" dense>
        <q-btn flat round class="float-right" size="sm" :icon="ionCloseOutline" @click.stop="handleRemoveGame(opt.id)" />
      </user-label>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { useQuasar } from 'quasar';
import TwitchAuth from 'src/stores/TwitchAuth';
import { getGames, TwitchGame } from 'src/api/twitch';
import { computed, ref, watch } from 'vue';
import UserLabel from './UserLabel.vue';
import { ionCloseOutline } from '@quasar/extras/ionicons-v6';

const props = defineProps<{
  modelValue?: string;
}>();
const emit = defineEmits(['update:modelValue', 'update:gameName']);

const store = TwitchAuth();
const quasar = useQuasar();

const knownGames = useStorage<Set<string>>('twitch.knownGames', new Set());
const knownGamesData = ref<TwitchGame[]>([]);
const filteredGamesData = ref<TwitchGame[]>([]);
const game = computed(() => knownGamesData.value.find((g) => g.id === props.modelValue));

watch(game, async (newValue?: TwitchGame) => {
  if (!newValue && store.isSignedIn && props.modelValue) {
    const response = await getGames({ name: [props.modelValue] });
    knownGamesData.value.push(response[0]);
    filteredGamesData.value.push(response[0]);
  }
});

watch(
  () => store.isSignedIn,
  async (isSignedIn: boolean) => {
    if (isSignedIn && knownGames.value.size) {
      knownGamesData.value = await getGames({ id: [...knownGames.value] });
    }
  },
  { immediate: true }
);

function addGame(game: TwitchGame) {
  knownGames.value.add(game.id);
  const index = knownGamesData.value.findIndex((g) => g.id === game.id);
  if (index >= 0) {
    knownGamesData.value[index] = game;
  } else {
    knownGamesData.value.push(game);
  }
}

async function handleNewGame(inputValue: string, callback: (item?: TwitchGame) => void) {
  const response = await getGames({ name: [inputValue.trim()] });
  if (!response.length) {
    callback();
    quasar.notify({
      message: 'There is no game with that name. Make sure you have spelled the game name exactly as it appears on twitch.',
      type: 'negative',
    });
    return;
  }
  addGame(response[0]);
  callback(response[0]);
}

function handleFilter(inputValue: string, done: (callback: () => void) => void) {
  done(() => {
    if (!inputValue) {
      filteredGamesData.value = knownGamesData.value;
    } else {
      filteredGamesData.value = knownGamesData.value.filter((c) =>
        c.name.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
  });
}

async function handleSelectGame(event: TwitchGame | null) {
  emit('update:modelValue', event?.id);
  emit('update:gameName', event?.name);
}

async function handleRemoveGame(gameId: string) {
  // clear current selection if they're current user
  if (props.modelValue === gameId) {
    emit('update:modelValue', null);
    emit('update:gameName', null);
  }
  knownGamesData.value = knownGamesData.value.filter((g) => g.id != gameId);
  knownGames.value.delete(gameId);
  filteredGamesData.value = Object.values(filteredGamesData);
}
</script>
