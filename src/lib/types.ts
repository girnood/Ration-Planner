export type EssentialItem = {
  id: string;
  name: string;
  quantity: number;
};

export type Debt = {
  id: string;
  creditor: string;
  initialAmount: number;
  payments: {
    id: string;
    amount: number;
    date: Date;
  }[];
};
