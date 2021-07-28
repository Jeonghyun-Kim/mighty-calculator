import { FormEventHandler, useCallback, useState } from 'react';
import NextImage from 'next/image';

import { LockClosedIcon } from '@heroicons/react/outline';
import { Button } from '@components/ui';
import { signinWithEmail, SigninWithEmailProps } from '@lib/signin-with-email';
import { useSession } from '@lib/hooks/use-session';
import { useUI } from '@components/context';

export default function SinginPage() {
  const { mutate } = useSession({ redirectTo: '/dashboard', redirectIfFound: true });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { showNoti } = useUI();

  const requestSignin = useCallback(
    async (body: SigninWithEmailProps) => {
      try {
        setLoading(true);
        await signinWithEmail(body);

        mutate();
      } catch (err) {
        showNoti({ variant: 'alert', title: err.message });
      } finally {
        setLoading(false);
      }
    },
    [mutate, showNoti],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
          <input type="hidden" name="remember" defaultValue="true" />
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                Forgot your password?
              </a>
            </div>
          </div> */}

          <div>
            <Button type="submit" full className="relative" disabled={loading}>
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LockClosedIcon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
