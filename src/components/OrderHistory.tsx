/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  X,
  History,
  Phone,
  User,
  ShoppingBag,
  RotateCcw,
  Clock,
  MapPin,
  ChevronRight,
  LogOut,
  Calendar,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Order, MenuItem, OrderStatus, DeliveryType } from "../types";

export interface CustomerSession {
  customerName: string;
  phone: string;
  email?: string;
  address?: string;
}

interface OrderHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem, selectedProtein?: string, proteinExtraFee?: number) => void;
  onSelectActiveOrder: (order: Order) => void;
  onOpenCart: () => void;
}

export default function OrderHistory({
  isOpen,
  onClose,
  menuItems,
  onAddToCart,
  onSelectActiveOrder,
  onOpenCart,
}: OrderHistoryProps) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  
  // Login form state
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Orders history
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [systemError, setSystemError] = useState("");
  
  // Notification toast inside drawer
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("punique_customer_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.phone) {
          setSession(parsed);
        }
      } catch (e) {
        console.error("Failed to parse stored session", e);
      }
    }
  }, []);

  // Show auto-dismiss notifications
  const triggerNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Fetch orders matching the customer's phone number
  const fetchCustomerOrders = async (phoneNum: string) => {
    setLoading(true);
    setSystemError("");
    try {
      let allOrders: Order[] = [];
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          allOrders = await res.json();
        } else {
          throw new Error("Failed to load orders from API");
        }
      } catch (apiErr) {
        console.warn("API orders loading failed, falling back to localStorage", apiErr);
        try {
          const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
          allOrders = JSON.parse(localOrdersStr);
        } catch (parseErr) {
          console.error("Failed to parse local orders", parseErr);
          allOrders = [];
        }
      }
      
      // Normalize and filter by phone number
      const cleanPhoneNum = phoneNum.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
      
      const filtered = allOrders.filter((o) => {
        const cleanOrderPhone = o.phone.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
        return cleanOrderPhone === cleanPhoneNum || o.phone === phoneNum;
      });

      setOrders(filtered);
    } catch (err: any) {
      setSystemError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading when session changes
  useEffect(() => {
    if (session?.phone && isOpen) {
      fetchCustomerOrders(session.phone);
    }
  }, [session, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!phoneInput.trim()) {
      setLoginError("Please enter your phone number to continue.");
      return;
    }

    if (!nameInput.trim()) {
      setLoginError("Please enter your name to personalize your experience.");
      return;
    }

    const cleanPhone = phoneInput.trim();
    const newSession: CustomerSession = {
      customerName: nameInput.trim(),
      phone: cleanPhone,
    };

    localStorage.setItem("punique_customer_session", JSON.stringify(newSession));
    setSession(newSession);
    triggerNotification("success", `Welcome back, ${newSession.customerName}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("punique_customer_session");
    setSession(null);
    setOrders([]);
    setPhoneInput("");
    setNameInput("");
    triggerNotification("info", "Logged out successfully.");
  };

  const handleOneClickReorder = (order: Order) => {
    let addedCount = 0;
    let outOfStockCount = 0;

    order.items.forEach((item) => {
      const matchedItem = menuItems.find((m) => m.id === item.menuItemId);
      if (matchedItem) {
        if (matchedItem.inStock) {
          onAddToCart(matchedItem, item.selectedProtein, item.proteinExtraFee);
          addedCount++;
        } else {
          outOfStockCount++;
        }
      } else {
        outOfStockCount++;
      }
    });

    if (addedCount > 0) {
      if (outOfStockCount > 0) {
        triggerNotification(
          "info",
          `Added ${addedCount} items. ${outOfStockCount} items were out-of-stock.`
        );
      } else {
        triggerNotification("success", `Added all ${addedCount} items to your basket!`);
      }
      onOpenCart();
    } else {
      triggerNotification("error", "Sorry, all items in this order are currently out of stock.");
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.RECEIVED:
        return "bg-amber-50 text-amber-700 border-amber-200";
      case OrderStatus.PREPARING:
        return "bg-rose-50 text-brand-orange border-rose-200 animate-pulse";
      case OrderStatus.READY:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case OrderStatus.OUT_FOR_DELIVERY:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case OrderStatus.DELIVERED:
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl border-l border-slate-100 flex flex-col h-full font-sans">
          
          {/* Header */}
          <div className="bg-brand-green p-6 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(#E11D48_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
            <div className="flex items-center space-x-2 relative z-10">
              <History className="h-6 w-6 text-brand-gold" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#FFF9F0]">Order History</h2>
                <p className="text-[10px] text-slate-300 font-mono tracking-wider uppercase">
                  Punique Kitchen Yenagoa
                </p>
              </div>
            </div>
            <button
              id="btn-close-history"
              onClick={onClose}
              className="rounded-full p-1.5 bg-white/10 hover:bg-white/20 text-white transition focus:outline-none focus:ring-2 focus:ring-brand-gold relative z-10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Inline notification banner */}
          {notification && (
            <div
              className={`px-6 py-3 border-b text-xs font-semibold flex items-center space-x-2 shrink-0 animate-fadeIn ${
                notification.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : notification.type === "error"
                  ? "bg-red-50 text-red-800 border-red-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Main Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!session ? (
              /* LOGIN/SESS ENTRY VIEW */
              <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-brand-orange">
                    <History className="h-6 w-6" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-green">
                    Find Your Previous Orders
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    Enter your name and phone number used during checkout to view your order logs, live track deliveries, and re-order in seconds.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  {loginError && (
                    <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="history-name-input"
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="e.g. Gift Amgbare"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-brand-green focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-green uppercase tracking-wider block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="history-phone-input"
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="e.g. 08055662211"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-brand-green font-mono focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-history-login-submit"
                    type="submit"
                    className="w-full rounded-xl bg-brand-orange hover:bg-brand-orange/95 py-3 text-xs font-bold uppercase tracking-wider text-white transition shadow-md shadow-brand-orange/20 hover:shadow-brand-orange/30 active:scale-95 cursor-pointer"
                  >
                    View Order Logs
                  </button>
                </form>

                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100/40 text-center">
                  <p className="text-[10px] text-amber-800 leading-normal font-medium">
                    💡 <strong>Quick Demo Tip:</strong> Log in with phone number{" "}
                    <span className="font-mono font-bold text-brand-orange">+2348055662211</span> or{" "}
                    <span className="font-mono font-bold text-brand-orange">+2348123456789</span> to instantly see realistic seeded past orders!
                  </p>
                </div>
              </div>
            ) : (
              /* LOGGED IN VIEW */
              <div className="space-y-5">
                {/* User Session Profile Header */}
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-brand-orange">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-green">{session.customerName}</h4>
                      <p className="text-[10px] text-gray-400 font-mono font-medium mt-0.5">
                        {session.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    id="btn-history-logout"
                    onClick={handleLogout}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
                    title="Switch Account"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>

                {/* Loyalty Point Tracker Club Card */}
                {(() => {
                  const totalPoints = orders
                    .filter((o) => o.status === OrderStatus.DELIVERED)
                    .reduce((sum, o) => sum + Math.floor(o.subtotal / 100), 0);
                  
                  return (
                    <div className="bg-gradient-to-br from-brand-green via-[#0c2b18] to-emerald-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-500/10 space-y-4 relative overflow-hidden animate-fadeIn">
                      {/* Abstract decor circular lights */}
                      <div className="absolute -top-12 -right-12 h-28 w-28 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 h-20 w-20 bg-brand-orange/10 rounded-full blur-xl pointer-events-none" />

                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <span className="text-[9px] font-bold text-brand-gold uppercase tracking-widest font-mono block">
                            Punique Club
                          </span>
                          <span className="text-[11px] text-emerald-300 font-medium font-mono">
                            Loyalty Member Card
                          </span>
                        </div>
                        <div className="rounded-full bg-white/10 p-1.5 text-brand-gold">
                          <Sparkles className="h-4 w-4 text-brand-gold animate-pulse" />
                        </div>
                      </div>

                      <div className="pt-2 relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-emerald-200 uppercase tracking-wide font-medium">Accumulated Balance</p>
                          <div className="flex items-baseline space-x-1 mt-1">
                            <span className="text-2xl font-serif font-extrabold text-[#FFF9F0] tracking-tight">{totalPoints}</span>
                            <span className="text-xs font-bold text-brand-gold">Points</span>
                          </div>
                        </div>

                        <div className="text-right text-[10px] text-emerald-300 font-mono font-medium">
                          <p>Rate: 1 pt / ₦100 spent</p>
                        </div>
                      </div>

                      {/* Loyalty Progress Tracker Bar */}
                      <div className="pt-1.5 space-y-1 relative z-10">
                        <div className="flex justify-between text-[10px] text-emerald-300">
                          <span>Progress to Gold Club status</span>
                          <span>{totalPoints % 150}/150 pts</span>
                        </div>
                        <div className="w-full h-1.5 bg-brand-green/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-gold rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, ((totalPoints % 150) / 150) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-emerald-400 text-center italic mt-1 font-medium">
                          Keep ordering to stack up tasty rewards! 🍳
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Section Title */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                    Your Orders ({orders.length})
                  </span>
                  {loading && (
                    <span className="text-[10px] text-brand-orange font-mono font-bold animate-pulse">
                      Updating...
                    </span>
                  )}
                </div>

                {/* Error Banner */}
                {systemError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs rounded-xl text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{systemError}</span>
                  </div>
                )}

                {/* Loading State */}
                {loading && orders.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
                    <p className="text-xs text-gray-400 font-medium">Fetching past orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  /* EMPTY STATE */
                  <div className="py-12 text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center text-brand-orange/60">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-green">No Orders Found</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        We couldn't find any orders matching this phone number yet. Placed an order? Check if the number is correct.
                      </p>
                    </div>
                    <button
                      id="btn-history-view-menu"
                      onClick={onClose}
                      className="rounded-xl border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer"
                    >
                      Browse Menu Now
                    </button>
                  </div>
                ) : (
                  /* ORDERS LIST */
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isActive = order.status !== OrderStatus.DELIVERED;
                      const dateObj = new Date(order.createdAt);
                      const formattedDate = dateObj.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const formattedTime = dateObj.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-3.5 hover:border-brand-orange/20 transition"
                        >
                          {/* Order Card Header */}
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-brand-green font-mono">
                                  #{order.id}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${getStatusColor(
                                    order.status
                                  )}`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <div className="flex items-center text-[10px] text-gray-400 mt-1 font-medium gap-1 font-mono">
                                <Calendar className="h-3 w-3 text-gray-300" />
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span>{formattedTime}</span>
                              </div>
                            </div>
                            <span className="font-serif text-sm font-bold text-brand-orange">
                              ₦{order.total.toLocaleString()}
                            </span>
                          </div>

                          {/* Items List inside card */}
                          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 divide-y divide-slate-100">
                            {order.items.map((it) => (
                              <div
                                key={it.id}
                                className="py-1.5 flex justify-between items-center text-[11px]"
                              >
                                <div className="text-brand-green font-medium">
                                  <span>{it.name}</span>
                                  <span className="text-gray-400 ml-1">x{it.quantity}</span>
                                  {it.selectedProtein && (
                                    <span className="block text-[9px] text-brand-orange font-medium">
                                      {it.selectedProtein.split(" (")[0]}
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-gray-400">
                                  ₦
                                  {(
                                    (it.priceAtTime + (it.proteinExtraFee || 0)) *
                                    it.quantity
                                  ).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Actions Inside Card */}
                          <div className="flex gap-2 pt-1">
                            {/* Re-order Button */}
                            <button
                              id={`btn-reorder-${order.id}`}
                              onClick={() => handleOneClickReorder(order)}
                              className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-brand-orange hover:bg-brand-orange/95 py-2.5 text-[11px] font-bold text-white transition active:scale-95 shadow-sm cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Re-order Items</span>
                            </button>

                            {/* Active Tracker Button if relevant */}
                            {isActive ? (
                              <button
                                id={`btn-track-active-${order.id}`}
                                onClick={() => {
                                  onSelectActiveOrder(order);
                                  onClose();
                                }}
                                className="flex items-center justify-center space-x-1.5 rounded-xl bg-brand-green/5 border border-brand-green/20 hover:bg-brand-green/10 px-3.5 text-[11px] font-semibold text-brand-green transition active:scale-95 cursor-pointer animate-pulse"
                              >
                                <Activity className="h-3.5 w-3.5 text-brand-orange" />
                                <span>Track Live</span>
                              </button>
                            ) : (
                              <div className="flex items-center space-x-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1 font-semibold">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Delivered</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="border-t border-slate-100 p-5 bg-white shrink-0 text-center">
            <p className="text-[10px] text-gray-400 font-mono">
              Punique Kitchen Delivery Service • Yenagoa, Bayelsa
            </p>
          </div>

        </div>
      </div>
  );
}
