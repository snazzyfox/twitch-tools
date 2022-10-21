import axios from 'axios';

export interface TwitchResponse<T> {
  data: T;
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

const twitchApi = axios.create({
  baseURL: 'https://api.twitch.tv/helix',
});
export default twitchApi;

export async function getUsers(params?: { id?: string[]; login?: string[] }) {
  const response = await twitchApi.get<TwitchResponse<TwitchUser[]>>('/users', { params });
  return response.data.data;
}
