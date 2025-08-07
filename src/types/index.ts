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

export type DailySale = {
  id: string;
  item_id: string;
  quantity_sold: number;
  selling_price_per_unit: number;
  total_revenue: number;
  cost_price_per_unit: number;
  total_cost: number;
  profit: number;
  sale_date: string;
  notes: string | null;
  created_at: string;
  stock_item?: {
    item_name: string;
    quantity: number;
  };
};

export type StockPurchase = {
  id: string;
  item_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  supplier_name: string;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  stock_item?: {
    item_name: string;
    selling_price: number;
  };
};

export type DashboardStats = {
  totalStudents: number;
  totalBalance: number;
  totalDeposits: number;
  totalSpends: number;
  netProfit: number;
  totalStockValue: number;
  totalPurchaseCost: number;
};