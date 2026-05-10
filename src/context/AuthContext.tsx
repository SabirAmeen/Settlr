import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  isSupported: boolean;
  isSecure: boolean;
  hasCredential: boolean;
  pin: string | null;
  setupBiometrics: () => Promise<boolean>;
  authenticateBiometrics: () => Promise<boolean>;
  setupPin: (newPin: string) => void;
  authenticatePin: (inputPin: string) => boolean;
  resetAuth: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSecure, setIsSecure] = useState<boolean>(true);
  const [hasCredential, setHasCredential] = useState<boolean>(false);
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    if (!window.PublicKeyCredential) {
      setIsSupported(false);
    }
    if (!window.isSecureContext) {
      setIsSecure(false);
    }
    
    const storedCredId = localStorage.getItem('settlr_credential_id');
    const storedPin = localStorage.getItem('settlr_pin');
    
    if (storedCredId || storedPin) {
      setHasCredential(true);
      if (storedPin) setPin(storedPin);
    }
    // No else { setIsAuthenticated(true) } - force setup or login
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
        challenge,
        rp: { name: "Settlr" },
        user: {
          id: userId,
          name: "user@settlr.local",
          displayName: "Settlr User",
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
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
      setHasCredential(true);
      setIsAuthenticated(true); // Log in immediately after setup
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
        challenge,
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
    setHasCredential(true);
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
    setHasCredential(false);
    setPin(null);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isSupported,
      isSecure,
      hasCredential,
      pin,
      setupBiometrics,
      authenticateBiometrics,
      setupPin,
      authenticatePin,
      resetAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};
