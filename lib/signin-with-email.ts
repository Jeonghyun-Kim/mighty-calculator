import { fetcher } from '@lib/fetcher';

import { User } from 'types/user';

export type SigninWithEmailProps = Pick<User, 'email' | 'password'>;

export async function signinWithEmail({ email, password }: SigninWithEmailProps) {
  await fetcher.post('/api/auth', { json: { email, password } });
}
