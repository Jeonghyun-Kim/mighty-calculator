import { fetcher } from '@lib/fetcher';

interface DeleteRoomByIdProps {
  adminKey: string;
  roomId: string;
}

export async function deleteRoomById({ adminKey, roomId }: DeleteRoomByIdProps) {
  await fetcher.delete('/api/admin/room', {
    searchParams: { roomId },
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
