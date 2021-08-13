import { fetcher } from '@lib/fetcher';

export async function transferDealerTo(roomId: OurId, userId: OurId) {
  await fetcher(`/api/room/${roomId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealerId: userId }),
  });
}
