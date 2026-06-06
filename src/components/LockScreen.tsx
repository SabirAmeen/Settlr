import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Fingerprint, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const LockScreen: React.FC = () => {
  const context = useContext(AuthContext);
  if (!context) return null;

  const { 
    hasBiometrics,
    hasPin,
    isSupported, 
    isSecure,
    setupBiometrics, 
    authenticateBiometrics,
    setupPin,
    authenticatePin
  } = context;

  const hasAnyCredential = hasBiometrics || hasPin;
  const [pinInput, setPinInput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<'login' | 'setup'>(hasAnyCredential ? 'login' : 'setup');
  const [setupMode, setSetupMode] = useState<'choice' | 'bio' | 'pin'>('choice');

  useEffect(() => {
    if (hasAnyCredential) {
      setMode('login');
    } else {
      setMode('setup');
    }
  }, [hasAnyCredential]);

  useEffect(() => {
    // Auto-trigger biometrics if they exist and are available
    if (mode === 'login' && hasBiometrics && isSecure && isSupported) {
      handleBiometricAuth();
    }
  }, [mode, hasBiometrics, isSecure, isSupported]);

  const handleBiometricAuth = async () => {
    setError('');
    const success = await authenticateBiometrics();
    if (!success) {
      setError('Biometric authentication failed. Please try again.');
    }
  };

  const handleBiometricSetup = async () => {
    setError('');
    const success = await setupBiometrics();
    if (!success) {
      setError('Could not set up biometrics. Try using a PIN instead.');
      setSetupMode('pin');
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'setup') {
      if (pinInput.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      setupPin(pinInput);
    } else {
      const success = authenticatePin(pinInput);
      if (!success) {
        setError('Incorrect PIN');
        setPinInput('');
      }
    }
  };

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-[400px] p-8 text-center glass rounded-2xl">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 bg-brand/15 text-brand">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl mb-2 font-semibold">Unlock Settlr</h2>
            <p className="text-slate-400">Welcome back! Please authenticate to continue.</p>
          </div>

          {!isSecure && hasBiometrics && (
            <div className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 p-3 rounded-lg mb-6 text-xs text-left">
              <AlertCircle size={24} className="shrink-0" /> 
              Biometrics (Fingerprint) require a secure connection (HTTPS). Please use your PIN.
            </div>
          )}

          {error && <div className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm"><AlertCircle size={18} /> {error}</div>}

          {(hasBiometrics && isSecure && isSupported) ? (
            <div className="flex flex-col gap-4">
              <button className="w-full inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-brand text-white p-4 text-base hover:bg-brand-hover" onClick={handleBiometricAuth}>
                <Fingerprint size={24} />
                Use Biometrics
              </button>
              {hasPin && (
                <button className="w-full bg-transparent border-none text-slate-400 p-2 text-sm cursor-pointer hover:text-slate-200" onClick={() => window.location.reload()}>
                  Use PIN instead
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={hasPin ? "Enter PIN" : "No PIN set - use Biometrics"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                maxLength={6}
                disabled={!hasPin}
                className="bg-black/20 border border-white/10 text-slate-100 p-4 rounded-xl font-sans text-2xl text-center tracking-[4px] outline-none focus:border-brand disabled:opacity-50"
                autoFocus
              />
              <button type="submit" disabled={!hasPin} className="w-full inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-brand text-white p-3.5 hover:bg-brand-hover disabled:opacity-50">Unlock</button>
              {hasBiometrics && isSecure && isSupported && (
                <button type="button" className="bg-transparent border-none text-slate-400 p-2 text-sm cursor-pointer hover:text-slate-200" onClick={() => window.location.reload()}>
                  Try Biometrics again
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-[400px] p-8 text-center glass rounded-2xl">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 bg-accent/15 text-accent">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl mb-2 font-semibold">Secure Your App</h2>
          <p className="text-slate-400">Protect your financial data from unauthorized access.</p>
        </div>

        {!isSecure && (
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 text-amber-500 p-3 rounded-lg mb-6 text-xs text-left">
            <AlertCircle size={24} className="shrink-0" /> 
            HTTPS is required for Biometrics. Please use a PIN if testing on a local network.
          </div>
        )}

        {error && <div className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm"><AlertCircle size={18} /> {error}</div>}

        {setupMode === 'choice' && (
          <div className="flex flex-col">
            {isSupported && isSecure && (
              <button className="w-full mb-3 inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-brand text-white p-3.5 hover:bg-brand-hover" onClick={handleBiometricSetup}>
                <Fingerprint size={20} />
                Set up Biometrics / Screen Lock
              </button>
            )}
            <button className="w-full inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-white/10 text-slate-100 p-3.5 hover:bg-white/20" onClick={() => setSetupMode('pin')}>
              <Lock size={20} />
              Set up PIN Code
            </button>
          </div>
        )}

        {setupMode === 'pin' && (
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <p className="text-slate-400 text-sm">Create a secure PIN code (min 4 digits):</p>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter New PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={6}
              className="bg-black/20 border border-white/10 text-slate-100 p-4 rounded-xl font-sans text-2xl text-center tracking-[4px] outline-none focus:border-brand"
              autoFocus
            />
            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-brand text-white p-3.5 hover:bg-brand-hover">Save PIN</button>
            <button type="button" className="w-full mt-2 inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-transparent text-slate-400 p-3.5 hover:text-slate-100" onClick={() => setSetupMode('choice')}>Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
