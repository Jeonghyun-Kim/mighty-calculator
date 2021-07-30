import { fetcher } from './fetcher';

export async function updateDisplayName(displayName: string) {
  await fetcher('/api/user', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  });
}
