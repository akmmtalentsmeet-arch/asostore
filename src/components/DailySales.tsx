import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, Calendar, Package, DollarSign, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DailySale, StockItem } from '../types';
import toast from 'react-hot-toast';

export function DailySales() {
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    item_id: '',
    quantity_sold: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesResponse, stockResponse] = await Promise.all([
        supabase
          .from('daily_sales')
          .select(`
            *,
            stock_items(item_name, quantity)
          `)
          .order('sale_date', { ascending: false }),
        supabase.from('stock_items').select('*').order('item_name')
      ]);

      if (salesResponse.error) throw salesResponse.error;
      if (stockResponse.error) throw stockResponse.error;

      setDailySales(salesResponse.data?.map(sale => ({
        ...sale,
        stock_item: {
          item_name: sale.stock_items?.item_name || 'Unknown',
          quantity: sale.stock_items?.quantity || 0
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
    
    if (!formData.item_id || !formData.quantity_sold) {
      toast.error('Please fill in all required fields');
      return;
    }

    const quantitySold = parseInt(formData.quantity_sold);
    if (isNaN(quantitySold) || quantitySold <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const selectedItem = stockItems.find(item => item.id === formData.item_id);
    if (!selectedItem) {
      toast.error('Selected item not found');
      return;
    }

    if (selectedItem.quantity < quantitySold) {
      toast.error(`Insufficient stock. Available: ${selectedItem.quantity}`);
      return;
    }

    try {
      // Calculate values
      const sellingPricePerUnit = selectedItem.selling_price;
      const costPricePerUnit = selectedItem.cost_price;
      const totalRevenue = quantitySold * sellingPricePerUnit;
      const totalCost = quantitySold * costPricePerUnit;
      const profit = totalRevenue - totalCost;

      // Add daily sale record
      const { error: saleError } = await supabase
        .from('daily_sales')
        .insert([{
          item_id: formData.item_id,
          quantity_sold: quantitySold,
          selling_price_per_unit: sellingPricePerUnit,
          total_revenue: totalRevenue,
          cost_price_per_unit: costPricePerUnit,
          total_cost: totalCost,
          profit: profit,
          sale_date: formData.sale_date,
          notes: formData.notes || null,
        }]);

      if (saleError) throw saleError;

      // Update stock quantity
      const newQuantity = selectedItem.quantity - quantitySold;
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
        quantity_sold: '',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Error recording daily sale:', error);
      toast.error('Failed to record daily sale');
    }
  };

  const filteredSales = dailySales.filter(sale => {
    const matchesSearch = sale.stock_item?.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = selectedDate === '' || sale.sale_date === selectedDate;
    return matchesSearch && matchesDate;
  });

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

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = dailySales.filter(sale => sale.sale_date === today);
    
    return {
      totalItems: todaySales.reduce((sum, sale) => sum + sale.quantity_sold, 0),
      totalRevenue: todaySales.reduce((sum, sale) => sum + sale.total_revenue, 0),
      totalProfit: todaySales.reduce((sum, sale) => sum + sale.profit, 0),
    };
  };

  const todayStats = getTodayStats();

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
          <p className="text-gray-600">Track daily sales and inventory movement</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Sale
        </button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Items Sold Today</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayStats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profit Today</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayStats.totalProfit)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Daily Sale</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item *
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
                    {item.item_name} (Stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity Sold *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity_sold}
                onChange={(e) => setFormData({ ...formData, quantity_sold: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Date *
              </label>
              <input
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4 flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Record Sale
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    item_id: '',
                    quantity_sold: '',
                    sale_date: new Date().toISOString().split('T')[0],
                    notes: '',
                  });
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
            {formData.item_id && formData.quantity_sold && (
              <div className="md:col-span-2 lg:col-span-4 bg-blue-50 p-4 rounded-md">
                {(() => {
                  const selectedItem = stockItems.find(item => item.id === formData.item_id);
                  const quantity = parseInt(formData.quantity_sold || '0');
                  if (selectedItem && quantity > 0) {
                    const revenue = quantity * selectedItem.selling_price;
                    const cost = quantity * selectedItem.cost_price;
                    const profit = revenue - cost;
                    return (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <p className="text-blue-800">
                          <strong>Revenue: {formatCurrency(revenue)}</strong>
                        </p>
                        <p className="text-red-800">
                          <strong>Cost: {formatCurrency(cost)}</strong>
                        </p>
                        <p className="text-green-800">
                          <strong>Profit: {formatCurrency(profit)}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
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
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <Package className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {sale.stock_item?.item_name || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {sale.quantity_sold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(sale.selling_price_per_unit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(sale.total_revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatCurrency(sale.total_cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                    {formatCurrency(sale.profit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(sale.sale_date)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sales found for the selected criteria
          </div>
        )}
      </div>
    </div>
  );
}