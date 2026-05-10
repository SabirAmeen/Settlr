import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TransactionForm from '../TransactionForm';
import { TransactionContext, TransactionContextType } from '../../context/TransactionContext';
import React from 'react';
import userEvent from '@testing-library/user-event';

const mockContext: TransactionContextType = {
  transactions: [],
  addTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  toggleSettled: vi.fn(),
  totalIOwe: 0,
  totalOwedToMe: 0,
  netBalance: 0,
};

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
