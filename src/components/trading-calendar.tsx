"use client";

import { useState, useMemo } from "react";
import { Trade, JournalEntry } from "@prisma/client";
import { useLanguage } from "@/contexts/language-context";
import { calculatePnL, formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import DailyDetailModal from "./daily-detail-modal";

interface TradingCalendarProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
  onTradeUpdate?: () => void;
}

interface DayData {
  date: Date;
  trades: Trade[];
  journalEntry?: JournalEntry;
  totalPnL: number;
  tradeCount: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const monthsTR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysOfWeekTR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default function TradingCalendar({ trades, journalEntries, onTradeUpdate }: TradingCalendarProps) {
  const { language, t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on Saturday of the week containing last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: DayData[] = [];
    const currentDateLoop = new Date(startDate);
    
    // Get today's date in local timezone
    const today = new Date();
    const todayLocal = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
    todayLocal.setHours(0, 0, 0, 0);
    
    while (currentDateLoop <= endDate) {
      const dayString = currentDateLoop.toISOString().split('T')[0];
      
      // Filter trades for this day
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate.toISOString().split('T')[0] === dayString;
      });
      
      // Find journal entry for this day
      const journalEntry = journalEntries.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toISOString().split('T')[0] === dayString;
      });
      
      // Calculate total PnL for the day
      const totalPnL = dayTrades.reduce((sum, trade) => {
        return sum + calculatePnL(trade.entryPrice, trade.exitPrice, trade.qty, trade.side as 'LONG' | 'SHORT', trade.fees);
      }, 0);
      
      const dayData: DayData = {
        date: new Date(currentDateLoop),
        trades: dayTrades,
        journalEntry,
        totalPnL,
        tradeCount: dayTrades.length,
        isCurrentMonth: currentDateLoop.getMonth() === month,
        isToday: currentDateLoop.toISOString().split('T')[0] === todayLocal.toISOString().split('T')[0],
      };
      
      days.push(dayData);
      currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }
    
    return days;
  }, [currentDate, trades, journalEntries]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClasses = (day: DayData) => {
    let classes = "calendar-day h-20 p-2 cursor-pointer transition-all duration-200 ";
    
    if (!day.isCurrentMonth) {
      classes += "opacity-30 ";
    }
    
    if (day.isToday) {
      classes += "ring-2 ring-primary ring-offset-2 ";
    }
    
    if (day.tradeCount > 0) {
      if (day.totalPnL > 0) {
        classes += "positive border-green-300 hover:border-green-400 ";
      } else {
        classes += "negative border-red-300 hover:border-red-400 ";
      }
    } else {
      classes += "hover:bg-neutral-100 ";
    }
    
    return classes;
  };

  return (
    <>
      <div className="card">
        {/* Calendar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              {language === 'tr' 
                ? `${monthsTR[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              }
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>
              
              <button
                onClick={goToToday}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>{t.today}</span>
              </button>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {(language === 'tr' ? daysOfWeekTR : daysOfWeek).map(day => (
              <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarData.map((day, index) => (
              <div
                key={index}
                className={getDayClasses(day)}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    day.isCurrentMonth ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {day.journalEntry && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                
                {day.tradeCount > 0 && (
                  <div className="space-y-1">
                    <div className={`text-xs font-medium ${
                      day.totalPnL >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                    }`}>
                      {formatCurrency(day.totalPnL, 'USD', true)}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {day.tradeCount} {day.tradeCount === 1 ? 'trade' : 'trades'}
                    </div>
                  </div>
                )}
                
                {day.isCurrentMonth && day.tradeCount === 0 && (
                  <div className="text-[10px] text-neutral-300 text-center mt-2">
                    No trades
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Detail Modal */}
      {selectedDay && (
        <DailyDetailModal
          day={selectedDay}
          isOpen={true}
          onClose={() => setSelectedDay(null)}
          onUpdate={onTradeUpdate}
        />
      )}
    </>
  );
}
