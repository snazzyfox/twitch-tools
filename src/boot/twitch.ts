import { boot } from 'quasar/wrappers';
import { App } from 'vue';
import axios, { AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $twitch: AxiosInstance;
  }
}

export const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
});

export default boot(({ app }: { app: App }) => {
  app.config.globalProperties.$twitch = twitchApi;
});
