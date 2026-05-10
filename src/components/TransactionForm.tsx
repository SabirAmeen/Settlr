import React, { useState, useContext } from 'react';
import { TransactionContext, Transaction } from '../context/TransactionContext';
import { Plus, X, Pencil } from 'lucide-react';

interface Props {
  onClose: () => void;
  transactionToEdit?: Transaction;
}

const TransactionForm: React.FC<Props> = ({ onClose, transactionToEdit }) => {
  const context = useContext(TransactionContext);
  const [type, setType] = useState<'owed' | 'owe'>(transactionToEdit?.type || 'owed');
  const [amount, setAmount] = useState<string>(transactionToEdit?.amount.toString() || '');
  const [person, setPerson] = useState<string>(transactionToEdit?.person || '');
  const [description, setDescription] = useState<string>(transactionToEdit?.description || '');

  if (!context) return null;
  const { addTransaction, updateTransaction } = context;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !person) return;

    const transactionData = {
      type,
      amount: Number(amount),
      person,
      description
    };

    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-[100] animate-[fadeIn_0.3s_ease]">
      <div className="w-full max-w-[600px] mx-auto rounded-b-none p-6 glass animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <button className="bg-white/10 border-none text-slate-100 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2 bg-black/20 p-1 rounded-xl mb-2">
            <button
              type="button"
              className={`flex-1 p-2.5 border-none rounded-lg font-medium cursor-pointer transition-colors ${type === 'owed' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-transparent text-slate-400'}`}
              onClick={() => setType('owed')}
            >
              Owed to me
            </button>
            <button
              type="button"
              className={`flex-1 p-2.5 border-none rounded-lg font-medium cursor-pointer transition-colors ${type === 'owe' ? 'bg-red-500/15 text-red-500' : 'bg-transparent text-slate-400'}`}
              onClick={() => setType('owe')}
            >
              I Owe
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-black/20 border border-white/10 text-slate-100 p-3 px-4 rounded-xl font-sans text-base outline-none transition-colors focus:border-brand"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">Person Name</label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="E.g. John Doe"
              className="bg-black/20 border border-white/10 text-slate-100 p-3 px-4 rounded-xl font-sans text-base outline-none transition-colors focus:border-brand"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-slate-400">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="bg-black/20 border border-white/10 text-slate-100 p-3 px-4 rounded-xl font-sans text-base outline-none transition-colors focus:border-brand"
            />
          </div>

          <button type="submit" className="mt-4 w-full inline-flex items-center justify-center gap-2 font-semibold border-none rounded-xl cursor-pointer transition-colors bg-brand text-white p-3.5 hover:bg-brand-hover">
            {transactionToEdit ? <Pencil size={18} /> : <Plus size={18} />}
            {transactionToEdit ? 'Update Record' : 'Add Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
