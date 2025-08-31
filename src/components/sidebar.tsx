"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  LayoutDashboard,
  BookOpen,
  List,
  FileText,
  BarChart3,
  Lightbulb,
  Activity,
  Play,
  Trophy,
  Users,
  GraduationCap,
  HelpCircle,
  Plus,
  Menu,
  X,
  Wifi,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

// Navigation items will be translated dynamically

interface SidebarProps {
  onAddTrade?: () => void;
}

export default function Sidebar({ onAddTrade }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useLanguage();

  const mainNavItems: NavItem[] = [
    {
      name: t.dashboard,
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: t.dailyJournal,
      href: "/journal",
      icon: BookOpen,
    },
    {
      name: t.trades,
      href: "/trades",
      icon: List,
    },
    {
      name: t.notebook,
      href: "/notebook",
      icon: FileText,
    },
    {
      name: t.reports,
      href: "/reports",
      icon: BarChart3,
    },
    {
      name: t.insights,
      href: "/insights",
      icon: Lightbulb,
    },
  ];

  const futureNavItems: NavItem[] = [
    {
      name: t.backtesting,
      href: "/backtesting",
      icon: Activity,
      badge: "NEW",
      disabled: true,
    },
    {
      name: t.tradeReplay,
      href: "/replay",
      icon: Play,
      disabled: true,
    },
    {
      name: t.challenges,
      href: "/challenges",
      icon: Trophy,
      badge: "BETA",
      disabled: true,
    },
    {
      name: t.mentorMode,
      href: "/mentor",
      icon: Users,
      disabled: true,
    },
    {
      name: t.university,
      href: "/university",
      icon: GraduationCap,
      disabled: true,
    },
    {
      name: t.resourceCenter,
      href: "/resources",
      icon: HelpCircle,
      disabled: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <img src="/logo.svg" alt="TradeDiwan" className="w-8 h-8" />
          <div>
            <span className="text-xl font-bold text-white">TradeDiwan</span>
            <p className="text-xs text-blue-100 mt-1">Demo Account</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <button
          onClick={onAddTrade}
          className="w-full flex items-center justify-center space-x-2 bg-white text-sidebar-from font-medium py-3 px-4 rounded-lg hover:bg-white/90 transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>{t.addTrade}</span>
        </button>
        
        <Link
          href="/brokers"
          className="w-full flex items-center justify-center space-x-2 bg-white/10 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-white/20 transition-colors duration-200 border border-white/20"
        >
          <Wifi className="h-4 w-4" />
          <span>Broker Yönetimi</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <IconComponent className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Future Features */}
      <div className="px-4 pb-4">
        <div className="mb-3">
          <h3 className="text-xs font-medium text-white/50 uppercase tracking-wide px-3">
            {t.comingSoon}
          </h3>
        </div>
        <div className="space-y-1">
          {futureNavItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.name}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                  item.disabled
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <IconComponent className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="text-xs bg-white/20 text-white/70 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-neutral-700" />
        ) : (
          <Menu className="h-5 w-5 text-neutral-700" />
        )}
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64 sidebar-gradient">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 sidebar-gradient transform transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
