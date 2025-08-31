"use client";

import { useState } from "react";
import { cn, formatCurrency, calculatePnL } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { X, Calendar, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  date: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  qty: number;
  entryPrice: number;
  exitPrice: number;
  fees: number;
  risk?: number;
  strategy?: string;
  notes?: string;
  tags?: string;
  imageUrl?: string;
}

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trade: Trade) => Promise<void>;
  editTrade?: Trade & { id: string };
}

export default function AddTradeModal({
  isOpen,
  onClose,
  onSubmit,
  editTrade,
}: AddTradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<Trade>(() => {
    if (editTrade) {
      return {
        date: new Date(editTrade.date).toISOString().slice(0, 16),
        symbol: editTrade.symbol,
        side: editTrade.side,
        qty: editTrade.qty,
        entryPrice: editTrade.entryPrice,
        exitPrice: editTrade.exitPrice,
        fees: editTrade.fees,
        risk: editTrade.risk || undefined,
        strategy: editTrade.strategy || '',
        notes: editTrade.notes || '',
        tags: editTrade.tags || '',
        imageUrl: editTrade.imageUrl || '',
      };
    }
    
    return {
      date: new Date().toISOString().slice(0, 16),
      symbol: '',
      side: 'LONG',
      qty: 0,
      entryPrice: 0,
      exitPrice: 0,
      fees: 0,
      strategy: '',
      notes: '',
      tags: '',
      imageUrl: '',
    };
  });

  // Calculate PnL in real-time
  const pnl = formData.entryPrice && formData.exitPrice && formData.qty
    ? calculatePnL(formData.entryPrice, formData.exitPrice, formData.qty, formData.side, formData.fees)
    : 0;

  // Calculate R Multiple if risk is provided
  const rMultiple = formData.risk && formData.risk > 0 && pnl !== 0
    ? pnl / formData.risk
    : null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required';
    if (formData.qty <= 0) newErrors.qty = 'Quantity must be greater than 0';
    if (formData.entryPrice <= 0) newErrors.entryPrice = 'Entry price must be greater than 0';
    if (formData.exitPrice <= 0) newErrors.exitPrice = 'Exit price must be greater than 0';
    if (formData.fees < 0) newErrors.fees = 'Fees cannot be negative';
    if (formData.risk && formData.risk <= 0) newErrors.risk = 'Risk must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        symbol: '',
        side: 'LONG',
        qty: 0,
        entryPrice: 0,
        exitPrice: 0,
        fees: 0,
        strategy: '',
        notes: '',
        tags: '',
        imageUrl: '',
      });
    } catch (error) {
      console.error('Error submitting trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof Trade, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-neutral-900">
            {editTrade ? t.editTrade : t.addNewTrade}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Date & Time *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className={cn(
                      "input pl-10",
                      errors.date && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.date && <p className="text-sm text-red-600 mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  placeholder="e.g., BTCUSDT"
                  value={formData.symbol}
                  onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
                  className={cn(
                    "input",
                    errors.symbol && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {errors.symbol && <p className="text-sm text-red-600 mt-1">{errors.symbol}</p>}
              </div>
            </div>

            {/* Trade Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Side *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('side', 'LONG')}
                    className={cn(
                      "flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors duration-200",
                      formData.side === 'LONG'
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "border-border text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">LONG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('side', 'SHORT')}
                    className={cn(
                      "flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border transition-colors duration-200",
                      formData.side === 'SHORT'
                        ? "bg-red-50 border-red-500 text-red-700"
                        : "border-border text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">SHORT</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={formData.qty || ''}
                  onChange={(e) => updateField('qty', parseFloat(e.target.value) || 0)}
                  className={cn(
                    "input",
                    errors.qty && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {errors.qty && <p className="text-sm text-red-600 mt-1">{errors.qty}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Risk per Trade
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.risk || ''}
                    onChange={(e) => updateField('risk', parseFloat(e.target.value) || undefined)}
                    className={cn(
                      "input pl-10",
                      errors.risk && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.risk && <p className="text-sm text-red-600 mt-1">{errors.risk}</p>}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Entry Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.entryPrice || ''}
                    onChange={(e) => updateField('entryPrice', parseFloat(e.target.value) || 0)}
                    className={cn(
                      "input pl-10",
                      errors.entryPrice && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.entryPrice && <p className="text-sm text-red-600 mt-1">{errors.entryPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Exit Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.exitPrice || ''}
                    onChange={(e) => updateField('exitPrice', parseFloat(e.target.value) || 0)}
                    className={cn(
                      "input pl-10",
                      errors.exitPrice && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.exitPrice && <p className="text-sm text-red-600 mt-1">{errors.exitPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fees
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={formData.fees || ''}
                    onChange={(e) => updateField('fees', parseFloat(e.target.value) || 0)}
                    className={cn(
                      "input pl-10",
                      errors.fees && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                </div>
                {errors.fees && <p className="text-sm text-red-600 mt-1">{errors.fees}</p>}
              </div>
            </div>

            {/* PnL Preview */}
            {(formData.entryPrice && formData.exitPrice && formData.qty) && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">Preview:</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className={cn(
                        "text-lg font-bold",
                        pnl >= 0 ? "text-pnl-positive" : "text-pnl-negative"
                      )}>
                        {formatCurrency(pnl, 'USD', true)}
                      </div>
                      <div className="text-xs text-neutral-500">P&L</div>
                    </div>
                    {rMultiple !== null && (
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          rMultiple >= 0 ? "text-pnl-positive" : "text-pnl-negative"
                        )}>
                          {rMultiple.toFixed(2)}R
                        </div>
                        <div className="text-xs text-neutral-500">R Multiple</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Strategy
                </label>
                <input
                  type="text"
                  placeholder="e.g., Breakout, Scalping"
                  value={formData.strategy || ''}
                  onChange={(e) => updateField('strategy', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g., morning, news, volatility"
                  value={formData.tags || ''}
                  onChange={(e) => updateField('tags', e.target.value)}
                  className="input"
                />
                <p className="text-xs text-neutral-500 mt-1">Separate multiple tags with commas</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/screenshot.png"
                value={formData.imageUrl || ''}
                onChange={(e) => updateField('imageUrl', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes
              </label>
              <textarea
                rows={4}
                placeholder="Trade analysis, market conditions, lessons learned..."
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="input resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : editTrade ? 'Update Trade' : 'Add Trade'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
