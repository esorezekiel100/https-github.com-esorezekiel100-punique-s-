/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ShoppingBag, Clock, History, Award, Sparkles, ChefHat, UtensilsCrossed, Bell, Trash2, CheckSquare } from "lucide-react";
import { KitchenSettings, AdminNotification } from "../types";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  settings: KitchenSettings;
  onOpenHistory: () => void;
  loyaltyPoints?: number;
  adminNotifications: AdminNotification[];
  onReadAllNotifications: () => void;
  onClearNotifications: () => void;
  onSelectOrderId: (orderId: string) => void;
  isAdmin?: boolean;
}

const getLoyaltyTier = (points: number) => {
  if (points < 100) {
    return {
      name: "Bronze Foodie 🍤",
      nextThreshold: 100,
      perk: "Earn 100 pts to reach Silver Gourmet & unlock free soft drinks!",
    };
  } else if (points < 300) {
    return {
      name: "Silver Gourmet 🍲",
      nextThreshold: 300,
      perk: "Unlock priority delivery & free native drink on orders above ₦5,000!",
    };
  } else {
    return {
      name: "Golden Emperor 👑",
      nextThreshold: 1000,
      perk: "Ultimate VIP Status: Free extra protein (snail/fish) with any native soup order!",
    };
  }
};

export default function Navbar({
  cartCount,
  onOpenCart,
  settings,
  onOpenHistory,
  loyaltyPoints = 0,
  adminNotifications = [],
  onReadAllNotifications,
  onClearNotifications,
  onSelectOrderId,
  isAdmin = false,
}: NavbarProps) {
  const currentTier = getLoyaltyTier(loyaltyPoints);
  const [showLoyaltyTooltip, setShowLoyaltyTooltip] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const loyaltyRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const unreadCount = adminNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loyaltyRef.current && !loyaltyRef.current.contains(event.target as Node)) {
        setShowLoyaltyTooltip(false);
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-brand-green/5 bg-white/85 backdrop-blur-xl transition-all duration-300">
        {/* Animated accent ribbon */}
        <div className="h-1 w-full bg-gradient-to-r from-brand-orange via-brand-gold to-brand-green" />

        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-2 min-[375px]:px-3 sm:px-6">
          {/* Logo & Brand (Chef Cap & White/Yellow Logo Capsule) */}
          <div className="flex cursor-pointer items-center space-x-1.5 min-[375px]:space-x-2 sm:space-x-3 group/logo bg-brand-charcoal hover:bg-brand-charcoal/95 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-brand-gold/10 transition-all duration-300 shadow-md">
            <div className="relative flex h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md sm:rounded-xl bg-brand-gold/10 text-brand-gold group-hover/logo:scale-110 group-hover/logo:rotate-6 transition-all duration-300 shrink-0">
              <ChefHat className="h-4.5 w-4.5 min-[375px]:h-5 min-[375px]:w-5 sm:h-6 sm:w-6 text-brand-gold transform transition-transform duration-300" />
            </div>

            <div className="leading-tight">
              <h1 id="brand-logo" className="font-serif text-[11px] min-[375px]:text-xs min-[410px]:text-sm sm:text-xl font-black tracking-tight text-white flex items-center">
                PUNIQUE<span className="text-brand-gold ml-1 sm:ml-1.5 relative">
                  KITCHEN
                  <span className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-brand-gold scale-x-0 group-hover/logo:scale-x-100 transition-transform duration-300 origin-left" />
                </span>
              </h1>
              <p className="hidden text-[8px] font-mono tracking-widest text-brand-gold uppercase sm:block font-bold mt-0.5">
                Good meal equal happy bellies
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center space-x-1 min-[375px]:space-x-1.5 sm:space-x-3">
            {/* Store Status Badge with live breathing pulse */}
            <div
              className={`hidden items-center space-x-1 rounded-2xl px-2.5 py-1 text-[10px] sm:text-xs font-semibold md:flex shadow-sm transition-all duration-300 ${
                settings.isOpen
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100/80"
                  : "bg-rose-50 text-rose-800 border border-rose-100/80"
              }`}
            >
              <span className="relative flex h-1.5 w-1.5 mr-0.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${settings.isOpen ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${settings.isOpen ? "bg-emerald-500" : "bg-rose-500"}`}></span>
              </span>
              <Clock className="h-3 w-3 opacity-90" />
              <span>
                {settings.isOpen
                  ? `Open • Closes ${settings.closingTime}`
                  : "Closed"}
              </span>
            </div>

            {/* Loyalty Points Visual Indicator */}
            <div className="relative group" ref={loyaltyRef}>
              <button
                id="btn-loyalty-points"
                onClick={() => setShowLoyaltyTooltip((prev) => !prev)}
                className="flex items-center space-x-0.5 min-[375px]:space-x-1 sm:space-x-2 rounded-lg min-[375px]:rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-orange/[0.04] to-brand-gold/[0.08] border border-brand-gold/20 hover:border-brand-gold/45 px-1.5 py-1 min-[375px]:px-2 min-[375px]:py-1.5 sm:px-3 sm:py-2 text-[9px] min-[375px]:text-[10px] sm:text-xs font-bold text-brand-orange transition-all duration-300 shadow-sm cursor-pointer"
              >
                <div className="relative shrink-0">
                  <Award className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4.5 sm:w-4.5 text-brand-gold animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-1 w-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-brand-gold"></span>
                  </span>
                </div>
                <div className="flex flex-col items-start leading-none text-left">
                  <span className="hidden sm:inline text-[8px] text-slate-400 uppercase tracking-wider font-bold">Club Balance</span>
                  <span className="font-mono text-[9px] min-[375px]:text-[10px] sm:text-xs font-black text-brand-green sm:mt-0.5">
                    {loyaltyPoints}<span className="text-[7px] min-[375px]:text-[8px] sm:text-[9px] font-sans font-extrabold text-brand-orange ml-0.5">PTS</span>
                  </span>
                </div>
              </button>

              {/* Loyalty Tooltip / Hover Card */}
              <div className={`absolute right-0 top-full mt-2 w-56 sm:w-64 origin-top-right rounded-2xl bg-white p-3 sm:p-4 shadow-xl border border-slate-100 ring-1 ring-black/5 transition-all duration-300 z-50 ${
                showLoyaltyTooltip
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
              }`}>
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="h-7 w-7 rounded-full bg-brand-orange/15 flex items-center justify-center text-brand-orange">
                    <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                  </div>
                  <div>
                    <h5 className="font-serif text-xs font-bold text-brand-green">Punique Loyalty Club</h5>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 font-semibold font-mono">1 PT per ₦100 Spent</p>
                  </div>
                </div>
                
                {/* Level Progress */}
                <div className="mt-2.5 space-y-2">
                  <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold">
                    <span className="text-slate-500">Tier: {currentTier.name}</span>
                    <span className="text-brand-orange">{loyaltyPoints} / {currentTier.nextThreshold} pts</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand-orange to-brand-gold h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (loyaltyPoints / currentTier.nextThreshold) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 leading-normal italic font-semibold">
                    {currentTier.perk}
                  </p>

                  <div className="pt-2 border-t border-slate-100 mt-2">
                    <p className="text-[9px] font-bold text-emerald-700 bg-emerald-50 rounded-lg p-1.5 leading-snug">
                      🎁 <strong>Food Reward Active!</strong> once you reach 1,000 points you can order food. 1,000 pts is equivalent to ₦1,000 Naira discount!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Notifications Hub (Bell Icon) */}
            {isAdmin && (
              <div className="relative" ref={adminRef}>
                <button
                  id="btn-admin-notifications"
                  onClick={() => setShowAdminDropdown((prev) => !prev)}
                  className={`relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg min-[375px]:rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${
                    unreadCount > 0
                      ? "bg-amber-50 border-amber-200 text-brand-orange animate-pulse"
                      : "bg-slate-50/50 border-slate-100 text-slate-500 hover:text-brand-orange"
                  }`}
                  title="Admin Payment Alerts"
                >
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] sm:text-[9px] font-extrabold text-white ring-2 ring-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Admin Dropdown Card */}
                <div
                  className={`absolute right-0 top-full mt-2 w-72 sm:w-80 origin-top-right rounded-2xl bg-white p-3 sm:p-4 shadow-xl border border-slate-100 ring-1 ring-black/5 transition-all duration-300 z-50 ${
                    showAdminDropdown
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <h5 className="font-serif text-xs font-bold text-brand-green">Admin Alerts (Payments)</h5>
                    </div>
                    {adminNotifications.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={onReadAllNotifications}
                          className="text-[9px] font-bold text-brand-green hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Mark all as read"
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>Read</span>
                        </button>
                        <button
                          onClick={onClearNotifications}
                          className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Clear all"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {adminNotifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-medium">
                        No payment alerts received yet.
                      </div>
                    ) : (
                      adminNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onSelectOrderId(notif.orderId);
                            setShowAdminDropdown(false);
                          }}
                          className={`py-2 px-1.5 rounded-lg text-left text-[11px] cursor-pointer transition hover:bg-slate-50 flex items-start gap-2 ${
                            !notif.isRead ? "bg-amber-50/40 font-semibold" : "text-slate-600"
                          }`}
                        >
                          <div className="h-5 w-5 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0 mt-0.5">
                            <span className="text-[9px] font-bold">₦</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="leading-snug break-words">
                              {notif.message}
                            </p>
                            <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                              {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <button
                id="btn-open-history"
                onClick={onOpenHistory}
                className="flex items-center space-x-0.5 min-[375px]:space-x-1 rounded-lg min-[375px]:rounded-xl sm:rounded-2xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/80 px-1.5 py-1 min-[375px]:px-2 min-[375px]:py-1.5 sm:px-3 sm:py-2 text-[9px] min-[375px]:text-[10px] sm:text-xs font-bold text-brand-orange hover:text-brand-orange/90 transition cursor-pointer"
              >
                <History className="h-3 w-3 min-[375px]:h-3.5 min-[375px]:w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Orders</span>
              </button>
            </div>

            {/* Cart Button with vibrant bounce feedback on hover */}
            <button
              id="btn-toggle-cart"
              onClick={onOpenCart}
              className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg min-[375px]:rounded-xl sm:rounded-2xl bg-brand-orange text-white shadow-md shadow-brand-orange/20 transition-all duration-300 hover:bg-brand-orange hover:scale-105 hover:shadow-brand-orange/30 active:scale-95 shrink-0"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-brand-green text-[8px] sm:text-[9px] font-bold text-white ring-2 ring-white animate-bounce" style={{ animationDuration: '2s' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
