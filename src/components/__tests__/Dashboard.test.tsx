import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../Dashboard';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';
import React from 'react';

const mockContext: TransactionContextType = {
  transactions: [],
  addTransaction: () => {},
  deleteTransaction: () => {},
  toggleSettled: () => {},
  totalIOwe: 500,
  totalOwedToMe: 1500,
  netBalance: 1000,
};

describe('Dashboard Component', () => {
  it('renders net balance correctly when positive', () => {
    render(
      <TransactionContext.Provider value={mockContext}>
        <Dashboard />
      </TransactionContext.Provider>
    );
    expect(screen.getByText(/₹1,000/)).toBeInTheDocument();
    expect(screen.getByText(/\(You are owed\)/)).toBeInTheDocument();
  });

  it('renders net balance correctly when negative', () => {
    const negativeContext = { ...mockContext, netBalance: -500 };
    render(
      <TransactionContext.Provider value={negativeContext}>
        <Dashboard />
      </TransactionContext.Provider>
    );
    expect(screen.getAllByText(/₹500/)[0]).toBeInTheDocument();
    expect(screen.getByText(/\(You owe\)/)).toBeInTheDocument();
  });
});
