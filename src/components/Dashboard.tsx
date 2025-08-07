import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  Clock,
  Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DashboardStats, Transaction } from '../types';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalBalance: 0,
    totalDeposits: 0,
    totalSpends: 0,
    netProfit: 0,
    totalStockValue: 0,
    totalPurchaseCost: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch students count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch total balance across all students
      const { data: balanceData } = await supabase
        .from('students')
        .select('balance');

      const totalStudentBalance = balanceData
        ?.reduce((sum, student) => sum + (student.balance || 0), 0) || 0;

      // Fetch transactions for deposits and expenses
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type');

      const totalDeposits = transactions
        ?.filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const totalSpends = transactions
        ?.filter(t => t.type === 'spend')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      // Fetch stock items for total value
      const { data: stockItems } = await supabase
        .from('stock_items')
        .select('quantity, selling_price');

      const totalStockValue = stockItems
        ?.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0) || 0;

      // Fetch stock purchases for total purchase cost
      const { data: stockPurchases } = await supabase
        .from('stock_purchases')
        .select('total_cost');

      const totalPurchaseCost = stockPurchases
        ?.reduce((sum, purchase) => sum + purchase.total_cost, 0) || 0;

      // Calculate net profit from student purchases
      const { data: studentPurchases } = await supabase
        .from('purchases')
        .select(`
          quantity,
          total_price,
          stock_items(cost_price, selling_price)
        `);

      let netProfit = 0;
      studentPurchases?.forEach(purchase => {
        if (purchase.stock_items) {
          const profit = (purchase.stock_items.selling_price - purchase.stock_items.cost_price) * purchase.quantity;
          netProfit += profit;
        }
      });

      // Fetch recent transactions
      const { data: recentTxns } = await supabase
        .from('transactions')
        .select(`
          *,
          students(name, admission_no)
        `)
        .order('timestamp', { ascending: false })
        .limit(5);

      setStats({
        totalStudents: studentCount || 0,
        totalBalance: totalStudentBalance,
        totalDeposits,
        totalSpends: totalSpends,
        netProfit,
        totalStockValue,
        totalPurchaseCost,
      });

      setRecentTransactions(recentTxns?.map(txn => ({
        ...txn,
        student: {
          name: txn.students?.name || 'Unknown',
          admission_no: txn.students?.admission_no || 'Unknown'
        }
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'online': return 'bg-blue-100 text-blue-800';
      case 'bycash': return 'bg-green-100 text-green-800';
      case 'credit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of ASOSTORE wallet system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wallet className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDeposits)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spends</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpends)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.netProfit)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalStockValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Purchase Cost</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPurchaseCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          </div>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent transactions</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'deposit' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.student?.name || 'Unknown Student'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {transaction.student?.admission_no || 'Unknown'} • {formatDate(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${getTransactionTypeColor(transaction.type)}`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodBadgeColor(transaction.method)}`}>
                      {transaction.method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}