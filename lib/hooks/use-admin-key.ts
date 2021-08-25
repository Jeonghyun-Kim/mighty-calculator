import useSWR from 'swr';
import { KeyedMutator } from 'swr/dist/types';

export function useAdminKey(): [string | null, KeyedMutator<string | null>] {
  const { data: adminKey, mutate: setAdminKey } = useSWR<string | null>('@adminKey', {
    fallbackData: null,
    fetcher: undefined,
  });

  return [adminKey as never, setAdminKey];
}
