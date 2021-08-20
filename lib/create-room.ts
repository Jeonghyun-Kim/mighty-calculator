import { fetcher } from '@lib/fetcher';

interface CreateRoomProps {
  title: string;
  participantIds: string[];
}

export async function createRoom({ title, participantIds }: CreateRoomProps) {
  const { roomId } = await fetcher
    .post('/api/room', { json: { title, participantIds } })
    .json<{ roomId: string }>();

  return roomId;
}
