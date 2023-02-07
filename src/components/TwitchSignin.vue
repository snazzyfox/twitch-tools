<template>
  <q-field :label="$props.label" stack-label :hint="$props.hint">
    <template #default>
      <user-label
        dense
        v-if="store.isSignedIn"
        :name="store.currentUser?.display_name"
        :image-src="store.currentUser?.profile_image_url"
      />
      <span class="text-warning" v-else>Not Signed In</span>
    </template>
    <template #prepend>
      <q-btn
        v-if="store.isSignedIn"
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
import twitchAuthStore from 'src/stores/TwitchAuth';
import { watch } from 'vue';
import UserLabel from './UserLabel.vue';

withDefaults(
  defineProps<{
    modelValue?: { username: string; token: string };
    label?: string;
    hint?: string;
  }>(),
  {
    label: 'Twitch',
  }
);

const emit = defineEmits(['update:modelValue']);

const store = twitchAuthStore();
const { token } = storeToRefs(store);

watch(
  token,
  (newToken) => emit('update:modelValue', { token: newToken, username: store.currentUser?.login }),
  { immediate: true }
);

function startTwitchSignIn() {
  window.open(store.getSigninUrl(), 'TwitchSignin', 'popup,width=480,height=640');
}
</script>
