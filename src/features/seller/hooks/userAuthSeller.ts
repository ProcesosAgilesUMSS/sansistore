import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase'

type AccessState = 'checking' | 'allowed' | 'unauthenticated' | 'denied';

export const useUserAuthSeller = () => {
  const [accessState, setAccessState] = useState<AccessState>('checking');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccessState('unauthenticated');
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const roles = userSnap.data()?.roles;
        setAccessState(
          Array.isArray(roles) && roles.includes('vendedor') ? 'allowed' : 'denied'
        );
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
