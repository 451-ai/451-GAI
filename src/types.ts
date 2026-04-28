export interface Transaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  category: string;
  notes: string;
}

export interface ExtractionResponse {
  transactions: Transaction[];
}

export type ExtractionStatus = 'idle' | 'processing' | 'success' | 'error';
