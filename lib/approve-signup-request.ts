import { fetcher } from '@lib/fetcher';

interface ApproveSignupRequestProps {
  adminKey: string;
  userId: string;
}

export async function approveSignupRequest({ adminKey, userId }: ApproveSignupRequestProps) {
  await fetcher.post(`/api/admin/user`, {
    searchParams: { userId },
    headers: { Authorization: `Kay ${adminKey}` },
  });
}
