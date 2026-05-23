import React, { useContext, useState } from 'react';
import { TransactionContext, Transaction } from '../context/TransactionContext';
import { CheckCircle, Circle, Trash2, Calendar, User, Pencil, History, Clock, PlusCircle } from 'lucide-react';
import TransactionForm from './TransactionForm';

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

type FilterType = 'all' | 'owe' | 'owed';

const TransactionList: React.FC = () => {
  const context = useContext(TransactionContext);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [addingSubEntryTo, setAddingSubEntryTo] = useState<Transaction | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  if (!context) return null;
  const { transactions, toggleSettled, deleteTransaction, deleteSubEntry } = context;

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 px-5 text-slate-400 glass">
        <p>No transactions yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-xl">
        <button 
          className={`flex-1 border-none py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'all' ? 'bg-surface text-slate-100 shadow-md' : 'bg-transparent text-slate-400'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`flex-1 border-none py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'owed' ? 'bg-surface text-slate-100 shadow-md' : 'bg-transparent text-slate-400'}`}
          onClick={() => setFilter('owed')}
        >
          Owed to me
        </button>
        <button 
          className={`flex-1 border-none py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'owe' ? 'bg-surface text-slate-100 shadow-md' : 'bg-transparent text-slate-400'}`}
          onClick={() => setFilter('owe')}
        >
          I Owe
        </button>
      </div>

      <div className="flex flex-col gap-3 pb-20">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">No matching transactions.</div>
        ) : (
          filteredTransactions.map((t) => (
            <div key={t.id} className="flex flex-col gap-0">
              <div className={`flex items-center p-3 sm:p-4 gap-3 sm:gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 glass ${t.settled ? 'opacity-50' : ''}`}>
                <div className="cursor-pointer shrink-0" onClick={() => toggleSettled(t.id)}>
                  {t.settled ? <CheckCircle className="text-emerald-500" /> : <Circle className="text-slate-400" />}
                </div>
                
                <div className={`flex-1 min-w-0 ${t.settled ? 'line-through' : ''}`}>
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="font-semibold text-sm sm:text-base flex items-center gap-1.5 truncate">
                      <User size={14} className="shrink-0" /> {t.person}
                    </span>
                    <span className={`font-bold text-sm sm:text-base shrink-0 ${t.type === 'owe' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {t.type === 'owe' ? '-' : '+'}{formatINR(t.amount)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mb-2 truncate">{t.description || 'No description'}</div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 shrink-0"><Calendar size={12} /> {formatDate(t.date)}</span>
                    <span className={`text-[9px] sm:text-[10px] uppercase py-0.5 px-1.5 rounded font-semibold tracking-wide shrink-0 ${t.type === 'owe' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {t.type === 'owe' ? 'You Owe' : 'Owes You'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <div className="flex gap-1">
                    <button 
                      className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors hover:text-emerald-500 hover:bg-emerald-500/10" 
                      onClick={() => setAddingSubEntryTo(t)}
                      title="Add Entry"
                    >
                      <PlusCircle size={18} />
                    </button>
                    <button 
                      className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors hover:text-brand hover:bg-brand/10" 
                      onClick={() => setEditingTransaction(t)}
                      title="Edit"
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      className="bg-transparent border-none text-slate-400 cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors hover:text-red-500 hover:bg-red-500/10" 
                      onClick={() => deleteTransaction(t.id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {((t.history && t.history.length > 0) || (t.entries && t.entries.length > 1)) && (
                    <button 
                      className={`bg-transparent border-none cursor-pointer p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold ${viewingHistory === t.id ? 'text-brand bg-brand/10' : 'text-slate-500 hover:text-slate-300'}`}
                      onClick={() => setViewingHistory(viewingHistory === t.id ? null : t.id)}
                      title="View Logs"
                    >
                      <History size={14} /> {t.entries && t.entries.length > 1 ? t.entries.length : t.history.length}
                    </button>
                  )}
                </div>
              </div>

              {viewingHistory === t.id && (
                <div className="mx-4 mt-[-1px] mb-3 p-4 bg-black/30 rounded-b-xl border border-white/5 text-xs animate-[fadeIn_0.2s_ease] flex flex-col gap-4">
                  <div>
                    <h4 className="flex items-center gap-1.5 mb-3 text-slate-300 font-medium border-b border-white/5 pb-2">
                      <Clock size={12} className="text-brand" /> Transaction Entries
                    </h4>
                    <div className="space-y-2">
                      {(t.entries && t.entries.length > 0 ? t.entries : [
                        {
                          id: t.id,
                          date: t.date,
                          amount: t.amount,
                          description: t.description || 'Initial record',
                          type: t.type
                        }
                      ]).map((entry, idx) => (
                        <div key={entry.id || idx} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-200 font-medium">{entry.description || 'No description'}</span>
                            <span className="text-slate-500 text-[10px]">{formatDate(entry.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${entry.type === 'owe' ? 'text-red-500/80' : 'text-emerald-500/80'}`}>
                              {entry.type === 'owe' ? '-' : '+'}{formatINR(entry.amount)}
                            </span>
                            {t.entries && t.entries.length > 1 && (
                              <button 
                                className="bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded hover:text-red-500 transition-colors"
                                onClick={() => deleteSubEntry(t.id, entry.id)}
                                title="Delete Entry"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {t.history && t.history.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-1.5 mb-3 text-slate-300 font-medium border-b border-white/5 pb-2">
                        <History size={12} className="text-brand" /> Edit Logs
                      </h4>
                      <div className="space-y-2">
                        {t.history.map((h, i) => (
                          <div key={i} className="border-l-2 border-brand/30 pl-3 py-1 flex justify-between items-center">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-slate-200 font-medium">{h.changeReason || 'Record updated'}</span>
                              <span className="text-slate-500 text-[10px]">{formatDate(h.date)}</span>
                            </div>
                            <span className="text-slate-400 font-medium text-[10px]">
                              Prior Total: {h.type === 'owe' ? '-' : '+'}{formatINR(h.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editingTransaction && (
        <TransactionForm 
          transactionToEdit={editingTransaction} 
          onClose={() => setEditingTransaction(null)} 
        />
      )}

      {addingSubEntryTo && (
        <TransactionForm 
          parentTransaction={addingSubEntryTo} 
          onClose={() => setAddingSubEntryTo(null)} 
        />
      )}
    </div>
  );
};

export default TransactionList;
