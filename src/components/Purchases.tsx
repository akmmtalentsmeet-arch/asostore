import React, { useState, useEffect } from 'react';
import { Plus, Search, Package, TrendingUp, Calendar, User, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StockPurchase, StockItem } from '../types';
import toast from 'react-hot-toast';

export function Purchases() {
  const [stockPurchases, setStockPurchases] = useState<StockPurchase[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesResponse, stockResponse] = await Promise.all([
        supabase
          .from('stock_purchases')
          .select(`
            *,
            stock_items(item_name, selling_price)
          `)
          .order('purchase_date', { ascending: false }),
        supabase.from('stock_items').select('*').order('item_name')
      ]);

      if (purchasesResponse.error) throw purchasesResponse.error;
      if (stockResponse.error) throw stockResponse.error;

      setStockPurchases(purchasesResponse.data?.map(purchase => ({
        ...purchase,
        stock_item: {
          item_name: purchase.stock_items?.item_name || 'Unknown',
          selling_price: purchase.stock_items?.selling_price || 0
        }
      })) || []);

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
    
    if (!formData.item_id || !formData.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    const quantity = parseInt(formData.quantity);

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const selectedItem = stockItems.find(item => item.id === formData.item_id);
    if (!selectedItem) {
      toast.error('Selected item not found');
      return;
    }

    if (selectedItem.quantity < quantity) {
      toast.error(`Insufficient stock. Available: ${selectedItem.quantity}`);
      return;
    }

    try {
      // Calculate values
      const sellingPricePerUnit = selectedItem.selling_price;
      const costPricePerUnit = selectedItem.cost_price;
      const totalRevenue = quantity * sellingPricePerUnit;
      const totalCost = quantity * costPricePerUnit;
      const profit = totalRevenue - totalCost;

      // Add daily sale record
      const { error: saleError } = await supabase
        .from('daily_sales')
        .insert([{
          item_id: formData.item_id,
          quantity_sold: quantity,
          selling_price_per_unit: sellingPricePerUnit,
          total_revenue: totalRevenue,
          cost_price_per_unit: costPricePerUnit,
          total_cost: totalCost,
          profit: profit,
          sale_date: new Date().toISOString().split('T')[0],
          notes: null,
        }]);

      if (saleError) throw saleError;

      // Update stock quantity
      const newQuantity = selectedItem.quantity - quantity;
      const { error: stockError } = await supabase
        .from('stock_items')
        .update({ 
          quantity: newQuantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', formData.item_id);

      if (stockError) throw stockError;

      toast.success('Daily sale recorded successfully');
      setFormData({
        item_id: '',
        quantity: '',
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error recording daily sale:', error);
      toast.error('Failed to record daily sale');
    }
  };

  const filteredPurchases = stockPurchases.filter(purchase =>
    purchase.stock_item?.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
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
    });
  };

  const calculateProfit = (purchase: StockPurchase) => {
    if (!purchase.stock_item) return 0;
    return (purchase.stock_item.selling_price - purchase.cost_per_unit) * purchase.quantity;
  };

  const calculateProfitMargin = (purchase: StockPurchase) => {
    if (!purchase.stock_item || purchase.cost_per_unit === 0) return 0;
    return ((purchase.stock_item.selling_price - purchase.cost_per_unit) / purchase.cost_per_unit) * 100;
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
          <h1 className="text-2xl font-bold text-gray-900">Daily Sales</h1>
          <p className="text-gray-600">Record daily sales to students</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setFormData({
              item_id: '',
              quantity: '',
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Sale
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Stock Purchase</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Item *
              </label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Item</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.item_name} (Current: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
                required
              />
            </div>
            <div className="md:col-span-2 flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Record Sale
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    item_id: '',
                    quantity: '',
                  });
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
            placeholder="Search by item name or supplier..."
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
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
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
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.stock_item?.item_name || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-sm text-gray-900">{purchase.supplier_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(purchase.cost_per_unit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                    {formatCurrency(purchase.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(calculateProfit(purchase))}
                      </div>
                      <div className="text-xs text-gray-500">
                        {calculateProfitMargin(purchase).toFixed(1)}% margin
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(purchase.purchase_date)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPurchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No stock purchases found
          </div>
        )}
      </div>
    </div>
  );
}