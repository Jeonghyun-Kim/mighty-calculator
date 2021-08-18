import useSWR from 'swr';
import { KeyedMutator } from 'swr/dist/types';

export function useAdminKey(): [string | null, KeyedMutator<string | null>] {
  const { data: adminKey, mutate: setAdminKey } = useSWR<string | null>('@adminKey', null, {
    initialData: null,
  });

  return [adminKey as never, setAdminKey];
}
