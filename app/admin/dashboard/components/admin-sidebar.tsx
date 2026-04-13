'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Handshake,
  Home,
  Mail,
  Wallet, ChevronLeft,
  ChevronRight,
  Headphones,
  Receipt
} from 'lucide-react';

interface AdminSidebarProps {
  currentSection: string;
  onSectionChange: (section: any) => void;
  subscriptionProviderFilter?: "all" | "mpesa" | "binance" | "card";
  onSubscriptionProviderChange?: (provider: "all" | "mpesa" | "binance" | "card") => void;
  admin: any;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'main' },
  { id: 'users', label: 'Users', icon: Users, category: 'main' },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, category: 'main' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, category: 'main' },
  { id: 'partners', label: 'Partners', icon: Handshake, category: 'main' },
  { id: 'support', label: 'Support', icon: Headphones, category: 'main' },
];

const externalLinks = [
  { href: '/', label: 'Homepage', icon: Home },
  { href: '/admin/send-emails', label: 'Send Emails', icon: Mail },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
];

export default function AdminSidebar({
  currentSection,
  onSectionChange,
  subscriptionProviderFilter = "all",
  onSubscriptionProviderChange,
  admin,
  onLogout,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${collapsed ? 'w-[78px]' : 'w-[260px]'
        } h-screen bg-[#2F3349] flex flex-col transition-all duration-300 shadow-[4px_0_10px_rgba(0,0,0,0.15)]`}
    >
      {/* Header / Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-dark.png"
              alt="ReadyPips"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <Image
              src="/logo-dark.png"
              alt="RP"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-full bg-[#18181b]/5 hover:bg-[#18181b]/10 flex items-center justify-center text-white/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* Main Menu */}
        {!collapsed && (
          <p className="px-4 pt-4 pb-2 text-[10px] font-bold text-white/25 uppercase tracking-[1.5px]">
            Dashboard
          </p>
        )}

        <div className="space-y-1">
          {menuItems
            .filter(() => admin?.isAdmin === true)
            .map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all duration-200 ${currentSection === item.id
                      ? 'bg-[#8C57FF] text-white shadow-[0_2px_6px_rgba(140,87,255,0.4)] font-medium'
                      : 'text-white/60 hover:text-white/90 hover:bg-[#18181b]/[0.04]'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );
            })}
        </div>

        {/* Submenu under Subscriptions */}
        {!collapsed && currentSection === "subscriptions" && (
          <div className="mt-2 ml-4 border-l border-white/10 pl-3 space-y-1">
            {[
              { id: "all", label: "All Payments" },
              { id: "mpesa", label: "M-Pesa Payments" },
              { id: "binance", label: "Binance Payments" },
              { id: "card", label: "Card Payments" },
            ].map((sub) => (
              <button
                key={sub.id}
                onClick={() =>
                  onSubscriptionProviderChange?.(
                    sub.id as "all" | "mpesa" | "binance" | "card",
                  )
                }
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${subscriptionProviderFilter === sub.id
                    ? "bg-[#8C57FF]/20 text-[#d7c7ff] font-semibold"
                    : "text-white/55 hover:text-white/85 hover:bg-[#18181b]/[0.04]"
                  }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* External Links */}
        {!collapsed && (
          <p className="px-4 pt-6 pb-2 text-[10px] font-bold text-white/25 uppercase tracking-[1.5px]">
            Pages & Links
          </p>
        )}

        <div className="space-y-1">
          {externalLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-[#18181b]/[0.04] transition-all duration-200 ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

