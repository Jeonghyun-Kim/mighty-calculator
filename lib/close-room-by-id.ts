import { fetcher } from '@lib/fetcher';

export async function closeRoomById(roomId: string) {
  await fetcher.post(`/api/room/${roomId}`);
}
