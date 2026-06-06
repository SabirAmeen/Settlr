import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from './AuthContext';

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
  isSyncing: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>) => Promise<void>;
  updateTransaction: (id: string, updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>, changeReason: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleSettled: (id: string) => Promise<void>;
  addSubEntry: (id: string, entry: { amount: number; description: string; type: 'owe' | 'owed' }) => Promise<void>;
  deleteSubEntry: (transactionId: string, entryId: string) => Promise<void>;
  totalIOwe: number;
  totalOwedToMe: number;
  netBalance: number;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// ─── Local Storage Helpers ────────────────────────────────────────────────────

const LOCAL_KEY = 'settlr_transactions';
const LOCAL_BACKUP_KEY = 'settlr_transactions_backup';

const loadLocalTransactions = (): Transaction[] => {
  const saved = localStorage.getItem(LOCAL_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as Transaction[];
    return parsed.map(t => {
      if (!t.entries || t.entries.length === 0) {
        return {
          ...t,
          entries: [{
            id: t.id,
            date: t.date,
            amount: t.amount,
            description: t.description || 'Initial record',
            type: t.type
          }]
        };
      }
      return t;
    });
  } catch {
    console.error('Failed to parse local storage data');
    return [];
  }
};

const saveLocalTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(transactions));
};

// ─── Cloud Migration ──────────────────────────────────────────────────────────

const migrateLocalToCloud = async (uid: string): Promise<void> => {
  const saved = localStorage.getItem(LOCAL_KEY);
  if (!saved) return;
  try {
    const localTxs = JSON.parse(saved) as Transaction[];
    if (localTxs.length > 0) {
      const batch = writeBatch(db);
      localTxs.forEach(t => {
        const docRef = doc(collection(db, 'transactions'), t.id);
        batch.set(docRef, { ...t, userId: uid });
      });
      await batch.commit();
      console.log(`Migrated ${localTxs.length} local transactions to Firestore.`);
    }
    // Backup then clear so migration doesn't run again
    localStorage.setItem(LOCAL_BACKUP_KEY, saved);
    localStorage.removeItem(LOCAL_KEY);
  } catch (err) {
    console.error('Migration failed:', err);
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const isSyncEnabled = authContext?.isSyncEnabled ?? false;
  const googleUser = authContext?.googleUser ?? null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Track whether we're already subscribed to Firestore to avoid duplicate listeners
  const firestoreUnsub = useRef<Unsubscribe | null>(null);

  // ── Effect: switch between local and cloud mode ─────────────────────────────
  useEffect(() => {
    // Clean up any previous Firestore listener
    if (firestoreUnsub.current) {
      firestoreUnsub.current();
      firestoreUnsub.current = null;
    }

    if (isSyncEnabled && googleUser) {
      // ── CLOUD MODE ────────────────────────────────────────────────────────
      setIsSyncing(true);

      migrateLocalToCloud(googleUser.uid).then(() => {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', googleUser.uid)
        );

        firestoreUnsub.current = onSnapshot(q, (snapshot) => {
          const fetched: Transaction[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Strip the userId field before storing in state
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { userId: _uid, ...rest } = data;
            fetched.push({ id: docSnap.id, ...rest } as Transaction);
          });
          fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(fetched);
          setIsSyncing(false);
        }, (err) => {
          console.error('Firestore snapshot error:', err);
          setIsSyncing(false);
        });
      });
    } else {
      // ── LOCAL MODE ────────────────────────────────────────────────────────
      setTransactions(loadLocalTransactions());
    }

    return () => {
      if (firestoreUnsub.current) {
        firestoreUnsub.current();
        firestoreUnsub.current = null;
      }
    };
  }, [isSyncEnabled, googleUser]);

  // ── Persist to localStorage only in local mode ──────────────────────────────
  useEffect(() => {
    if (!isSyncEnabled) {
      saveLocalTransactions(transactions);
    }
  }, [transactions, isSyncEnabled]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addTransaction = async (
    transaction: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>
  ): Promise<void> => {
    const date = new Date().toISOString();

    if (isSyncEnabled && googleUser) {
      await addDoc(collection(db, 'transactions'), {
        ...transaction,
        userId: googleUser.uid,
        date,
        settled: false,
        history: [],
        entries: [{
          id: crypto.randomUUID(),
          date,
          amount: transaction.amount,
          description: transaction.description || 'Initial record',
          type: transaction.type
        }]
      });
    } else {
      const id = crypto.randomUUID();
      const newTransaction: Transaction = {
        ...transaction,
        id,
        date,
        settled: false,
        history: [],
        entries: [{
          id,
          date,
          amount: transaction.amount,
          description: transaction.description || 'Initial record',
          type: transaction.type
        }]
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Omit<Transaction, 'id' | 'date' | 'settled' | 'history' | 'entries'>,
    changeReason: string
  ): Promise<void> => {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    const historyEntry: HistoryEntry = {
      date: new Date().toISOString(),
      amount: t.amount,
      person: t.person,
      description: t.description,
      type: t.type,
      changeReason
    };

    let updatedEntries = t.entries;
    if (!updatedEntries || updatedEntries.length <= 1) {
      updatedEntries = [{
        id: updatedEntries?.[0]?.id || t.id,
        date: updatedEntries?.[0]?.date || t.date,
        amount: updates.amount,
        description: updates.description || 'Initial record',
        type: updates.type
      }];
    }

    if (isSyncEnabled && googleUser) {
      await updateDoc(doc(db, 'transactions', id), {
        ...updates,
        entries: updatedEntries,
        history: [historyEntry, ...t.history]
      });
    } else {
      setTransactions(prev =>
        prev.map(item =>
          item.id === id
            ? { ...item, ...updates, entries: updatedEntries, history: [historyEntry, ...item.history] }
            : item
        )
      );
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (isSyncEnabled && googleUser) {
      await deleteDoc(doc(db, 'transactions', id));
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleSettled = async (id: string): Promise<void> => {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    if (isSyncEnabled && googleUser) {
      await updateDoc(doc(db, 'transactions', id), { settled: !t.settled });
    } else {
      setTransactions(prev =>
        prev.map(item => item.id === id ? { ...item, settled: !item.settled } : item)
      );
    }
  };

  const addSubEntry = async (
    id: string,
    entry: { amount: number; description: string; type: 'owe' | 'owed' }
  ): Promise<void> => {
    const t = transactions.find(item => item.id === id);
    if (!t) return;

    const currentEntries = t.entries || [{
      id: t.id,
      date: t.date,
      amount: t.amount,
      description: t.description || 'Initial record',
      type: t.type
    }];

    const newEntry: TransactionEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: entry.amount,
      description: entry.description || 'Sub-entry added',
      type: entry.type
    };

    const updatedEntries = [...currentEntries, newEntry];

    let net = 0;
    updatedEntries.forEach(e => {
      net += e.type === 'owed' ? Number(e.amount) : -Number(e.amount);
    });

    const parentUpdates = {
      amount: Math.abs(net),
      type: net >= 0 ? 'owed' : 'owe' as 'owe' | 'owed',
      description: entry.description || t.description,
      date: newEntry.date,
      entries: updatedEntries
    };

    if (isSyncEnabled && googleUser) {
      await updateDoc(doc(db, 'transactions', id), parentUpdates);
    } else {
      setTransactions(prev =>
        prev.map(item => item.id === id ? { ...item, ...parentUpdates } : item)
      );
    }
  };

  const deleteSubEntry = async (transactionId: string, entryId: string): Promise<void> => {
    const t = transactions.find(item => item.id === transactionId);
    if (!t) return;

    const currentEntries = t.entries || [{
      id: t.id,
      date: t.date,
      amount: t.amount,
      description: t.description || 'Initial record',
      type: t.type
    }];

    if (currentEntries.length <= 1) return;

    const updatedEntries = currentEntries.filter(e => e.id !== entryId);

    let net = 0;
    updatedEntries.forEach(e => {
      net += e.type === 'owed' ? Number(e.amount) : -Number(e.amount);
    });

    const parentUpdates = {
      amount: Math.abs(net),
      type: net >= 0 ? 'owed' : 'owe' as 'owe' | 'owed',
      entries: updatedEntries
    };

    if (isSyncEnabled && googleUser) {
      await updateDoc(doc(db, 'transactions', transactionId), parentUpdates);
    } else {
      setTransactions(prev =>
        prev.map(item => item.id === transactionId ? { ...item, ...parentUpdates } : item)
      );
    }
  };

  // ─── Derived totals ──────────────────────────────────────────────────────────

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
      isSyncing,
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
