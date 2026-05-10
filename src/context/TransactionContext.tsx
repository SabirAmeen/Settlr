import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  type: 'owe' | 'owed';
  amount: number;
  person: string;
  description: string;
  date: string;
  settled: boolean;
}

export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'settled'>) => void;
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

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'settled'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      settled: false
    };
    setTransactions((prev) => [newTransaction, ...prev]);
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
