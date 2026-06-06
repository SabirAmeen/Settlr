import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionForm from '../TransactionForm';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';
import userEvent from '@testing-library/user-event';

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

const mockContext: TransactionContextType = {
  transactions: [],
  isSyncing: false,
  addTransaction: vi.fn(async () => {}),
  updateTransaction: vi.fn(async () => {}),
  deleteTransaction: vi.fn(async () => {}),
  toggleSettled: vi.fn(async () => {}),
  addSubEntry: vi.fn(async () => {}),
  deleteSubEntry: vi.fn(async () => {}),
  totalIOwe: 0,
  totalOwedToMe: 0,
  netBalance: 0,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransactionForm Component', () => {
  it('submits a new transaction correctly', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <TransactionContext.Provider value={mockContext}>
        <TransactionForm onClose={onClose} />
      </TransactionContext.Provider>
    );

    const amountInput = screen.getByPlaceholderText('0');
    const personInput = screen.getByPlaceholderText('E.g. John Doe');
    const submitBtn = screen.getByText('Add Record');

    await user.type(amountInput, '200');
    await user.type(personInput, 'Alice');

    await user.click(submitBtn);

    expect(mockContext.addTransaction).toHaveBeenCalledWith({
      type: 'owed',
      amount: 200,
      person: 'Alice',
      description: ''
    });
    expect(onClose).toHaveBeenCalled();
  });
});
