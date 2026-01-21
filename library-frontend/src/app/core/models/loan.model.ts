export interface Loan {
  loanId: number;
  userId: number;

  bookId: number;
  bookTitle: string;
  bookAuthor: string;

  reservationId?: number | null;

  loanedAt: string;  
  dueDate?: string | null;
  returnedAt?: string | null;

  status: 'ACTIVE' | 'RETURNED' | string;
}
