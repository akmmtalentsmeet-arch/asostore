import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, User, Package, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Purchase, Student, StockItem } from '../types';
import toast from 'react-hot-toast';

export function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    item_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesResponse, studentsResponse, stockResponse] = await Promise.all([
        supabase
          .from('purchases')
          .select(`
            *,
            students(name, admission_no),
            stock_items(item_name)
          `)
          .order('timestamp', { ascending: false }),
        supabase.from('students').select('*').order('name'),
        supabase.from('stock_items').select('*').order('item_name')
      ]);

      if (purchasesResponse.error) throw purchasesResponse.error;
      if (studentsResponse.error) throw studentsResponse.error;
      if (stockResponse.error) throw stockResponse.error;

      setPurchases(purchasesResponse.data?.map(purchase => ({
        ...purchase,
        student: {
          name: purchase.students?.name || 'Unknown',
          admission_no: purchase.students?.admission_no || 'Unknown'
        },
        stock_item: {
          item_name: purchase.stock_items?.item_name || 'Unknown'
        }
      })) || []);

      setStudents(studentsResponse.data || []);
      setStockItems(stockResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.item_id || !formData.quantity) {
      toast.error('Please fill in all fields');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const stockItem = stockItems.find(item => item.id === formData.item_id);
      const student = students.find(s => s.id === formData.student_id);

      if (!stockItem || !student) {
        toast.error('Invalid item or student selected');
        return;
      }

      if (stockItem.quantity < quantity) {
        toast.error('Insufficient stock quantity');
        return;
      }

      const totalPrice = stockItem.selling_price * quantity;

      if (student.balance < totalPrice) {
        toast.error('Insufficient student balance');
        return;
      }

      // Add purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          student_id: formData.student_id,
          item_id: formData.item_id,
          quantity,
          total_price: totalPrice,
        }]);

      if (purchaseError) throw purchaseError;

      // Update stock quantity
      const { error: stockError } = await supabase
        .from('stock_items')
        .update({ 
          quantity: stockItem.quantity - quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', formData.item_id);

      if (stockError) throw stockError;

      // Update student balance and total spent
      const { error: studentError } = await supabase
        .from('students')
        .update({ 
          balance: student.balance - totalPrice,
          total_spent: student.total_spent + totalPrice
        })
        .eq('id', formData.student_id);

      if (studentError) throw studentError;

      // Add transaction record for the purchase
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          student_id: formData.student_id,
          amount: totalPrice,
          type: 'spend',
          method: 'credit',
          note: `Purchase: ${stockItem.item_name} (${quantity} items)`,
        }]);

      if (transactionError) throw transactionError;

      toast.success('Purchase completed successfully');
      setFormData({ student_id: '', item_id: '', quantity: '' });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    }
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.student?.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.stock_item?.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Purchases</h1>
          <p className="text-gray-600">Record and track student purchases from stock</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Purchase
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record New Purchase</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({formatCurrency(student.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item
              </label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Item</option>
                {stockItems.filter(item => item.quantity > 0).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} ({item.quantity} left, {formatCurrency(item.selling_price)} each)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1"
                required
              />
            </div>
            <div className="md:col-span-3 flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Record Purchase
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ student_id: '', item_id: '', quantity: '' });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by student name, admission number, or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.student?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.student?.admission_no || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.stock_item?.item_name || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(purchase.total_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(purchase.timestamp)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No purchases found
          </div>
        )}
      </div>
    </div>
  );
}