/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { TransactionTable } from './components/TransactionTable';
import { Transaction, ExtractionStatus } from './types';
import { extractTransactionsFromFiles } from './lib/gemini';
import { Shield, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [processedCount, setProcessedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const readFileAsBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ data: reader.result as string, mimeType: file.type });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleExtraction = async () => {
    if (files.length === 0) return;

    setStatus('processing');
    setError(null);
    setProcessedCount(0);
    const allTransactions: Transaction[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileData = await readFileAsBase64(file);
        const result = await extractTransactionsFromFiles([fileData]);
        allTransactions.push(...result.transactions);
        setProcessedCount(i + 1);
      }
      
      setTransactions(allTransactions);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred during extraction.");
      setStatus('error');
    }
  };

  const reset = () => {
    setFiles([]);
    setTransactions([]);
    setStatus('idle');
    setProcessedCount(0);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Navigation / Header */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">StatementSense</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">
              <Shield className="w-3.5 h-3.5" />
              Secure Processing
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {status === 'idle' || (status === 'processing' && processedCount < files.length) || status === 'error' ? (
            <motion.div
              key="active-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className={cn("text-center space-y-3 transition-opacity", status === 'processing' && "opacity-50")}>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 italic serif">
                  Analyze your finances in seconds.
                </h1>
                <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
                  Upload your bank statements (PDF/Image) and let AI extract every detail into a clean, searchable table.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold">Extraction Failed</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {status === 'processing' ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-black/5 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Extraction Progress</h2>
                      <p className="text-sm text-gray-400">Processing batch of {files.length} documents</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-bold tracking-tighter">
                        {Math.round((processedCount / files.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <motion.div 
                      className="h-full bg-black"
                      initial={{ width: 0 }}
                      animate={{ width: `${(processedCount / files.length) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-50">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="text-xl font-bold font-mono">{files.length}</p>
                    </div>
                    <div className="text-center border-x border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                      <p className="text-xl font-bold font-mono text-green-600">{processedCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                      <p className="text-xl font-bold font-mono text-orange-500">{files.length - processedCount}</p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((file, idx) => {
                      const isCompleted = idx < processedCount;
                      const isCurrent = idx === processedCount;
                      return (
                        <div key={file.name + idx} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-colors",
                          isCurrent ? "bg-gray-50 border border-black/5" : "opacity-40"
                        )}>
                          <div className="shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Sparkles className="w-3 h-3" />
                              </div>
                            ) : isCurrent ? (
                              <Loader2 className="w-5 h-5 text-black animate-spin" />
                            ) : (
                              <div className="w-5 h-5 bg-gray-100 rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 animate-pulse">
                              Extracting...
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <FileUploader
                  files={files}
                  setFiles={setFiles}
                  onUpload={handleExtraction}
                  isProcessing={status === 'processing'}
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TransactionTable
                transactions={transactions}
                onReset={reset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-12 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">
            © 2026 StatementSense OCR. Powered by Google Gemini 2.0.
          </div>
          <div className="flex gap-8 text-xs font-semibold text-gray-400 uppercase tracking-widest">
            <span>Confidential</span>
            <span>Local Processing</span>
            <span>No Data Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
