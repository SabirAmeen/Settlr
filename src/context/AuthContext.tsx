import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthContextType {
  isAuthenticated: boolean;
  isSupported: boolean;
  isSecure: boolean;
  hasBiometrics: boolean;
  hasPin: boolean;
  pin: string | null;
  setupBiometrics: () => Promise<boolean>;
  authenticateBiometrics: () => Promise<boolean>;
  setupPin: (newPin: string) => void;
  authenticatePin: (inputPin: string) => boolean;
  resetAuth: () => void;
  // Cloud sync
  googleUser: User | null;
  isSyncEnabled: boolean;
  isSyncLoading: boolean;
  enableCloudSync: () => Promise<void>;
  disableCloudSync: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(!!window.PublicKeyCredential);
  const [isSecure, setIsSecure] = useState<boolean>(window.isSecureContext);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(() => !!localStorage.getItem('settlr_credential_id'));
  const [hasPin, setHasPin] = useState<boolean>(() => !!localStorage.getItem('settlr_pin'));
  const [pin, setPin] = useState<string | null>(() => localStorage.getItem('settlr_pin'));

  // Cloud sync state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => localStorage.getItem('settlr_sync_enabled') === 'true');
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!window.PublicKeyCredential) setIsSupported(false);
    if (!window.isSecureContext) setIsSecure(false);
  }, []);

  // Listen for Firebase auth state changes (e.g. session restored on page load)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGoogleUser(user);
      if (!user) {
        // If Firebase session expired/logged out, disable sync silently
        setIsSyncEnabled(false);
        localStorage.setItem('settlr_sync_enabled', 'false');
      }
    });
    return () => unsubscribe();
  }, []);

  const generateChallenge = (): Uint8Array => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  };

  const setupBiometrics = async (): Promise<boolean> => {
    try {
      const challenge = generateChallenge();
      const userId = generateChallenge();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge as BufferSource,
        rp: { name: "Settlr" },
        user: {
          id: userId as BufferSource,
          name: "user@settlr.local",
          displayName: "Settlr User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          userVerification: "required",
          authenticatorAttachment: "platform",
          residentKey: "preferred"
        },
        timeout: 60000,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (!credential) return false;

      const credentialId = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(credential.rawId))));
      localStorage.setItem('settlr_credential_id', credentialId);
      setHasBiometrics(true);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Error setting up biometrics:', err);
      return false;
    }
  };

  const authenticateBiometrics = async (): Promise<boolean> => {
    try {
      const storedCredIdBase64 = localStorage.getItem('settlr_credential_id');
      if (!storedCredIdBase64) return false;

      const credIdBytes = Uint8Array.from(atob(storedCredIdBase64), c => c.charCodeAt(0));
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge as BufferSource,
        allowCredentials: [{
          id: credIdBytes,
          type: 'public-key',
        }],
        userVerification: 'required',
        timeout: 60000,
      };

      await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error('Error authenticating:', err);
      return false;
    }
  };

  const setupPin = (newPin: string): void => {
    localStorage.setItem('settlr_pin', newPin);
    setPin(newPin);
    setHasPin(true);
    setIsAuthenticated(true);
  };

  const authenticatePin = (inputPin: string): boolean => {
    if (inputPin === pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const resetAuth = (): void => {
    localStorage.removeItem('settlr_credential_id');
    localStorage.removeItem('settlr_pin');
    setHasBiometrics(false);
    setHasPin(false);
    setPin(null);
    setIsAuthenticated(true);
  };

  const enableCloudSync = async (): Promise<void> => {
    setIsSyncLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsSyncEnabled(true);
      localStorage.setItem('settlr_sync_enabled', 'true');
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setIsSyncLoading(false);
    }
  };

  const disableCloudSync = async (): Promise<void> => {
    setIsSyncLoading(true);
    try {
      await signOut(auth);
      setIsSyncEnabled(false);
      localStorage.setItem('settlr_sync_enabled', 'false');
    } catch (err) {
      console.error('Sign-out failed:', err);
    } finally {
      setIsSyncLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isSupported,
      isSecure,
      hasBiometrics,
      hasPin,
      pin,
      setupBiometrics,
      authenticateBiometrics,
      setupPin,
      authenticatePin,
      resetAuth,
      googleUser,
      isSyncEnabled,
      isSyncLoading,
      enableCloudSync,
      disableCloudSync,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
