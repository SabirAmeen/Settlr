import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface HistoryEntry {
  date: string;
  amount: number;
  person: string;
  description: string;
  type: 'owe' | 'owed';
}

export interface Transaction {
  id: string;
  type: 'owe' | 'owed';
  amount: number;
  person: string;
  description: string;
  date: string;
  settled: boolean;
  history: HistoryEntry[];
}

export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history'>) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history'>) => void;
  deleteTransaction: (id: string) => void;
  toggleSettled: (id: string) => void;
  totalIOwe: number;
  totalOwedToMe: number;
  netBalance: number;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('settlr_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settlr_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      settled: false,
      history: []
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history'>) => {
    setTransactions((prev) => 
      prev.map(t => {
        if (t.id === id) {
          const historyEntry: HistoryEntry = {
            date: new Date().toISOString(),
            amount: t.amount,
            person: t.person,
            description: t.description,
            type: t.type
          };
          return {
            ...t,
            ...updates,
            history: [historyEntry, ...t.history]
          };
        }
        return t;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter(t => t.id !== id));
  };

  const toggleSettled = (id: string) => {
    setTransactions((prev) => 
      prev.map(t => t.id === id ? { ...t, settled: !t.settled } : t)
    );
  };

  const totalIOwe = transactions
    .filter(t => t.type === 'owe' && !t.settled)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOwedToMe = transactions
    .filter(t => t.type === 'owed' && !t.settled)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      toggleSettled,
      totalIOwe,
      totalOwedToMe,
      netBalance
    }}>
      {children}
    </TransactionContext.Provider>
  );
};
