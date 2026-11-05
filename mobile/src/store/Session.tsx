/**
 * Session for the UI review build. Sign-in uses the demo accounts; the backend's JWT
 * login replaces signIn() in the integration stage. The session object already has the
 * shape the API will return (user + role).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { DEMO_ACCOUNTS } from '@/data/demo';
import type { Role, User } from '@/data/types';
import { useStore } from './DemoStore';
import * as api from '@/lib/api';

const STORAGE_KEY = 'vos.session.role';

type SessionValue = {
  ready: boolean;
  user: User | null;
  role: Role | null;
  signInAs: (role: Role) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Web preview only: ?role=admin|team|client opens that workspace directly. */
function previewRole(): Role | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const r = new URLSearchParams(window.location.search).get('role');
  return r === 'admin' || r === 'team' || r === 'client' ? r : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const [role, setRole] = useState<Role | null>(previewRole);
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [ready, setReady] = useState(previewRole() !== null);

  useEffect(() => {
    if (previewRole()) return;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'admin' || saved === 'team' || saved === 'client') setRole(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const signInAs = useCallback((r: Role) => {
    setRole(r);
    AsyncStorage.setItem(STORAGE_KEY, r).catch(() => {});
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (api.API_BASE_URL) {
        try {
          const result = await api.login(email.trim(), password);
          setApiUser({ id: result.user.id, role: result.user.role, name: result.user.name, email: result.user.email, phone: result.user.phone || undefined, jobTitle: result.user.jobTitle || undefined, clientId: result.user.clientId || undefined, status: 'active', joinedOn: new Date().toISOString() });
          signInAs(result.user.role);
          return { ok: true as const };
        } catch (err) { return { ok: false as const, error: err instanceof Error ? err.message : 'Unable to sign in.' }; }
      }
      const user = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || Object.values(DEMO_ACCOUNTS).indexOf(user.id as never) === -1 || password !== 'demo1234') {
        return { ok: false as const, error: 'Email or password is incorrect.' };
      }
      if (user.status !== 'active') return { ok: false as const, error: 'This account is not active. Contact Varuag Labs.' };
      signInAs(user.role);
      return { ok: true as const };
    },
    [signInAs, state.users]
  );

  const signOut = useCallback(() => {
    if (api.API_BASE_URL) void api.logout();
    setApiUser(null);
    setRole(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const user = apiUser ?? (role ? state.users.find((u) => u.id === DEMO_ACCOUNTS[role]) ?? null : null);

  const value = useMemo(
    () => ({ ready, user, role, signInAs, signInWithPassword, signOut }),
    [ready, user, role, signInAs, signInWithPassword, signOut]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** Signed-in user (screens under a role workspace can rely on it). */
export function useMe() {
  const { user, role } = useSession();
  if (!user || !role) throw new Error('No signed-in user');
  return { user, role };
}

export const HOME_ROUTE: Record<Role, string> = {
  admin: '/admin',
  team: '/team',
  client: '/client',
};
