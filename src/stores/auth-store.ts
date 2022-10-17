import { defineStore } from 'pinia';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { twitchApi } from 'src/boot/twitch';
import { TwitchResponse, TwitchUser } from 'src/models/twitch';
import { computed, ref, watch } from 'vue';

const CLIENT_ID = 'ea4ht2mler9y438e2o706g2rsd7jxz';

export interface TwitchAuth {
  username: string;
  token: string;
}

async function getCurrentTwitchUser(token: string) {
  twitchApi.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  twitchApi.defaults.headers.common['Client-ID'] = CLIENT_ID;
  const response = await twitchApi.get<TwitchResponse<TwitchUser[]>>('/users');
  return response.data.data[0];
}

export default defineStore('auth', () => {
  const twitchAuth = useStorage<TwitchAuth | null>('auth.twitchAuth', null, undefined, {
    serializer: StorageSerializers.object,
  });
  const signinState = useStorage<string | null>('auth.signinState', null);
  const currentTwitchUser = ref<TwitchUser | null>(null);

  const isTwitchSignedIn = computed(() => twitchAuth.value !== null);

  watch(
    twitchAuth,
    async (newAuth, oldAuth) => {
      if (!newAuth) {
        currentTwitchUser.value = null;
      } else if (newAuth?.username !== oldAuth?.username) {
        currentTwitchUser.value = await getCurrentTwitchUser(newAuth.token);
      }
    },
    { immediate: true }
  );

  function getTwitchSigninUrl() {
    const base = 'https://id.twitch.tv/oauth2/authorize?';
    signinState.value = (Math.random() * 1e24).toString(36);
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'token',
      redirect_uri: location.origin + location.pathname + '#/oauth/twitch',
      scope: 'chat:read chat:edit',
      state: signinState.value,
    });
    return base + params.toString();
  }

  async function setTwitchAuth(oauthParamString: string) {
    const params = new URLSearchParams(oauthParamString);
    if (params.get('state') === signinState.value) {
      const token = params.get('access_token');
      if (token) {
        const user = await getCurrentTwitchUser(token);
        twitchAuth.value = { username: user.login, token: token };
        currentTwitchUser.value = user;
      }
    } else {
      twitchAuth.value = null;
      currentTwitchUser.value = null;
    }
    signinState.value = null;
  }

  function logout() {
    twitchAuth.value = null;
    signinState.value = null;
    currentTwitchUser.value = null;
  }

  return {
    twitchAuth,
    isTwitchSignedIn,
    setTwitchAuth,
    logout,
    getTwitchSigninUrl,
    currentTwitchUser,
  };
});
