import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Main',
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'Index',
        path: '/',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        name: 'TimerConfig',
        path: '/timer',
        component: () => import('pages/TimerConfig.vue'),
      },
      {
        name: 'DvdBounceConfig',
        path: '/dvd-bounce',
        component: () => import('pages/DvdBounceConfig.vue'),
      },
      {
        name: 'SpotifyConfig',
        path: '/spotify',
        component: () => import('pages/SpotifyConfig.vue'),
      },
      {
        name: 'ChatTimer',
        path: '/chat-timer',
        component: () => import('pages/ChatTimer.vue'),
      },
    ],
  },
  {
    name: 'StreamWidget',
    path: '/widget',
    component: () => import('layouts/StreamWidget.vue'),
    children: [
      {
        name: 'TimerWidget',
        path: '/widget/timer',
        component: () => import('pages/TimerWidget.vue'),
      },
      {
        name: 'DvdBounceWidget',
        path: '/widget/dvd-bounce',
        component: () => import('pages/DvdBounceWidget.vue'),
      },
      {
        name: 'SpotifyWidget',
        path: '/widget/spotify',
        component: () => import('pages/SpotifyWidget.vue'),
      },
    ],
  },
  {
    name: 'TwitchOauth',
    path: '/oauth/twitch:params(.*)?',
    component: () => import('layouts/TwitchOauth.vue'),
  },
  {
    name: 'SpotifyOauth',
    path: '/oauth/spotify',
    component: () => import('layouts/SpotifyOauth.vue'),
  },
  {
    path: '/%2Foauth%2Fspotify', // spotify returns with the path urlencoded :(
    redirect: { name: 'SpotifyOauth' },
  },
  {
    name: 'NotFound',
    path: '/:path(.*)',
    component: () => import('layouts/NotFound.vue'),
  },
];

export default routes;
