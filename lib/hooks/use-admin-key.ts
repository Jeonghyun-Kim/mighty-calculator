import { useEffect, useState } from 'react';

const ADMIN_KEY = '@adminKey' as const;

export function useAdminKey() {
  const [adminKey, setAdminKey] = useState<string | null>(null);

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

  return [adminKey, setAdminKey] as const;
}
