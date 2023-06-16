import { defineStore } from 'pinia';
import { StorageSerializers, useStorage } from '@vueuse/core';
import twitchApi, { getUsers, TwitchUser } from 'src/api/twitch';
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

const CLIENT_ID = 'ea4ht2mler9y438e2o706g2rsd7jxz';

export default defineStore('TwitchAuth', () => {
  const token = useStorage<string | null>('auth.twitch', null, undefined, {
    serializer: StorageSerializers.object,
  });
  const signinState = useStorage<string | null>('auth.twitch.state', null);
  const currentUser = useStorage<TwitchUser | null>('auth.twitch.user', null, undefined, {
    serializer: StorageSerializers.object,
  });
  const isSignedIn = computed(() => token.value !== null && currentUser.value !== null);
  const router = useRouter();
  const REDIRECT_URI =
    location.origin + location.pathname + router.resolve({ name: 'TwitchOauth' }).href;

  // this needs to be a watch because token is set in a separate window
  watch(token, getCurrentUser, { immediate: true });

  async function getCurrentUser() {
    if (token.value) {
      twitchApi.defaults.headers['Authorization'] = 'Bearer ' + token.value;
      twitchApi.defaults.headers['Client-ID'] = CLIENT_ID;
      const response = await getUsers();
      currentUser.value = response[0];
    }
  }

  function getSigninUrl() {
    const base = 'https://id.twitch.tv/oauth2/authorize?';
    signinState.value = (Math.random() * 1e24).toString(36);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      scope: 'chat:read chat:edit moderator:manage:announcements',
      state: signinState.value,
    });
    return base + params.toString();
  }

  async function setAuth(oauthParamString: string) {
    const params = new URLSearchParams(oauthParamString);
    if (params.get('state') === signinState.value) {
      const newToken = params.get('access_token');
      if (newToken) {
        token.value = newToken;
      }
    } else {
      token.value = null;
      currentUser.value = null;
    }
    signinState.value = null;
  }

  function logout() {
    token.value = null;
    signinState.value = null;
    currentUser.value = null;
  }

  return {
    token,
    isSignedIn,
    setAuth,
    logout,
    getSigninUrl,
    currentUser,
  };
});
