import { fetcher } from '@lib/fetcher';

export async function transferDealerTo(roomId: OurId, userId: OurId) {
  await fetcher.patch(`/api/room/${roomId}`, { json: { dealerId: userId } });
}
