export type EssentialItem = {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  price?: number;
};

export type Debt = {
  id: string;
  userId: string;
  creditor: string;
  initialAmount: number;
  payments: {
    id:string;
    amount: number;
    date: Date;
  }[];
};

export type SavingsContribution = {
  id: string;
  userId: string;
  amount: number;
  date: Date;
};

// Type for AI-extracted items from a receipt
export type ExtractedItem = {
  name: string;
  quantity: number;
  price?: number;
};
