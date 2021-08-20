import { fetcher } from '@lib/fetcher';

import { Room } from 'types/room';

interface GetEndedRoomsProps {
  adminKey: string;
}

export async function getEndedRooms({ adminKey }: GetEndedRoomsProps) {
  const { rooms } = await fetcher
    .get('/api/admin/room', {
      headers: { Authorization: `Kay ${adminKey}` },
    })
    .json<{ rooms: Room[] }>();

  return rooms;
}
