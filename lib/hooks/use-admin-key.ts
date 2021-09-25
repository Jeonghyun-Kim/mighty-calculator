import { useEffect } from 'react';
import useSWR from 'swr';

import type { KeyedMutator } from 'swr/dist/types';

const ADMIN_KEY = '@adminKey' as const;

export function useAdminKey(): [string | null, KeyedMutator<string | null>] {
  const { data: adminKey, mutate: setAdminKey } = useSWR<string | null>(ADMIN_KEY, {
    fallbackData: null,
    fetcher: undefined,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY);

    if (stored) setAdminKey(stored);
  }, [setAdminKey]);

  useEffect(() => {
    if (adminKey) {
      sessionStorage.setItem(ADMIN_KEY, adminKey);
    } else {
      sessionStorage.removeItem(ADMIN_KEY);
    }
  }, [adminKey]);

  return [adminKey as never, setAdminKey];
}
