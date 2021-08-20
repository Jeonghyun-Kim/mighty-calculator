import { fetcher } from './fetcher';

export async function updateDisplayName(displayName: string) {
  await fetcher.patch('/api/user', { json: { displayName } });
}
