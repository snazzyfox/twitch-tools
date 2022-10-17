<template>
  <q-field :label="$props.label" stack-label :hint="$props.hint">
    <template v-slot:default>
      <a
        v-if="store.isTwitchSignedIn"
        :href="'https://www.twitch.tv/' + store.twitchAuth?.username"
        target="_blank"
        rel="noopener noreferrer"
      >
        <q-chip clickable size="small">
          <q-avatar>
            <img :src="store.currentTwitchUser?.profile_image_url" alt="Profile Image" />
          </q-avatar>
          <span class="username">{{ store.currentTwitchUser?.display_name }}</span>
        </q-chip>
      </a>
      <span class="text-warning" v-else>Not Signed In</span>
    </template>
    <template v-slot:prepend>
      <q-btn
        v-if="store.isTwitchSignedIn"
        label="Sign Out"
        :icon="ionLogOutOutline"
        @click="store.logout()"
      />
      <q-btn
        v-else
        color="purple"
        label="Sign in with Twitch"
        :icon="ionLogoTwitch"
        @click="startTwitchSignIn()"
      />
    </template>
  </q-field>
</template>

<script setup lang="ts">
import { ionLogoTwitch, ionLogOutOutline } from '@quasar/extras/ionicons-v6';
import { storeToRefs } from 'pinia';
import authStore, { TwitchAuth } from 'src/stores/auth-store';
import { watch } from 'vue';

withDefaults(
  defineProps<{
    modelValue?: TwitchAuth;
    label?: string;
    hint?: string;
  }>(),
  {
    label: 'Twitch',
  }
);

const emit = defineEmits(['update:modelValue']);

const store = authStore();
const { twitchAuth } = storeToRefs(store);

watch(twitchAuth, (newAuth) => emit('update:modelValue', newAuth), { immediate: true });

function startTwitchSignIn() {
  window.open(store.getTwitchSigninUrl(), 'TwitchSignin', 'popup,width=480,height=640');
}
</script>
