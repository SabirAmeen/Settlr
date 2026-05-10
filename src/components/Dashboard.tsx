import React, { useContext } from 'react';
import { TransactionContext, TransactionContextType } from '../context/TransactionContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const Dashboard: React.FC = () => {
  const context = useContext(TransactionContext);
  
  if (!context) return null;
  const { totalIOwe, totalOwedToMe, netBalance } = context;

  const isPositive = netBalance >= 0;

  return (
    <div className="p-6 mb-6 flex flex-col gap-5 glass">
      <div>
        <h3 className="text-sm text-slate-400 font-medium uppercase tracking-widest">Net Balance</h3>
        <div className={`text-4xl font-bold flex items-baseline gap-2 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {formatINR(Math.abs(netBalance))}
          <span className="text-sm font-normal text-slate-400">{isPositive ? ' (You are owed)' : ' (You owe)'}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Owed to you</p>
            <h4 className="text-lg font-semibold">{formatINR(totalOwedToMe)}</h4>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 text-red-500">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400">You owe</p>
            <h4 className="text-lg font-semibold">{formatINR(totalIOwe)}</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
