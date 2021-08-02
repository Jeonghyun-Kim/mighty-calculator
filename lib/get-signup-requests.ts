import { fetcher } from '@lib/fetcher';

import { Expand } from 'types';
import { User } from 'types/user';

interface GetSignupRequestsProps {
  adminKey: string;
}

export async function getSignupRequests({ adminKey }: GetSignupRequestsProps) {
  const { users } = await fetcher<{ users: Expand<Omit<User, 'password'>>[] }>('/api/admin/user', {
    method: 'GET',
    headers: { Authorization: `Kay ${adminKey}` },
  });

  return users;
}
