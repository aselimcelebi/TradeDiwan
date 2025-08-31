"use client";

import { useState } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculatePnL, formatCurrency, formatDateTime } from "@/lib/utils";
import { X, Edit, Trash2, Plus, TrendingUp, TrendingDown, Save, FileText } from "lucide-react";
import AddTradeModal from "./add-trade-modal";

interface DayData {
  date: Date;
  trades: Trade[];
  journalEntry?: JournalEntry;
  totalPnL: number;
  tradeCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface DailyDetailModalProps {
  day: DayData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DailyDetailModal({ day, isOpen, onClose, onUpdate }: DailyDetailModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'trades' | 'journal'>('trades');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showAddTrade, setShowAddTrade] = useState(false);
  const [journalData, setJournalData] = useState({
    whatWentWell: day.journalEntry?.whatWentWell || '',
    toImprove: day.journalEntry?.toImprove || '',
    mood: day.journalEntry?.mood || 3,
    notes: day.journalEntry?.notes || '',
    tags: day.journalEntry?.tags || '',
  });
  const [savingJournal, setSavingJournal] = useState(false);

  if (!isOpen) return null;

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/trades?id=${tradeId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const handleEditTrade = async (tradeData: any) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tradeData, id: editingTrade?.id }),
      });
      
      if (response.ok) {
        setEditingTrade(null);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  const handleAddTrade = async (tradeData: any) => {
    try {
      // Set the date to the selected day
      const dayDate = new Date(day.date);
      dayDate.setHours(12, 0, 0, 0); // Set to noon
      
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...tradeData, 
          date: dayDate.toISOString() 
        }),
      });
      
      if (response.ok) {
        setShowAddTrade(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error adding trade:', error);
    }
  };

  const handleSaveJournal = async () => {
    setSavingJournal(true);
    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...journalData,
          date: day.date.toISOString(),
        }),
      });
      
      if (response.ok) {
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error saving journal:', error);
    } finally {
      setSavingJournal(false);
    }
  };

  const moodEmojis = ['😞', '😕', '😐', '😊', '😄'];
  const moodLabels = ['Very Bad', 'Bad', 'Neutral', 'Good', 'Excellent'];
  const moodLabelsTR = ['Çok Kötü', 'Kötü', 'Nötr', 'İyi', 'Mükemmel'];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">
                {day.date.toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`text-sm font-medium ${
                  day.totalPnL >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                }`}>
                  {formatCurrency(day.totalPnL, 'USD', true)}
                </span>
                <span className="text-sm text-neutral-500">
                  {day.tradeCount} işlem
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('trades')}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'trades'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              İşlemler ({day.tradeCount})
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`px-6 py-3 text-sm font-medium transition-colors duration-200 flex items-center space-x-2 ${
                activeTab === 'journal'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Günlük</span>
              {day.journalEntry && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'trades' ? (
              <div className="p-6">
                {/* Add Trade Button */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">İşlemler</h3>
                  <button
                    onClick={() => setShowAddTrade(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span>İşlem Ekle</span>
                  </button>
                </div>

                {/* Trades List */}
                {day.trades.length > 0 ? (
                  <div className="space-y-3">
                    {day.trades.map(trade => {
                      const pnl = calculatePnL(trade.entryPrice, trade.exitPrice, trade.qty, trade.side as 'LONG' | 'SHORT', trade.fees);
                      return (
                        <div key={trade.id} className="bg-neutral-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                trade.side === 'LONG' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {trade.side === 'LONG' ? (
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                              
                              <div>
                                <div className="font-medium text-neutral-900">
                                  {trade.symbol} - {trade.side}
                                </div>
                                <div className="text-sm text-neutral-500">
                                  {trade.qty} @ {formatCurrency(trade.entryPrice)} → {formatCurrency(trade.exitPrice)}
                                </div>
                                <div className="text-xs text-neutral-400">
                                  {formatDateTime(trade.date)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className={`font-semibold ${
                                  pnl >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                                }`}>
                                  {formatCurrency(pnl, 'USD', true)}
                                </div>
                                {trade.strategy && (
                                  <div className="text-xs text-neutral-500">{trade.strategy}</div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => setEditingTrade(trade)}
                                  className="p-2 hover:bg-neutral-200 rounded-lg transition-colors duration-200"
                                >
                                  <Edit className="h-4 w-4 text-neutral-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTrade(trade.id)}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {trade.notes && (
                            <div className="mt-3 text-sm text-neutral-600 bg-white p-3 rounded-md">
                              {trade.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-neutral-500">
                    <div className="text-neutral-300 mb-2">📊</div>
                    Bu gün için henüz işlem bulunmuyor
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-neutral-900">Günlük Değerlendirme</h3>
                  <button
                    onClick={handleSaveJournal}
                    disabled={savingJournal}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingJournal ? 'Kaydediliyor...' : 'Kaydet'}</span>
                  </button>
                </div>

                {/* Mood Selector */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Günün Genel Havası
                  </label>
                  <div className="flex items-center space-x-2">
                    {moodEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => setJournalData(prev => ({ ...prev, mood: index + 1 }))}
                        className={`w-12 h-12 rounded-lg border-2 transition-colors duration-200 ${
                          journalData.mood === index + 1
                            ? 'border-primary bg-primary/10'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="text-xl">{emoji}</div>
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-neutral-500 mt-1">
                    {journalData.mood && (moodLabelsTR[journalData.mood - 1])}
                  </div>
                </div>

                {/* What Went Well */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    İyi Giden Şeyler
                  </label>
                  <textarea
                    value={journalData.whatWentWell}
                    onChange={(e) => setJournalData(prev => ({ ...prev, whatWentWell: e.target.value }))}
                    className="input resize-none"
                    rows={3}
                    placeholder="Bugün trading'de iyi giden şeyler..."
                  />
                </div>

                {/* To Improve */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Geliştirilecek Alanlar
                  </label>
                  <textarea
                    value={journalData.toImprove}
                    onChange={(e) => setJournalData(prev => ({ ...prev, toImprove: e.target.value }))}
                    className="input resize-none"
                    rows={3}
                    placeholder="Gelecek sefer dikkat edilecek noktalar..."
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Genel Notlar
                  </label>
                  <textarea
                    value={journalData.notes}
                    onChange={(e) => setJournalData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input resize-none"
                    rows={4}
                    placeholder="Piyasa koşulları, duygusal durum, önemli olaylar..."
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Etiketler
                  </label>
                  <input
                    type="text"
                    value={journalData.tags}
                    onChange={(e) => setJournalData(prev => ({ ...prev, tags: e.target.value }))}
                    className="input"
                    placeholder="odakli, sabırlı, duygusal, acele (virgülle ayırın)"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Trade Modals */}
      {showAddTrade && (
        <AddTradeModal
          isOpen={true}
          onClose={() => setShowAddTrade(false)}
          onSubmit={handleAddTrade}
        />
      )}

      {editingTrade && (
        <AddTradeModal
          isOpen={true}
          onClose={() => setEditingTrade(null)}
          onSubmit={handleEditTrade}
          editTrade={editingTrade}
        />
      )}
    </>
  );
}
