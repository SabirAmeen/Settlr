import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionList from '../TransactionList';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';

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

// ─── Mock Context ─────────────────────────────────────────────────────────────

const mockTransactions = [
  { id: '1', type: 'owed' as const, amount: 100, person: 'John', description: 'Lunch', date: new Date().toISOString(), settled: false, history: [], entries: [] },
  { id: '2', type: 'owe' as const, amount: 50, person: 'Jane', description: 'Coffee', date: new Date().toISOString(), settled: true, history: [], entries: [] }
];

const mockContext: TransactionContextType = {
  transactions: mockTransactions,
  isSyncing: false,
  addTransaction: vi.fn(async () => {}),
  updateTransaction: vi.fn(async () => {}),
  deleteTransaction: vi.fn(async () => {}),
  toggleSettled: vi.fn(async () => {}),
  addSubEntry: vi.fn(async () => {}),
  deleteSubEntry: vi.fn(async () => {}),
  totalIOwe: 50,
  totalOwedToMe: 100,
  netBalance: 50,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionList Component', () => {
  it('renders transactions and filters correctly', () => {
    render(
      <TransactionContext.Provider value={mockContext}>
        <TransactionList />
      </TransactionContext.Provider>
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();

    const owedFilter = screen.getByText('Owed to me');
    fireEvent.click(owedFilter);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.queryByText('Jane')).not.toBeInTheDocument();
  });
});
