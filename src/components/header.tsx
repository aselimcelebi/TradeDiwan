"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  Filter,
  Calendar,
  ChevronDown,
  Upload,
  User,
  Settings,
  LogOut,
  Badge,
  Languages,
  Building2,
} from "lucide-react";

interface FilterOptions {
  symbol: string;
  strategy: string;
  side: 'ALL' | 'LONG' | 'SHORT';
  outcome: 'ALL' | 'WIN' | 'LOSS';
}

interface DateRange {
  label: string;
  value: string;
  from?: Date;
  to?: Date;
}

// Date ranges will be translated dynamically

interface Broker {
  id: string;
  name: string;
  platform: string;
  accountId: string;
  status: string;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  showFilters?: boolean;
  onFiltersChange?: (filters: FilterOptions & { dateRange: DateRange }) => void;
  onImportTrades?: () => void;
  selectedBrokerId?: string;
  onBrokerChange?: (brokerId: string) => void;
}

export default function Header({
  title,
  subtitle,
  showFilters = true,
  onFiltersChange,
  onImportTrades,
  selectedBrokerId,
  onBrokerChange,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  
  const dateRanges: DateRange[] = [
    { label: t.today, value: "today" },
    { label: t.thisWeek, value: "week" },
    { label: t.thisMonth, value: "month" },
    { label: t.last30Days, value: "30days" },
    { label: t.custom, value: "custom" },
  ];
  const [filters, setFilters] = useState<FilterOptions>({
    symbol: '',
    strategy: '',
    side: 'ALL',
    outcome: 'ALL',
  });
  
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(dateRanges[2]); // This Month
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Fetch brokers on component mount
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const response = await fetch('/api/brokers');
        if (response.ok) {
          const brokersData = await response.json();
          setBrokers(brokersData);
          
          // Set default broker if selectedBrokerId is provided
          if (selectedBrokerId) {
            const broker = brokersData.find((b: Broker) => b.id === selectedBrokerId);
            setSelectedBroker(broker || null);
          } else if (brokersData.length > 0) {
            // Default to first broker if no selection
            setSelectedBroker(brokersData[0]);
            onBrokerChange?.(brokersData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching brokers:', error);
      }
    };

    fetchBrokers();
  }, [selectedBrokerId, onBrokerChange]);

  const getPlatformIcon = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      MT5: "🏛️",
      MT4: "🏦", 
      Binance: "🟡",
      cTrader: "📊",
      NinjaTrader: "🥷"
    };
    return platformMap[platform] || "📈";
  };

  const handleBrokerChange = (broker: Broker) => {
    setSelectedBroker(broker);
    setShowBrokerDropdown(false);
    onBrokerChange?.(broker.id);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.({ ...newFilters, dateRange: selectedDateRange });
  };

  const handleDateRangeChange = (dateRange: DateRange) => {
    setSelectedDateRange(dateRange);
    setShowDateDropdown(false);
    onFiltersChange?.({ ...filters, dateRange });
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Title */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted mt-1">{subtitle}</p>
            )}
          </div>

          {/* Center: Filters */}
          {showFilters && (
            <div className="flex items-center space-x-4">
              {/* Filters Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-border rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                >
                  <Filter className="h-4 w-4" />
                  <span>{t.filters}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showFiltersDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-2">
                          Symbol
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., BTCUSDT"
                          value={filters.symbol}
                          onChange={(e) => handleFilterChange('symbol', e.target.value)}
                          className="input text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-2">
                          Strategy
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Breakout"
                          value={filters.strategy}
                          onChange={(e) => handleFilterChange('strategy', e.target.value)}
                          className="input text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-2">
                            Side
                          </label>
                          <select
                            value={filters.side}
                            onChange={(e) => handleFilterChange('side', e.target.value)}
                            className="input text-sm"
                          >
                            <option value="ALL">All</option>
                            <option value="LONG">Long</option>
                            <option value="SHORT">Short</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-2">
                            Outcome
                          </label>
                          <select
                            value={filters.outcome}
                            onChange={(e) => handleFilterChange('outcome', e.target.value)}
                            className="input text-sm"
                          >
                            <option value="ALL">All</option>
                            <option value="WIN">Win</option>
                            <option value="LOSS">Loss</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <button
                          onClick={() => {
                            setFilters({
                              symbol: '',
                              strategy: '',
                              side: 'ALL',
                              outcome: 'ALL',
                            });
                            onFiltersChange?.({
                              symbol: '',
                              strategy: '',
                              side: 'ALL',
                              outcome: 'ALL',
                              dateRange: selectedDateRange,
                            });
                          }}
                          className="text-sm text-muted hover:text-neutral-700"
                        >
                          Clear filters
                        </button>
                        <button
                          onClick={() => setShowFiltersDropdown(false)}
                          className="btn-primary text-sm"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date Range Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDateDropdown(!showDateDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-border rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{selectedDateRange.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showDateDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {dateRanges.map((range) => (
                        <button
                          key={range.value}
                          onClick={() => handleDateRangeChange(range)}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 transition-colors duration-200",
                            selectedDateRange.value === range.value
                              ? "text-primary font-medium"
                              : "text-neutral-700"
                          )}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-4">
            {/* Broker Selector */}
            {brokers.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBrokerDropdown(!showBrokerDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-border rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                >
                  <Building2 className="h-4 w-4" />
                  {selectedBroker ? (
                    <>
                      <span className="text-base">{getPlatformIcon(selectedBroker.platform)}</span>
                      <span>{selectedBroker.name}</span>
                    </>
                  ) : (
                    <span>Select Broker</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showBrokerDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      {brokers.map((broker) => (
                        <button
                          key={broker.id}
                          onClick={() => handleBrokerChange(broker)}
                          className={cn(
                            "w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors duration-200 flex items-center space-x-3",
                            selectedBroker?.id === broker.id
                              ? "bg-primary/10 text-primary"
                              : "text-neutral-700"
                          )}
                        >
                          <span className="text-lg">{getPlatformIcon(broker.platform)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{broker.name}</div>
                            <div className="text-xs text-neutral-500">
                              {broker.platform} • {broker.accountId}
                            </div>
                          </div>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            broker.status === 'connected' ? 'bg-green-500' : 
                            broker.status === 'connecting' ? 'bg-yellow-500' : 'bg-gray-400'
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLanguage(language === 'en' ? 'tr' : 'en')}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-border rounded-lg hover:bg-neutral-50 transition-colors duration-200"
              >
                <Languages className="h-4 w-4" />
                <span>{language === 'en' ? 'TR' : 'EN'}</span>
              </button>
            </div>

            {/* Demo Badge */}
            {isDemoMode && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                <Badge className="h-4 w-4" />
                <span className="text-sm font-medium">{t.demoData}</span>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={onImportTrades}
              disabled={true} // Disabled for MVP
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-neutral-400 bg-neutral-100 rounded-lg cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span>{t.importTrades}</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium text-neutral-900">{t.demoUser}</p>
                      <p className="text-xs text-muted">demo@example.com</p>
                    </div>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>{t.settings}</span>
                    </button>
                    
                    <button className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 flex items-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
