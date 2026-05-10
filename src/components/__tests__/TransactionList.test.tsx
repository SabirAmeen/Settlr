import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionList from '../TransactionList';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';
import React from 'react';

const mockTransactions = [
  { id: '1', type: 'owed' as const, amount: 100, person: 'John', description: 'Lunch', date: new Date().toISOString(), settled: false },
  { id: '2', type: 'owe' as const, amount: 50, person: 'Jane', description: 'Coffee', date: new Date().toISOString(), settled: true }
];

const mockContext: TransactionContextType = {
  transactions: mockTransactions,
  addTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  toggleSettled: vi.fn(),
  totalIOwe: 50,
  totalOwedToMe: 100,
  netBalance: 50,
};

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
