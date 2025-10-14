'use client';

import { FirebaseClientProvider, useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import React, { useEffect, useState } from 'react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthHandler>{children}</AuthHandler>
    </FirebaseClientProvider>
  );
}

function AuthHandler({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user && !signedIn) {
      initiateAnonymousSignIn(auth);
      setSignedIn(true);
    }
  }, [isUserLoading, user, auth, signedIn]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>جار التحميل...</p>
      </div>
    );
  }

  return <>{children}</>;
}
