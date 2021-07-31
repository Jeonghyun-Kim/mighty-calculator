import { fetcher } from '@lib/fetcher';

import { Expand } from 'types';
import { UserInfo } from 'types/user';

interface GetSignupRequestsProps {
  adminKey: string;
}

export async function getSignupRequests({ adminKey }: GetSignupRequestsProps) {
  const { users } = await fetcher<{ users: Expand<Omit<UserInfo, 'password'>>[] }>(
    '/api/admin/user',
    {
      method: 'GET',
      headers: { Authorization: `Kay ${adminKey}` },
    },
  );

  return users;
}
