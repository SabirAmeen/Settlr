import React, { useState, useContext } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import LockScreen from './components/LockScreen';
import { AuthContext } from './context/AuthContext';
import { Plus } from 'lucide-react';
import './index.css';

const App: React.FC = () => {
  const context = useContext(AuthContext);
  const [showForm, setShowForm] = useState<boolean>(false);

  if (!context || !context.isAuthenticated) {
    return <LockScreen />;
  }

  return (
    <div className="max-w-[600px] mx-auto p-5 min-h-screen flex flex-col relative">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand to-accent rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_4px_12px_rgba(139,92,246,0.3)]">S</div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlr</h1>
        </div>
      </header>

      <main className="flex-1">
        <Dashboard />
        <TransactionList />
      </main>

      <button 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full border-none flex items-center justify-center text-white bg-brand shadow-[0_4px_16px_rgba(139,92,246,0.4)] cursor-pointer z-10 transition-all hover:scale-105 hover:shadow-[0_6px_20px_rgba(139,92,246,0.6)]" 
        onClick={() => setShowForm(true)}
      >
        <Plus size={24} />
      </button>

      {showForm && <TransactionForm onClose={() => setShowForm(false)} />}
    </div>
  );
};

export default App;
