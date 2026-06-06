import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionProvider, TransactionContext } from '../TransactionContext';
import { AuthContext, AuthContextType } from '../AuthContext';
import React, { useContext } from 'react';

// ─── Mock Firebase modules ────────────────────────────────────────────────────

vi.mock('../../firebase', () => ({
  db: {},
  auth: {}
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => vi.fn()),  // returns unsubscribe mock
  doc: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({ id: 'new-cloud-id' })),
  updateDoc: vi.fn(async () => {}),
  deleteDoc: vi.fn(async () => {}),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn(async () => {})
  }))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn())
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const Wrapper: React.FC<{ children: React.ReactNode; authOverrides?: Partial<AuthContextType> }> = ({
  children,
  authOverrides = {}
}) => (
  <AuthContext.Provider value={{ ...mockAuthContext, ...authOverrides }}>
    <TransactionProvider>
      {children}
    </TransactionProvider>
  </AuthContext.Provider>
);

const TestComponent = () => {
  const context = useContext(TransactionContext);
  if (!context) return null;

  return (
    <div>
      <div data-testid="net-balance">{context.netBalance}</div>
      <div data-testid="tx-count">{context.transactions.length}</div>
      {context.transactions.map(t => (
        <div key={t.id} data-testid="transaction-item" data-txid={t.id}>
          <div data-testid={`tx-amount-${t.id}`}>{t.amount}</div>
          <div data-testid={`tx-type-${t.id}`}>{t.type}</div>
          <div data-testid={`tx-entries-count-${t.id}`}>{t.entries?.length || 0}</div>
          <button
            data-testid={`add-sub-owed-${t.id}`}
            onClick={() => context.addSubEntry(t.id, { amount: 300, description: 'More lent', type: 'owed' })}
          >
            Add Owed Sub
          </button>
          <button
            data-testid={`add-sub-owe-${t.id}`}
            onClick={() => context.addSubEntry(t.id, { amount: 1000, description: 'Borrowing', type: 'owe' })}
          >
            Add Owe Sub
          </button>
          {t.entries?.map((e, idx) => (
            <button
              key={e.id}
              data-testid={`del-sub-${t.id}-${idx}`}
              onClick={() => context.deleteSubEntry(t.id, e.id)}
            >
              Delete {idx}
            </button>
          ))}
        </div>
      ))}
      <button
        data-testid="add-btn"
        onClick={() => context.addTransaction({ type: 'owed', amount: 500, person: 'Bob', description: '' })}
      >
        Add
      </button>
    </div>
  );
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionContext', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });
    window.localStorage.clear();
  });

  it('provides initial state and calculates balance', () => {
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    expect(screen.getByTestId('net-balance')).toHaveTextContent('0');
  });

  it('updates state and recalculates when a transaction is added', async () => {
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    await act(async () => {
      screen.getByTestId('add-btn').click();
    });

    expect(screen.getByTestId('net-balance')).toHaveTextContent('500');
  });

  it('migrates older transactions without entries on mount', async () => {
    const oldTransaction = {
      id: 'old-1',
      type: 'owed',
      amount: 400,
      person: 'Alice',
      description: 'Lent for lunch',
      date: new Date().toISOString(),
      settled: false,
      history: []
    };

    const store: Record<string, string> = {
      'settlr_transactions': JSON.stringify([oldTransaction])
    };

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true
    });

    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    const amountElement = await screen.findByTestId('tx-amount-old-1');
    expect(amountElement).toHaveTextContent('400');
    expect(screen.getByTestId('tx-entries-count-old-1')).toHaveTextContent('1');
  });

  it('recalculates balance and details when sub-entries are added or deleted', async () => {
    render(
      <Wrapper>
        <TestComponent />
      </Wrapper>
    );

    // 1. Add base transaction (owed 500)
    await act(async () => {
      screen.getByTestId('add-btn').click();
    });

    expect(screen.getByTestId('net-balance')).toHaveTextContent('500');

    const countElement = screen.getByTestId('tx-count');
    expect(countElement).toHaveTextContent('1');

    const txElement = screen.getByTestId('transaction-item');
    const txId = txElement.getAttribute('data-txid');
    expect(txId).toBeDefined();

    expect(screen.getByTestId(`tx-amount-${txId}`)).toHaveTextContent('500');
    expect(screen.getByTestId(`tx-type-${txId}`)).toHaveTextContent('owed');
    expect(screen.getByTestId(`tx-entries-count-${txId}`)).toHaveTextContent('1');

    // 2. Add an "owed" sub-entry (amount 300) -> total owed should become 800
    await act(async () => {
      screen.getByTestId(`add-sub-owed-${txId}`).click();
    });

    expect(screen.getByTestId(`tx-amount-${txId}`)).toHaveTextContent('800');
    expect(screen.getByTestId(`tx-type-${txId}`)).toHaveTextContent('owed');
    expect(screen.getByTestId(`tx-entries-count-${txId}`)).toHaveTextContent('2');
    expect(screen.getByTestId('net-balance')).toHaveTextContent('800');

    // 3. Add an opposite "owe" sub-entry (amount 1000) -> total owed should flip to "owe" 200
    await act(async () => {
      screen.getByTestId(`add-sub-owe-${txId}`).click();
    });

    expect(screen.getByTestId(`tx-amount-${txId}`)).toHaveTextContent('200');
    expect(screen.getByTestId(`tx-type-${txId}`)).toHaveTextContent('owe');
    expect(screen.getByTestId(`tx-entries-count-${txId}`)).toHaveTextContent('3');
    expect(screen.getByTestId('net-balance')).toHaveTextContent('-200');

    // 4. Delete the "owe" sub-entry (the 3rd one, index 2) -> total owed should go back to 800 (owed)
    await act(async () => {
      screen.getByTestId(`del-sub-${txId}-2`).click();
    });

    expect(screen.getByTestId(`tx-amount-${txId}`)).toHaveTextContent('800');
    expect(screen.getByTestId(`tx-type-${txId}`)).toHaveTextContent('owed');
    expect(screen.getByTestId(`tx-entries-count-${txId}`)).toHaveTextContent('2');
    expect(screen.getByTestId('net-balance')).toHaveTextContent('800');
  });
});
