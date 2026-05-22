import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type AccessState = 'checking' | 'allowed' | 'unauthenticated' | 'denied';

export function useRouteGuard(allowedRoles: string[]) {
  const [accessState, setAccessState] = useState<AccessState>('checking');
  const allowedRolesRef = useRef(allowedRoles);
  allowedRolesRef.current = allowedRoles;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccessState('unauthenticated');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const roles: string[] = userSnap.data()?.roles ?? [];

        if (roles.includes('admin') || allowedRolesRef.current.some((role) => roles.includes(role))) {
          setAccessState('allowed');
        } else {
          setAccessState('denied');
        }
      } catch {
        setAccessState('denied');
      }
    });

    return unsubscribe;
  }, []);

  return {
    accessState,
    isChecking: accessState === 'checking',
    isAllowed: accessState === 'allowed',
    isUnauthenticated: accessState === 'unauthenticated',
    isDenied: accessState === 'denied',
  };
}
