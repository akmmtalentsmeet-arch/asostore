import React, { useState } from 'react';
import { Search, User, Users, ArrowLeft, Wallet, GraduationCap, Building2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';
import toast from 'react-hot-toast';

export function BalanceCheck() {
  const [searchType, setSearchType] = useState<'admission' | 'class'>('admission');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }

    setLoading(true);
    setStudent(null);
    setStudents([]);

    try {
      if (searchType === 'admission') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('admission_no', searchValue.trim())
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('Student not found');
          } else {
            throw error;
          }
        } else {
          setStudent(data);
        }
      } else {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('class_code', searchValue.trim())
          .order('name');

        if (error) throw error;

        if (data.length === 0) {
          toast.error('No students found in this class');
        } else {
          setStudents(data);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const reset = () => {
    setSearchValue('');
    setStudent(null);
    setStudents([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-4 max-w-6xl mx-auto">
        {/* Modern Header */}
        <div className="text-center mb-12 pt-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-2xl">
                <Wallet className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            ASOSTORE
          </h1>
          <p className="text-xl text-gray-600 mb-2">College Prepaid Wallet System</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4" />
            <span>Secure • Fast • Reliable</span>
          </div>
        </div>

        {/* Modern Search Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="text-center mb-6">
            <GraduationCap className="h-8 w-8 text-indigo-600 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Student Balance</h2>
            <p className="text-gray-600">Enter admission number or class code to view balance information</p>
          </div>

          {/* Search Type Selection */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 p-1 rounded-2xl flex space-x-1">
              <label className={`flex items-center px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                searchType === 'admission' 
                  ? 'bg-white shadow-md text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}>
                <input
                  type="radio"
                  value="admission"
                  checked={searchType === 'admission'}
                  onChange={(e) => setSearchType(e.target.value as 'admission' | 'class')}
                  className="sr-only"
                />
                <User className="h-4 w-4 mr-2" />
                Individual Student
              </label>
              <label className={`flex items-center px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                searchType === 'class' 
                  ? 'bg-white shadow-md text-indigo-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}>
                <input
                  type="radio"
                  value="class"
                  checked={searchType === 'class'}
                  onChange={(e) => setSearchType(e.target.value as 'admission' | 'class')}
                  className="sr-only"
                />
                <Users className="h-4 w-4 mr-2" />
                Entire Class
              </label>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === 'admission' 
                    ? 'Enter admission number (e.g., ASO/2024/001)' 
                    : 'Enter class code (e.g., ND1A, HND2B)'
                }
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-lg placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
            >
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {(student || students.length > 0) && (
            <button
              onClick={reset}
              className="mt-6 text-indigo-600 hover:text-indigo-700 flex items-center text-sm mx-auto transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              New Search
            </button>
          )}
        </div>

        {/* Single Student Result */}
        {student && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{student.name}</h2>
              <div className="flex items-center justify-center space-x-4 text-gray-600">
                <span className="bg-gray-100 px-4 py-2 rounded-full">{student.admission_no}</span>
                <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">{student.class_code}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl text-center border border-green-100">
                <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-sm font-medium text-green-800 mb-2">Current Balance</h3>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(student.balance)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl text-center border border-blue-100">
                <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowLeft className="h-6 w-6 text-white transform rotate-90" />
                </div>
                <h3 className="text-sm font-medium text-blue-800 mb-2">Total Paid</h3>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(student.total_paid)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-2xl text-center border border-red-100">
                <div className="bg-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowLeft className="h-6 w-6 text-white transform -rotate-90" />
                </div>
                <h3 className="text-sm font-medium text-red-800 mb-2">Total Spent</h3>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(student.total_spent)}</p>
              </div>
            </div>

            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Last Payment: <span className="font-medium">{formatDate(student.last_payment)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Multiple Students Result */}
        {students.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 hover:shadow-3xl transition-all duration-300">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Students in Class {searchValue}
              </h2>
              <p className="text-gray-600">{students.length} students found</p>
            </div>
            <div className="grid gap-4">
              {students.map((student) => (
                <div key={student.id} className="bg-white/60 backdrop-blur border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.admission_no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(student.balance)}
                      </p>
                      <p className="text-xs text-gray-500">Current Balance</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      Paid: {formatCurrency(student.total_paid)}
                    </span>
                    <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full">
                      Spent: {formatCurrency(student.total_spent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Link */}
        <div className="text-center mt-12">
          <a
            href="/admin"
            className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur text-indigo-600 rounded-2xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl border border-white/20"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Administrator Portal
          </a>
        </div>
      </div>
    </div>
  );
}