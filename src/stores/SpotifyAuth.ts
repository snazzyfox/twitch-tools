import { defineStore } from 'pinia';
import { StorageSerializers, useStorage } from '@vueuse/core';
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyOauthApi = axios.create({
  baseURL: 'https://accounts.spotify.com/api/',
});
const spotify = new SpotifyWebApi();
export type SpotifyCurrentUser = Awaited<ReturnType<SpotifyWebApi.SpotifyWebApiJs['getMe']>>;

export interface SpotifyAuth {
  clientId: string;
  clientSecret: string;
  token?: string;
  refreshToken?: string;
}

export default defineStore('SpotifyAuth', () => {
  const auth = useStorage<SpotifyAuth | null>('auth.spotify', null, undefined, {
    serializer: StorageSerializers.object,
  });
  const signinState = useStorage<string | null>('auth.spotify.state', null);
  const currentUser = ref<SpotifyCurrentUser | null>(null);
  const isSignedIn = computed(() => auth.value !== null && auth.value.token !== null);
  const router = useRouter();
  const REDIRECT_URI =
    location.origin + location.pathname + router.resolve({ name: 'SpotifyOauth' }).href;

  onMounted(async () => {
    if (auth.value?.token) {
      await getCurrentUser();
    }
  });

  watch(() => auth.value?.token, getCurrentUser);

  function setApp(clientId: string, clientSecret: string) {
    auth.value = { clientId, clientSecret };
  }

  function getSigninUrl() {
    if (!auth.value?.clientId || !auth.value?.clientSecret) {
      throw 'Client ID or Client Secret is missing.';
    }
    signinState.value = (Math.random() * 1e24).toString(36);
    const url =
      'https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        response_type: 'code',
        client_id: auth.value.clientId,
        scope: 'user-read-playback-position user-read-playback-state user-read-currently-playing',
        redirect_uri: REDIRECT_URI,
        state: signinState.value,
      }).toString();
    return url;
  }

  /** Sets the auth data after receiving the auth code through manual signin */
  async function setAuth(authQuery: { state: string; code: string }) {
    if (authQuery.state === signinState.value) {
      const authCode = authQuery.code;
      await getToken({
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: REDIRECT_URI,
      });
    } else {
      if (auth.value) {
        auth.value = { clientId: auth.value.clientId, clientSecret: auth.value.clientSecret };
      }
      currentUser.value = null;
    }
    signinState.value = null;
  }

  async function setLocalAuth(newAuth: SpotifyAuth) {
    auth.value = newAuth;
  }

  /** Gets a token from spotify. */
  async function getToken(params: { [key: string]: string }) {
    if (auth.value) {
      const formData = new URLSearchParams(params);
      const response = await spotifyOauthApi.post('/token', formData, {
        headers: {
          Authorization: 'Basic ' + btoa(auth.value.clientId + ':' + auth.value.clientSecret),
        },
      });
      auth.value.token = response.data.access_token;
      if (response.data.refresh_token) {
        auth.value.refreshToken = response.data.refresh_token;
      }
      spotify.setAccessToken(response.data.access_token);
    }
  }

  async function refreshToken() {
    if (auth.value?.refreshToken) {
      await getToken({
        grant_type: 'refresh_token',
        refresh_token: auth.value.refreshToken,
      });
    }
  }

  async function getCurrentUser() {
    if (auth.value) {
      spotify.setAccessToken(auth.value.token || '');
      const response = await spotify.getMe();
      currentUser.value = response;
    }
  }

  function logout() {
    auth.value = null;
    signinState.value = null;
    currentUser.value = null;
  }

  return {
    auth,
    isSignedIn,
    REDIRECT_URI,
    setApp,
    setAuth,
    currentUser,
    getSigninUrl,
    setLocalAuth,
    refreshToken,
    logout,
  };
});
