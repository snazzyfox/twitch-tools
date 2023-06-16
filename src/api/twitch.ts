import axios, { AxiosResponse } from 'axios';
import twitchAuthStore from 'src/stores/TwitchAuth';

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

const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
});
export default twitchApi;

/** For twitch endpoints that returns paginated data, a wrapper function that repeats the request while fetching more data until exhausted. */
async function getPaginatedData<T>(
  initialResponse: AxiosResponse<TwitchResponse<T[]>>
): Promise<T[]> {
  const result = initialResponse.data.data;
  let cursor = initialResponse.data.pagination?.cursor;
  while (!!cursor) {
    const response = await twitchApi.request({
      ...initialResponse.config,
      params: { ...initialResponse.config.params, after: cursor },
    });
    result.push(...response.data.data);
    cursor = response.data.pagination?.cursor;
  }
  return result;
}

export async function getUsers(params?: { id?: string[]; login?: string[] }) {
  const response = await twitchApi.get<TwitchResponse<TwitchUser[]>>('/users', { params });
  return response.data.data;
}

export async function getFollows(params: { from_id?: string; to_id?: string }) {
  const response = await twitchApi.get<TwitchResponse<TwitchFollow[]>>('/users/follows', {
    params,
  });
  return await getPaginatedData(response);
}

export async function sendAnnouncement(broadcaster_id: string, message: string, color?: string) {
  const store = twitchAuthStore();
  const params = { broadcaster_id, moderator_id: store.currentUser?.id };
  await twitchApi.post('/chat/announcements', { message, color }, { params });
}
