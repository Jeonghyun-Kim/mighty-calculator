import { fetcher } from '@lib/fetcher';

export async function closeRoomById(roomId: string) {
  await fetcher(`/api/room/${roomId}`, { method: 'POST' });
}
