export type Student = {
  id: string;
  name: string;
  admission_no: string;
  class_code: string;
  balance: number;
  total_paid: number;
  total_spent: number;
  last_payment: string | null;
  created_at: string;
};

export type Transaction = {
  id: string;
  student_id: string;
  amount: number;
  type: 'deposit' | 'spend';
  method: 'online' | 'bycash' | 'credit';
  note: string | null;
  timestamp: string;
  student?: {
    name: string;
    admission_no: string;
  };
};

export type StockItem = {
  id: string;
  item_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  last_updated: string;
};

export type Purchase = {
  id: string;
  student_id: string;
  item_id: string;
  quantity: number;
  total_price: number;
  timestamp: string;
  student?: {
    name: string;
    admission_no: string;
  };
  stock_item?: {
    item_name: string;
  };
};

export type DashboardStats = {
  totalStudents: number;
  totalBalance: number;
  totalDeposits: number;
  totalExpenses: number;
  netProfit: number;
  totalStockValue: number;
};