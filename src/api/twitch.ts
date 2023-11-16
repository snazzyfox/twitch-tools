import ky, { KyResponse } from 'ky';
import twitchAuthStore from 'src/stores/TwitchAuth';

export type ClipID = { broadcaster_id: string } | { game_id: string } | { id: string[] };

export interface TwitchResponse<T> {
  data: T;
  total: number;
  pagination?: { cursor: string };
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export interface TwitchFollow {
  from_id: string;
  from_login: string;
  from_name: string;
  to_id: string;
  to_name: string;
  followed_at: string;
}

export interface TwitchClip {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
  vod_offset: number;
  is_featured: boolean;
}

export interface TwitchGame {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

let twitchApi = ky.create({
  prefixUrl: 'https://api.twitch.tv/helix/',
});
export default twitchApi;

function flattenParams(params?: {
  [key: string]: string[] | string | number[] | number | undefined;
}) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((val) => searchParams.append(k, val.toString()));
      } else if (v !== undefined) {
        searchParams.append(k, v.toString());
      }
    });
  }
  return searchParams;
}

export function setTwitchAuth(clientId: string, bearerToken: string) {
  twitchApi = twitchApi.extend({
    headers: {
      Authorization: 'Bearer ' + bearerToken,
      'Client-ID': clientId,
    },
  });
}

/** For twitch endpoints that returns paginated data, a wrapper function that repeats the request while fetching more data until exhausted. */
async function getPaginatedData<T>(initialResponse: KyResponse): Promise<T[]> {
  const responseJson = await initialResponse.json<TwitchResponse<T[]>>();
  const result = responseJson.data;
  const url = new URL(initialResponse.url);
  let cursor = responseJson.pagination?.cursor;
  while (!!cursor) {
    url.searchParams.set('after', cursor);
    const response = await twitchApi(url, { headers: initialResponse.headers }).json<
      TwitchResponse<T[]>
    >();
    result.push(...response.data);
    cursor = response.pagination?.cursor;
  }
  return result;
}

export async function getUsers(params?: { id?: string[]; login?: string[] }) {
  const searchParams = flattenParams(params);
  const response = await twitchApi
    .get('users', { searchParams })
    .json<TwitchResponse<TwitchUser[]>>();
  return response.data;
}

export async function getFollows(params: { from_id?: string; to_id?: string }) {
  const response = await twitchApi.get('users/follows', { searchParams: params });
  return await getPaginatedData<TwitchUser>(response);
}

export async function getClips(params: ClipID & { started_at?: string; ended_at?: string }) {
  const searchParams = flattenParams({ ...params, first: 100 });
  const response = await twitchApi.get('clips', { searchParams });
  return await getPaginatedData<TwitchClip>(response);
}

export async function getGames(params: { id?: string[]; name?: string[] }) {
  const searchParams = flattenParams(params);
  const response = await twitchApi
    .get('games', { searchParams })
    .json<TwitchResponse<TwitchGame[]>>();
  return response.data.map((g) => ({
    ...g,
    box_art_url: g.box_art_url.replace('{width}', '240').replace('{height}', '320'),
  }));
}

export async function sendAnnouncement(broadcaster_id: string, message: string, color?: string) {
  const store = twitchAuthStore();
  if (store.currentUser) {
    const searchParams = { broadcaster_id, moderator_id: store.currentUser.id };
    await twitchApi.post('chat/announcements', { json: { message, color }, searchParams });
  }
}
