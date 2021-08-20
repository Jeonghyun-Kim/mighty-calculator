import { fetcher } from '@lib/fetcher';

interface ApproveRoomByIdProps {
  adminKey: string;
  roomId: string;
}

export async function approveRoomById({ adminKey, roomId }: ApproveRoomByIdProps) {
  await fetcher.post('/api/admin/room', {
    searchParams: { roomId },
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
