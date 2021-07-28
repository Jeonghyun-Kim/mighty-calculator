import { fetcher } from '@lib/fetcher';
import { User } from 'types/user';

export type SigninWithEmailProps = Pick<User, 'email' | 'password'>;

export async function signinWithEmail({ email, password }: SigninWithEmailProps) {
  await fetcher('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}
