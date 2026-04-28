import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Download, LayoutDashboard, List, Search, ArrowUpRight, ArrowDownLeft, ReceiptText, PieChart } from 'lucide-react';
import Papa from 'papaparse';

interface TransactionTableProps {
  transactions: Transaction[];
  onReset: () => void;
}

type ViewMode = 'table' | 'summary';

export function TransactionTable({ transactions, onReset }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('summary');

  const filtered = useMemo(() => transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ), [transactions, searchTerm]);

  const stats = useMemo(() => {
    const expenses = transactions.reduce((acc, t) => t.amount < 0 ? acc + t.amount : acc, 0);
    const income = transactions.reduce((acc, t) => t.amount > 0 ? acc + t.amount : acc, 0);
    const categories = transactions.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const sortedCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .map(([name, total]) => ({ name, total }));

    return { expenses, income, net: expenses + income, sortedCategories, count: transactions.length };
  }, [transactions]);

  const exportToCSV = () => {
    const csv = Papa.unparse(transactions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `statement_extraction_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight serif italic">Analysis Results</h2>
          <p className="text-gray-500 mt-1">Processed {stats.count} transactions from your statement.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('summary')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'summary' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Summary
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                viewMode === 'table' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>
          
          <div className="h-6 w-[1px] bg-gray-200 hidden md:block mx-1" />
          
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
          >
            Reset
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-black/90 transition-all shadow-lg shadow-black/5"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'summary' ? (
          <motion.div
            key="summary-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Primary Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Spending</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-red-600 font-mono">
                    {formatCurrency(stats.expenses)}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/20 rounded-bl-full -mr-16 -mt-16 group-hover:bg-red-50/40 transition-colors" />
              </div>

              <div className="group relative overflow-hidden p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Income</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight text-green-600 font-mono">
                    {formatCurrency(stats.income)}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/20 rounded-bl-full -mr-16 -mt-16 group-hover:bg-green-50/40 transition-colors" />
              </div>

              <div className="group relative overflow-hidden p-6 bg-black rounded-3xl shadow-xl shadow-black/10">
                <div className="relative z-10 space-y-4 text-white">
                  <div className="flex items-center justify-between text-white/60">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Net & Volume</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold tracking-tight font-mono">
                      {formatCurrency(stats.net)}
                    </p>
                    <div className="text-right">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Records</p>
                      <p className="text-xl font-bold font-mono">{stats.count}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
              {/* Category Breakdown */}
              <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PieChart className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-lg">Spending by Category</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium tracking-wider uppercase">Values in {stats.expenses < 0 ? 'Absolute' : 'Total'}</span>
                </div>
                
                <div className="space-y-5">
                  {stats.sortedCategories.map((cat, idx) => {
                    const percentage = Math.round((cat.total / Math.abs(stats.expenses || stats.income)) * 100);
                    return (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700 capitalize">{cat.name}</span>
                          <span className="font-mono text-gray-900">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                            className="h-full bg-black rounded-full opacity-80"
                          />
                        </div>
                        <div className="flex justify-end">
                          <span className="text-[10px] font-bold text-gray-400">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {stats.sortedCategories.length === 0 && (
                    <p className="text-center py-10 text-gray-400 italic">No category data available.</p>
                  )}
                </div>
              </div>

              {/* Transactions Highlight */}
              <div className="bg-white border border-gray-100 rounded-3xl p-8 space-y-6 shadow-sm">
                <h3 className="font-semibold text-lg">Largest Expenses</h3>
                <div className="space-y-4">
                  {transactions
                    .filter(t => t.amount < 0)
                    .sort((a, b) => a.amount - b.amount)
                    .slice(0, 5)
                    .map((t, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center font-bold text-red-600 text-xs shadow-inner">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate uppercase tracking-tight">{t.description}</p>
                          <p className="text-[10px] text-gray-400 font-mono tracking-widest">{t.date}</p>
                        </div>
                        <p className="font-mono font-bold text-red-500 text-sm whitespace-nowrap">
                          {formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  {transactions.filter(t => t.amount < 0).length === 0 && (
                    <p className="text-center py-10 text-gray-400 italic">No expenses detected.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search descriptions, categories, dates..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/50 border-y border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-widest text-[10px]">Description</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-widest text-[10px]">Category</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-widest text-[10px] text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-widest text-[10px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((t, i) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.01 }}
                      key={`${t.date}-${t.description}-${i}`}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-600 tabular-nums">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="max-w-xs truncate" title={t.description}>
                          {t.description}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {t.category}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-right font-mono font-semibold",
                        t.amount < 0 ? "text-red-500" : "text-green-500"
                      )}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs italic">
                        {t.notes || "—"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-20 text-center text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-4 opacity-10" />
                No transactions match your search filter.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
