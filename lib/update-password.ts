import { fetcher } from './fetcher';

export async function updatePassword(password: string) {
  await fetcher.patch('/api/user/password', { json: { password } });
}
