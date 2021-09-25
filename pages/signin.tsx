import { LockClosedIcon } from '@heroicons/react/outline';
import cookie from 'cookie';
import NextImage from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import { useUI } from '@components/context';
import { Button, Link } from '@components/ui';

import { COOKIE_KEY_REDIRECT_URL } from '@defines/cookie';

import { useSession } from '@lib/hooks/use-session';
import { signinWithEmail, SigninWithEmailProps } from '@lib/signin-with-email';

import { isBrowser } from '@utils/is-browser';

export function useEmail() {
  const { data: email, mutate: setEmail } = useSWR('email', {
    fallbackData: '',
    fetcher: undefined,
  });

  return [email!, setEmail] as const;
}

export default function SinginPage() {
  const { mutate } = useSession({
    redirectTo:
      (isBrowser() && cookie.parse(document.cookie)[COOKIE_KEY_REDIRECT_URL]) || '/dashboard',
    redirectIfFound: true,
  });

  // const [email, setEmail] = useState('');
  const [email, setEmail] = useEmail();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { alertNoti, closeNoti } = useUI();

  // close notifications on leave page.
  useEffect(() => () => closeNoti(), [closeNoti]);

  const requestSignin = useCallback(
    async (body: SigninWithEmailProps) => {
      try {
        setLoading(true);
        await signinWithEmail(body);

        mutate();
      } catch (err) {
        alertNoti(err, 10);
      } finally {
        setLoading(false);
      }
    },
    [mutate, alertNoti],
  );

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <NextImage src="/assets/spades.svg" alt="Spade" width={48} height={57} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-medium text-gray-900 italic font-mono tracking-tight">
            Mighty Network SSHS 23rd
          </h2>
        </div>
        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            requestSignin({ email, password });
          }}
        >
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={30}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button type="submit" full className="relative capitalize" disabled={loading}>
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              Sign in
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/signup" className="font-medium text-teal-600 hover:text-teal-500">
                Create Account
              </Link>
            </div>
            <div className="text-sm">
              <a
                href="mailto:kimjh@bwai.org"
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                Forgot your password?
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
