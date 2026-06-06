import React, { useContext } from 'react';
import { TransactionContext } from '../context/TransactionContext';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, TrendingDown, Cloud, CloudOff, Loader2 } from 'lucide-react';

const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

const Dashboard: React.FC = () => {
  const txContext = useContext(TransactionContext);
  const authContext = useContext(AuthContext);

  if (!txContext || !authContext) return null;

  const { totalIOwe, totalOwedToMe, netBalance, isSyncing } = txContext;
  const { isSyncEnabled, isSyncLoading, googleUser, enableCloudSync, disableCloudSync } = authContext;

  const isPositive = netBalance >= 0;

  return (
    <div className="p-6 mb-6 flex flex-col gap-5 glass rounded-2xl">
      {/* Net Balance */}
      <div>
        <h3 className="text-sm text-slate-400 font-medium uppercase tracking-widest">Net Balance</h3>
        <div className={`text-4xl font-bold flex items-baseline gap-2 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {formatINR(Math.abs(netBalance))}
          <span className="text-sm font-normal text-slate-400">{isPositive ? ' (You are owed)' : ' (You owe)'}</span>
        </div>
      </div>

      {/* Breakdown */}
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

      {/* Cloud Sync Section */}
      <div className="border-t border-white/10 pt-4">
        {isSyncEnabled && googleUser ? (
          /* ── Synced State ── */
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {isSyncing ? (
                <Loader2 size={14} className="text-brand animate-spin shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
              <div className="flex items-center gap-1.5 min-w-0">
                <Cloud size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400 truncate">
                  Synced as <span className="text-slate-200 font-medium">{googleUser.email}</span>
                </span>
              </div>
            </div>
            <button
              id="disable-sync-btn"
              onClick={disableCloudSync}
              disabled={isSyncLoading}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer shrink-0 transition-colors disabled:opacity-50"
            >
              {isSyncLoading ? <Loader2 size={12} className="animate-spin" /> : <CloudOff size={12} />}
              Disable
            </button>
          </div>
        ) : (
          /* ── Opt-In CTA ── */
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand/10 text-brand shrink-0 mt-0.5">
                <Cloud size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Sync to Cloud</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Access your ledger from any device. Securely back up your transactions with your Google account.
                </p>
              </div>
            </div>
            <button
              id="enable-sync-btn"
              onClick={enableCloudSync}
              disabled={isSyncLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand/15 hover:bg-brand/25 text-brand text-sm font-semibold rounded-xl transition-all border border-brand/25 hover:border-brand/40 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSyncLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              {isSyncLoading ? 'Connecting…' : 'Enable Cloud Sync with Google'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
