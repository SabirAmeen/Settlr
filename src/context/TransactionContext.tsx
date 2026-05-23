import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface HistoryEntry {
  date: string;
  amount: number;
  person: string;
  description: string;
  type: 'owe' | 'owed';
  changeReason?: string;
}

export interface TransactionEntry {
  id: string;
  date: string;
  amount: number;
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
  entries?: TransactionEntry[];
}

export interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>) => void;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>, changeReason: string) => void;
  deleteTransaction: (id: string) => void;
  toggleSettled: (id: string) => void;
  addSubEntry: (id: string, entry: { amount: number; description: string; type: 'owe' | 'owed' }) => void;
  deleteSubEntry: (transactionId: string, entryId: string) => void;
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
        const parsed = JSON.parse(saved) as Transaction[];
        const migrated = parsed.map(t => {
          if (!t.entries || t.entries.length === 0) {
            return {
              ...t,
              entries: [
                {
                  id: t.id,
                  date: t.date,
                  amount: t.amount,
                  description: t.description || 'Initial record',
                  type: t.type
                }
              ]
            };
          }
          return t;
        });
        setTransactions(migrated);
      } catch (e) {
        console.error("Failed to parse local storage data");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settlr_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>) => {
    const id = crypto.randomUUID();
    const date = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      date,
      settled: false,
      history: [],
      entries: [
        {
          id,
          date,
          amount: transaction.amount,
          description: transaction.description || 'Initial record',
          type: transaction.type
        }
      ]
    };
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>, changeReason: string) => {
    setTransactions((prev) => 
      prev.map(t => {
        if (t.id === id) {
          const historyEntry: HistoryEntry = {
            date: new Date().toISOString(),
            amount: t.amount,
            person: t.person,
            description: t.description,
            type: t.type,
            changeReason: changeReason
          };
          
          let updatedEntries = t.entries;
          if (!updatedEntries || updatedEntries.length <= 1) {
            updatedEntries = [
              {
                id: updatedEntries?.[0]?.id || t.id,
                date: updatedEntries?.[0]?.date || t.date,
                amount: updates.amount,
                description: updates.description || 'Initial record',
                type: updates.type
              }
            ];
          }

          return {
            ...t,
            ...updates,
            entries: updatedEntries,
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

  const addSubEntry = (id: string, entry: { amount: number; description: string; type: 'owe' | 'owed' }) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const currentEntries = t.entries || [
            {
              id: t.id,
              date: t.date,
              amount: t.amount,
              description: t.description || 'Initial record',
              type: t.type
            }
          ];

          const newEntry = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            amount: entry.amount,
            description: entry.description || 'Sub-entry added',
            type: entry.type
          };

          const updatedEntries = [...currentEntries, newEntry];

          // Recalculate parent net
          let net = 0;
          updatedEntries.forEach(e => {
            net += e.type === 'owed' ? Number(e.amount) : -Number(e.amount);
          });

          return {
            ...t,
            amount: Math.abs(net),
            type: net >= 0 ? 'owed' : 'owe',
            description: entry.description || t.description,
            date: newEntry.date,
            entries: updatedEntries
          };
        }
        return t;
      })
    );
  };

  const deleteSubEntry = (transactionId: string, entryId: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === transactionId) {
          const currentEntries = t.entries || [
            {
              id: t.id,
              date: t.date,
              amount: t.amount,
              description: t.description || 'Initial record',
              type: t.type
            }
          ];

          if (currentEntries.length <= 1) {
            return t; // Keep at least one entry
          }

          const updatedEntries = currentEntries.filter(e => e.id !== entryId);

          // Recalculate parent net
          let net = 0;
          updatedEntries.forEach(e => {
            net += e.type === 'owed' ? Number(e.amount) : -Number(e.amount);
          });

          return {
            ...t,
            amount: Math.abs(net),
            type: net >= 0 ? 'owed' : 'owe',
            entries: updatedEntries
          };
         }
         return t;
       })
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
      addSubEntry,
      deleteSubEntry,
      totalIOwe,
      totalOwedToMe,
      netBalance
    }}>
      {children}
    </TransactionContext.Provider>
  );
};
