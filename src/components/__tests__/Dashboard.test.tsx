import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../Dashboard';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';
import { AuthContext, AuthContextType } from '../../context/AuthContext';
import React from 'react';

// ─── Mock Firebase modules ────────────────────────────────────────────────────

vi.mock('../../firebase', () => ({ db: {}, auth: {} }));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(), collection: vi.fn(), query: vi.fn(), where: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), doc: vi.fn(), addDoc: vi.fn(),
  updateDoc: vi.fn(), deleteDoc: vi.fn(), writeBatch: vi.fn(() => ({ set: vi.fn(), commit: vi.fn() }))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(), GoogleAuthProvider: vi.fn(), signInWithPopup: vi.fn(),
  signOut: vi.fn(), onAuthStateChanged: vi.fn(() => vi.fn())
}));

// ─── Mock Contexts ────────────────────────────────────────────────────────────

const mockTxContext: TransactionContextType = {
  transactions: [],
  isSyncing: false,
  addTransaction: vi.fn(async () => {}),
  updateTransaction: vi.fn(async () => {}),
  deleteTransaction: vi.fn(async () => {}),
  toggleSettled: vi.fn(async () => {}),
  addSubEntry: vi.fn(async () => {}),
  deleteSubEntry: vi.fn(async () => {}),
  totalIOwe: 500,
  totalOwedToMe: 1500,
  netBalance: 1000,
};

const mockAuthContext: AuthContextType = {
  isAuthenticated: true,
  isSupported: false,
  isSecure: true,
  hasBiometrics: false,
  hasPin: false,
  pin: null,
  setupBiometrics: vi.fn(async () => false),
  authenticateBiometrics: vi.fn(async () => false),
  setupPin: vi.fn(),
  authenticatePin: vi.fn(() => true),
  resetAuth: vi.fn(),
  googleUser: null,
  isSyncEnabled: false,
  isSyncLoading: false,
  enableCloudSync: vi.fn(async () => {}),
  disableCloudSync: vi.fn(async () => {}),
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={mockAuthContext}>
    <TransactionContext.Provider value={mockTxContext}>
      {children}
    </TransactionContext.Provider>
  </AuthContext.Provider>
);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Dashboard Component', () => {
  it('renders net balance correctly when positive', () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    expect(screen.getByText(/₹1,000/)).toBeInTheDocument();
    expect(screen.getByText(/\(You are owed\)/)).toBeInTheDocument();
  });

  it('renders net balance correctly when negative', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <TransactionContext.Provider value={{ ...mockTxContext, netBalance: -500 }}>
          <Dashboard />
        </TransactionContext.Provider>
      </AuthContext.Provider>
    );
    expect(screen.getAllByText(/₹500/)[0]).toBeInTheDocument();
    expect(screen.getByText(/\(You owe\)/)).toBeInTheDocument();
  });

  it('shows Enable Cloud Sync button when sync is disabled', () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    expect(screen.getByText(/Enable Cloud Sync with Google/)).toBeInTheDocument();
  });

  it('shows synced indicator when sync is enabled', () => {
    render(
      <AuthContext.Provider value={{
        ...mockAuthContext,
        isSyncEnabled: true,
        googleUser: { email: 'test@gmail.com', uid: 'uid-1' } as any
      }}>
        <TransactionContext.Provider value={mockTxContext}>
          <Dashboard />
        </TransactionContext.Provider>
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Synced as/)).toBeInTheDocument();
    expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
  });
});
