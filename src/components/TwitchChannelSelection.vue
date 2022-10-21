<template>
  <q-select
    label="Twitch Channel"
    use-input
    :disable="!store.isSignedIn"
    :options="Object.values(knownChannelsData)"
    :model-value="modelValue"
    option-value="id"
    @update:model-value="$emit('update:modelValue', $event.login)"
    @filter="handleFilter"
    @new-value="handleNewChannel"
    :rules="[
      (val) => !!val || 'You must select a channel.',
      (val) => /\w+/.test(val) || 'That does not look like a valid channel name.',
    ]"
  >
    <template v-slot:selected>
      <user-label v-if="user" :name="user.display_name" :image-src="user.profile_image_url" dense />
    </template>
    <template v-slot:option="{ itemProps, opt }">
      <user-label
        :name="opt.display_name"
        :image-src="opt.profile_image_url"
        v-bind="itemProps"
        dense
      >
        <q-btn
          flat
          round
          class="float-right"
          size="sm"
          :icon="ionCloseOutline"
          @click.stop="handleRemoveUser(opt.id)"
        />
      </user-label>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { useQuasar } from 'quasar';
import TwitchAuth from 'src/stores/TwitchAuth';
import { getUsers, TwitchUser } from 'src/api/twitch';
import { computed, onMounted, ref, watch } from 'vue';
import UserLabel from './UserLabel.vue';
import { ionCloseOutline } from '@quasar/extras/ionicons-v6';

const props = defineProps<{
  modelValue?: string;
}>();
const emit = defineEmits(['update:modelValue']);

const store = TwitchAuth();
const quasar = useQuasar();

const knownChannels = useStorage<Set<string>>('twitch.knownChannels', new Set());
const knownChannelsData = ref<TwitchUser[]>([]);
const filteredChannelsData = ref<TwitchUser[]>([]);
const user = computed(() => knownChannelsData.value.find((u) => u.login === props.modelValue));

watch(user, async (newValue?: TwitchUser) => {
  if (!newValue && store.isSignedIn && props.modelValue) {
    const response = await getUsers({ login: [props.modelValue] });
    knownChannelsData.value.push(response[0]);
    filteredChannelsData.value.push(response[0]);
  }
});

onMounted(async () => {
  // load existing channel data
  if (store.isSignedIn && knownChannels.value.size) {
    knownChannelsData.value = await getUsers({ id: [...knownChannels.value] });
  }
});

function addUser(user: TwitchUser) {
  // new user found. Add it to known channels
  knownChannels.value.add(user.id);
  const index = knownChannelsData.value.findIndex((u) => u.id === user.id);
  if (index >= 0) {
    knownChannelsData.value[index] = user;
  } else {
    knownChannelsData.value.push(user);
  }
}

async function handleNewChannel(inputValue: string, callback: (item?: TwitchUser) => void) {
  if (!/\w+/.test(inputValue)) {
    callback();
    quasar.notify({
      message: 'That does not appear to be a valid Twitch username.',
      color: 'error',
    });
  } else {
    const response = await getUsers({ login: [inputValue] });
    if (response.length) {
      addUser(response[0]);
      callback(response[0]);
    } else {
      callback();
      quasar.notify({
        message: 'There is no user with that username.',
        color: 'error',
      });
    }
  }
}

function handleFilter(inputValue: string, done: (callback: () => void) => void) {
  done(() => {
    if (!inputValue) {
      filteredChannelsData.value = Object.values(knownChannelsData.value);
    } else {
      filteredChannelsData.value = Object.values(knownChannelsData.value).filter((c) =>
        c.login.toLowerCase().includes(inputValue.toLowerCase())
      );
    }
  });
}

async function handleRemoveUser(userId: string) {
  // clear current selection if they're current user
  if (props.modelValue === userId) {
    emit('update:modelValue', null);
  }
  knownChannelsData.value = knownChannelsData.value.filter((u) => u.id != userId);
  knownChannels.value.delete(userId);
  filteredChannelsData.value = Object.values(knownChannelsData);
}
</script>
