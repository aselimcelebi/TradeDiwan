import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// PnL hesaplama utility'si
export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  qty: number,
  side: 'LONG' | 'SHORT',
  fees: number = 0
): number {
  const gross = (exitPrice - entryPrice) * qty * (side === 'LONG' ? 1 : -1);
  return gross - fees;
}

// R Multiple hesaplama
export function calculateRMultiple(pnl: number, risk: number): number | null {
  if (!risk || risk === 0) return null;
  return pnl / risk;
}

// Para formatlaması
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  showSign: boolean = false
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  return amount < 0 ? `-${formatted}` : formatted;
}

// Yüzde formatlaması
export function formatPercentage(
  value: number,
  decimals: number = 1,
  showSign: boolean = false
): string {
  const formatted = `${Math.abs(value).toFixed(decimals)}%`;
  
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  
  return value < 0 ? `-${formatted}` : formatted;
}

// Tarih formatlaması
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

// Trade metrikleri hesaplama
export interface TradeMetrics {
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTrade: number;
  worstTrade: number;
  maxDrawdown: number;
}

export function calculateTradeMetrics(trades: Array<{
  entryPrice: number;
  exitPrice: number;
  qty: number;
  side: 'LONG' | 'SHORT';
  fees: number;
}>): TradeMetrics {
  if (trades.length === 0) {
    return {
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      bestTrade: 0,
      worstTrade: 0,
      maxDrawdown: 0,
    };
  }

  const pnls = trades.map(trade => 
    calculatePnL(trade.entryPrice, trade.exitPrice, trade.qty, trade.side, trade.fees)
  );

  const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
  const winningPnLs = pnls.filter(pnl => pnl > 0);
  const losingPnLs = pnls.filter(pnl => pnl < 0);
  
  const winningTrades = winningPnLs.length;
  const losingTrades = losingPnLs.length;
  const totalTrades = trades.length;
  
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const avgWin = winningTrades > 0 ? winningPnLs.reduce((sum, pnl) => sum + pnl, 0) / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? Math.abs(losingPnLs.reduce((sum, pnl) => sum + pnl, 0) / losingTrades) : 0;
  
  const totalGains = winningPnLs.reduce((sum, pnl) => sum + pnl, 0);
  const totalLosses = Math.abs(losingPnLs.reduce((sum, pnl) => sum + pnl, 0));
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : totalGains > 0 ? Infinity : 0;
  
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
  
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
  
  // Max drawdown hesaplaması
  let peak = 0;
  let maxDrawdown = 0;
  let runningTotal = 0;
  
  for (const pnl of pnls) {
    runningTotal += pnl;
    if (runningTotal > peak) {
      peak = runningTotal;
    }
    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return {
    totalPnL,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    totalTrades,
    winningTrades,
    losingTrades,
    bestTrade,
    worstTrade,
    maxDrawdown,
  };
}

// Streak hesaplama (kazanma/kaybetme serisi)
export function calculateStreak(trades: Array<{
  entryPrice: number;
  exitPrice: number;
  qty: number;
  side: 'LONG' | 'SHORT';
  fees: number;
}>): { current: number; type: 'win' | 'loss' | null; max: number } {
  if (trades.length === 0) {
    return { current: 0, type: null, max: 0 };
  }

  const pnls = trades.map(trade => 
    calculatePnL(trade.entryPrice, trade.exitPrice, trade.qty, trade.side, trade.fees)
  );

  let currentStreak = 0;
  let currentType: 'win' | 'loss' | null = null;
  let maxStreak = 0;
  
  // Son trade'den başlayarak geriye doğru git
  for (let i = pnls.length - 1; i >= 0; i--) {
    const isWin = pnls[i] > 0;
    const tradeType = isWin ? 'win' : 'loss';
    
    if (currentType === null) {
      currentType = tradeType;
      currentStreak = 1;
    } else if (currentType === tradeType) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Maximum streak hesaplama
  let tempStreak = 0;
  let tempType: 'win' | 'loss' | null = null;
  
  for (const pnl of pnls) {
    const isWin = pnl > 0;
    const tradeType = isWin ? 'win' : 'loss';
    
    if (tempType === null || tempType === tradeType) {
      tempType = tradeType;
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempType = tradeType;
      tempStreak = 1;
    }
  }

  return { current: currentStreak, type: currentType, max: maxStreak };
}
