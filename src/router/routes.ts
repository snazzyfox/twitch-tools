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
    ],
  },
  {
    name: 'OauthTwitch',
    path: '/oauth/twitch:params(.*)',
    component: () => import('layouts/TwitchOauth.vue'),
  },
  {
    name: 'NotFound',
    path: '/:path(.*)',
    component: () => import('layouts/NotFound.vue'),
  },
];

export default routes;
