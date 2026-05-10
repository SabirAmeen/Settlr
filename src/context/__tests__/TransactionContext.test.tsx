import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionProvider, TransactionContext } from '../TransactionContext';
import React, { useContext } from 'react';

const TestComponent = () => {
  const context = useContext(TransactionContext);
  if (!context) return null;

  return (
    <div>
      <div data-testid="net-balance">{context.netBalance}</div>
      <button 
        data-testid="add-btn" 
        onClick={() => context.addTransaction({ type: 'owed', amount: 500, person: 'Bob', description: '' })}
      >
        Add
      </button>
    </div>
  );
};

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
      <TransactionProvider>
        <TestComponent />
      </TransactionProvider>
    );

    expect(screen.getByTestId('net-balance')).toHaveTextContent('0');
  });

  it('updates state and recalculates when a transaction is added', async () => {
    render(
      <TransactionProvider>
        <TestComponent />
      </TransactionProvider>
    );

    act(() => {
      screen.getByTestId('add-btn').click();
    });

    expect(screen.getByTestId('net-balance')).toHaveTextContent('500');
  });
});
