import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, authPersistence } from '../firebase/client';

interface IdentityContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const IdentityContext = createContext<IdentityContextValue>({
  user: null,
  loading: true,
  error: null,
});

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let signingIn = false;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
        return;
      }
      void authPersistence
        .then(() => {
          if (signingIn || !active) return;
          signingIn = true;
          return signInAnonymously(auth).catch((cause: unknown) => {
            if (active) setError(cause instanceof Error ? cause.message : 'Unable to sign in.');
          });
        })
        .finally(() => {
          signingIn = false;
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <IdentityContext.Provider value={{ user, loading, error }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  return useContext(IdentityContext);
}
