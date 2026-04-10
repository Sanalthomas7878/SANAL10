import { useCallback, useState } from 'react';
import { AuthContext } from './auth-context';
const STORAGE_KEY = 'ecoscrap-session';

const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const buildSession = (payload) => {
  if (!payload?.token) {
    return null;
  }

  const { token, ...user } = payload;
  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => getStoredSession());

  const persistSession = useCallback((payload) => {
    const nextSession = buildSession(payload);
    setSession(nextSession);

    if (typeof window === 'undefined') {
      return;
    }

    if (nextSession) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const logout = useCallback(() => {
    persistSession(null);
  }, [persistSession]);

  const updateUser = useCallback((userPatch) => {
    setSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      const nextSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          ...userPatch,
        },
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      }

      return nextSession;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        token: session?.token || '',
        user: session?.user || null,
        isAuthenticated: Boolean(session?.token),
        persistSession,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
