import React, { useContext, useState } from 'react';
import { TransactionContext } from '../context/TransactionContext';
import { CheckCircle, Circle, Trash2, Calendar, User } from 'lucide-react';

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

  if (!context) return null;
  const { transactions, toggleSettled, deleteTransaction } = context;

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
          className={`flex-1 bg-transparent border-none text-slate-400 py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'all' ? 'bg-surface text-slate-100 shadow-md' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`flex-1 bg-transparent border-none text-slate-400 py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'owed' ? 'bg-surface text-slate-100 shadow-md' : ''}`}
          onClick={() => setFilter('owed')}
        >
          Owed to me
        </button>
        <button 
          className={`flex-1 bg-transparent border-none text-slate-400 py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ${filter === 'owe' ? 'bg-surface text-slate-100 shadow-md' : ''}`}
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
            <div key={t.id} className={`flex items-center p-4 gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 glass ${t.settled ? 'opacity-50' : ''}`}>
              <div className="cursor-pointer" onClick={() => toggleSettled(t.id)}>
                {t.settled ? <CheckCircle className="text-emerald-500" /> : <Circle className="text-slate-400" />}
              </div>
              
              <div className={`flex-1 ${t.settled ? 'line-through' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-base flex items-center gap-1.5"><User size={14} /> {t.person}</span>
                  <span className={`font-bold text-base ${t.type === 'owe' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {t.type === 'owe' ? '-' : '+'}{formatINR(t.amount)}
                  </span>
                </div>
                <div className="text-sm text-slate-400 mb-2">{t.description}</div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={12} /> {formatDate(t.date)}</span>
                  <span className={`text-[10px] uppercase py-0.5 px-1.5 rounded font-semibold tracking-wide ${t.type === 'owe' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {t.type === 'owe' ? 'You Owe' : 'Owes You'}
                  </span>
                </div>
              </div>

              <button className="bg-transparent border-none text-slate-400 cursor-pointer p-2 rounded-lg transition-colors hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteTransaction(t.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;
