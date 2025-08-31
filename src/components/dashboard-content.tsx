"use client";

import { Trade, JournalEntry } from "@prisma/client";
import { calculateTradeMetrics, formatCurrency, formatPercentage } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import { TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import TradingCalendar from "./trading-calendar";

interface DashboardContentProps {
  trades: Trade[];
  journalEntries: JournalEntry[];
}

export default function DashboardContent({ trades, journalEntries }: DashboardContentProps) {
  const metrics = calculateTradeMetrics(trades);
  const { t } = useLanguage();

  const handleTradeUpdate = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Net P&L */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">{t.netPnl}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-2xl font-bold ${
                  metrics.totalPnL >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                }`}>
                  {formatCurrency(metrics.totalPnL, 'USD', true)}
                </span>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-neutral-500">USD</span>
                  <div className="w-4 h-4 bg-neutral-100 rounded flex items-center justify-center cursor-pointer">
                    <span className="text-[10px] text-neutral-600">%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              metrics.totalPnL >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {metrics.totalPnL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-pnl-positive" />
              ) : (
                <TrendingDown className="h-5 w-5 text-pnl-negative" />
              )}
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">{t.profitFactor}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl font-bold text-neutral-900">
                  {metrics.profitFactor.toFixed(2)}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  metrics.profitFactor >= 1.5 ? 'bg-green-100' : 
                  metrics.profitFactor >= 1 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    metrics.profitFactor >= 1.5 ? 'bg-green-500' : 
                    metrics.profitFactor >= 1 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">{t.currentStreak}</p>
              <div className="mt-1">
                <span className="text-2xl font-bold text-neutral-900">
                  {trades.length > 0 ? '3' : '0'}
                </span>
                <span className="text-sm text-neutral-500 ml-1">{t.days}</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-neutral-500">{t.winning}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Import Button Placeholder */}
        <div className="card p-6 border-dashed border-2 border-neutral-200">
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-400 mb-2">Import trades</p>
            <button
              disabled
              className="text-xs text-neutral-400 bg-neutral-100 px-3 py-1 rounded cursor-not-allowed"
            >
              Coming soon
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Interactive Trading Calendar - Takes 2 columns */}
        <div className="xl:col-span-2">
          <TradingCalendar 
            trades={trades} 
            journalEntries={journalEntries}
            onTradeUpdate={handleTradeUpdate}
          />
        </div>

        {/* Right Sidebar Widgets */}
        <div className="xl:col-span-2 space-y-6">
          {/* Account Balance */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-4">Account Balance & P&L</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Balance</span>
                <span className="font-medium text-neutral-900">$32,032.50</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">P&L</span>
                <span className="font-medium text-pnl-positive">+$2,032.50</span>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-neutral-500">
                  {formatPercentage(6.4)} gain this month
                </div>
              </div>
            </div>
          </div>

          {/* Trade Win % */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-4">Trade Win %</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900">
                {formatPercentage(metrics.winRate, 1)}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-pnl-positive" />
                    <span>{metrics.winningTrades}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-pnl-negative" />
                    <span>{metrics.losingTrades}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trade Expectancy */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-4">Trade Expectancy</h3>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                metrics.expectancy >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
              }`}>
                {formatCurrency(metrics.expectancy)}
              </div>
              <div className="text-xs text-neutral-500 mt-1">per trade</div>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-neutral-600 mb-4">This Week</h3>
            <div className="space-y-3">
              {[
                { label: 'Week 1', pnl: 1250, trades: 12 },
                { label: 'Week 2', pnl: -340, trades: 8 },
                { label: 'Week 3', pnl: 890, trades: 15 },
                { label: 'Week 4', pnl: 420, trades: 9 },
              ].map((week, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">{week.label}</span>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      week.pnl >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                    }`}>
                      {formatCurrency(week.pnl, 'USD', true)}
                    </div>
                    <div className="text-xs text-neutral-500">{week.trades} trades</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-neutral-900">{metrics.totalTrades}</div>
          <div className="text-sm text-neutral-600">Total Trades</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-pnl-positive">
            {formatCurrency(metrics.bestTrade)}
          </div>
          <div className="text-sm text-neutral-600">Best Trade</div>
        </div>
        
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-pnl-negative">
            {formatCurrency(metrics.worstTrade)}
          </div>
          <div className="text-sm text-neutral-600">Worst Trade</div>
        </div>
        
                  <div className="card p-6 text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {formatCurrency(metrics.avgWin)}
            </div>
            <div className="text-sm text-neutral-600">Avg Win</div>
          </div>
        </div>


    </div>
  );
}
