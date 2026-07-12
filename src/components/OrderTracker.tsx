/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Check, Clock, Flame, MapPin, MessageSquare, Phone, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { Order, OrderStatus, DeliveryType } from "../types";

interface OrderTrackerProps {
  order: Order | null;
  onClose: () => void;
  kitchenPhone: string;
  onUpdateOrder?: (updated: Order) => void;
}

export default function OrderTracker({
  order,
  onClose,
  kitchenPhone,
  onUpdateOrder,
}: OrderTrackerProps) {
  if (!order) return null;

  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    if (order && order.phone) {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((allOrders: Order[]) => {
          const cleanPhoneNum = order.phone.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
          const customerOrders = allOrders.filter((o) => {
            const cleanOrderPhone = o.phone.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
            return cleanOrderPhone === cleanPhoneNum || o.phone === order.phone;
          });
          const completedPoints = customerOrders
            .filter((o) => o.status === OrderStatus.DELIVERED)
            .reduce((sum, o) => sum + Math.floor(o.subtotal / 100), 0);
          setTotalPoints(completedPoints);
        })
        .catch((err) => console.error("Failed to load loyalty points in tracker", err));
    }
  }, [order?.status, order?.phone]);

  const handleUpdateStatusSimulated = async (nextStatus: OrderStatus) => {
    if (!order) return;
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        if (onUpdateOrder) {
          onUpdateOrder(updated);
        }
      }
    } catch (err) {
      console.error("Failed to simulate status change", err);
    }
  };

  const steps = [
    { label: "Received", status: OrderStatus.RECEIVED, description: "We have received your order", icon: Clock },
    { label: "Preparing", status: OrderStatus.PREPARING, description: "Chef is prepping your fresh meal", icon: Flame },
    {
      label: order.deliveryType === DeliveryType.DELIVERY ? "Out for Delivery" : "Ready for Pickup",
      status: order.deliveryType === DeliveryType.DELIVERY ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.READY,
      description: order.deliveryType === DeliveryType.DELIVERY ? "Dispatch rider is on the way" : "Your meal is hot and ready!",
      icon: order.deliveryType === DeliveryType.DELIVERY ? Truck : ShoppingBag,
    },
    { label: "Delivered", status: OrderStatus.DELIVERED, description: "Enjoy your delicious meal!", icon: Check },
  ];

  // Determine current step index
  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.RECEIVED:
        return 0;
      case OrderStatus.PREPARING:
        return 1;
      case OrderStatus.READY:
      case OrderStatus.OUT_FOR_DELIVERY:
        return 2;
      case OrderStatus.DELIVERED:
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex(order.status);

  // Generate WhatsApp prefilled message
  const handleShareWhatsApp = () => {
    const cleanPhone = kitchenPhone.replace(/\+/g, "").trim();
    
    const itemsText = order.items
      .map((it) => `- *${it.name}* x${it.quantity} (₦${it.priceAtTime.toLocaleString()})`)
      .join("\n");

    const messageText = `Hello Punique Kitchen! 🍳\n\nI just placed a food order on your platform.\n\n*Order ID:* #${order.id}\n*Customer:* ${order.customerName}\n*Phone:* ${order.phone}\n\n*Items Ordered:*\n${itemsText}\n\n*Subtotal:* ₦${order.subtotal.toLocaleString()}\n*Dispatch Delivery Fee:* ₦${order.deliveryFee.toLocaleString()}\n*Grand Total:* *₦${order.total.toLocaleString()}*\n\n*Service Type:* ${order.deliveryType}\n*Address:* ${order.address}\n\nPlease confirm receipt and preparation. Thank you!`;

    const encoded = encodeURIComponent(messageText);
    const url = `https://wa.me/${cleanPhone || "2348030000000"}?text=${encoded}`;
    window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Tracker Card */}
      <div className="overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-xl">
        
        {/* Banner */}
        <div className="bg-brand-green p-6 text-white text-center relative overflow-hidden">
          {/* Subtle overlay accent */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/10 opacity-40 pointer-events-none" />
          
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand-gold uppercase block">
            Live Order Status Tracker
          </span>
          <h2 className="font-serif text-2xl font-bold mt-1 text-[#FFF9F0]">
            Order #{order.id}
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium font-mono">
            Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Status Line Progress */}
        <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-100">
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-0">
            {/* Horizontal connection line for desktop */}
            <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 hidden sm:block pointer-events-none">
              <div
                className="h-full bg-brand-orange transition-all duration-500"
                style={{ width: `${(currentStepIndex / 3) * 100}%` }}
              />
            </div>

            {/* Vertical connection line for mobile */}
            <div className="absolute left-[21px] top-5 bottom-5 w-1 bg-slate-200 sm:hidden pointer-events-none">
              <div
                className="w-full bg-brand-orange transition-all duration-500"
                style={{ height: `${(currentStepIndex / 3) * 100}%` }}
              />
            </div>

            {/* Steps map */}
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = idx < currentStepIndex;
              const isActive = idx === currentStepIndex;
              
              return (
                <div key={step.label} className="flex sm:flex-col items-center gap-4 sm:gap-2 z-10 w-full sm:w-1/4 text-left sm:text-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition duration-500 ${
                      isCompleted
                        ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-rose-500/20"
                        : isActive
                        ? "bg-brand-orange border-brand-orange text-white shadow-md shadow-rose-500/25 animate-pulse"
                        : "bg-white border-slate-200 text-gray-300"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5 stroke-[3px]" /> : <Icon className="h-5 w-5" />}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold transition duration-300 ${
                        isActive ? "text-brand-orange" : isCompleted ? "text-brand-green" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-medium sm:hidden block mt-0.5 leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Phase Description Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-center">
          <p className="text-xs font-bold text-brand-green flex items-center justify-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-orange animate-ping" />
            <span>Current Status: <span className="text-brand-orange">{steps[currentStepIndex].label}</span></span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1 font-light italic">
            "{steps[currentStepIndex].description}"
          </p>
        </div>

        {/* Order details list */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-green uppercase tracking-wider">Order Summary</h3>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-brand-green">{item.name}</span>
                    <span className="text-gray-400 font-medium ml-1.5">x{item.quantity}</span>
                    {item.selectedProtein && (
                      <span className="block text-[10px] text-brand-orange font-medium mt-0.5">
                        {item.selectedProtein.split(" (")[0]}
                      </span>
                    )}
                  </div>
                  <span className="font-serif font-semibold text-brand-green">
                    ₦{((item.priceAtTime + (item.proteinExtraFee || 0)) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              
              <div className="pt-3.5 space-y-2 mt-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-serif">₦{order.subtotal.toLocaleString()}</span>
                </div>
                {order.deliveryType === DeliveryType.DELIVERY && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Yenagoa Dispatch Fee</span>
                    <span className="font-serif">₦{order.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-medium">
                    <span>Promo Applied ({order.discountCode})</span>
                    <span className="font-serif">-₦{order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-brand-green pt-2 border-t border-slate-100">
                  <span>Total Paid (Online)</span>
                  <span className="font-serif text-brand-orange text-base">₦{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Coordinates info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-slate-100 bg-white rounded-2xl p-4 flex gap-3">
              <MapPin className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-green uppercase tracking-wider">
                  {order.deliveryType === DeliveryType.DELIVERY ? "Delivery Destination" : "Pickup Location"}
                </h4>
                <p className="text-xs text-gray-500 mt-1.5 leading-normal">
                  {order.address}
                </p>
              </div>
            </div>

            <div className="border border-slate-100 bg-white rounded-2xl p-4 flex gap-3">
              <Phone className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-green uppercase tracking-wider">Recipient Details</h4>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-semibold text-brand-green">
                  {order.customerName}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {order.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Loyalty Points Earned / Celebration section */}
          {order.status === OrderStatus.DELIVERED && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 text-center relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 h-16 w-16 bg-brand-gold/10 rounded-bl-full pointer-events-none" />
              <Sparkles className="h-7 w-7 text-brand-gold mx-auto animate-bounce shrink-0" />
              <h3 className="font-serif text-base font-bold text-brand-green mt-1">Loyalty Points Claimed! 🎉</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed mt-1 font-medium">
                Success! This completed order has earned you <span className="font-bold text-brand-orange text-sm">{Math.floor(order.subtotal / 100)}</span> Loyalty Points!
              </p>
              {totalPoints !== null && (
                <div className="inline-flex items-center space-x-1.5 bg-white border border-emerald-100 rounded-full px-3.5 py-1.5 text-xs font-bold text-brand-green shadow-sm mt-3">
                  <Sparkles className="h-3.5 w-3.5 text-brand-gold animate-pulse shrink-0" />
                  <span>Your Lifetime Balance:</span>
                  <span className="text-brand-orange">{totalPoints} points</span>
                </div>
              )}
            </div>
          )}

          {/* Professional Back-Office Kitchen Dispatch Utility */}
          <div className="p-4 bg-brand-green/[0.02] border border-brand-green/10 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
                </span>
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider font-mono">
                  Kitchen Dispatch Control
                </span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                Live Status Manager
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {[
                OrderStatus.RECEIVED,
                OrderStatus.PREPARING,
                order.deliveryType === DeliveryType.DELIVERY ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.READY,
                OrderStatus.DELIVERED
              ].map((statusOption) => {
                const isCurrent = order.status === statusOption;
                return (
                  <button
                    key={statusOption}
                    onClick={() => handleUpdateStatusSimulated(statusOption)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? "bg-brand-orange text-white shadow-md shadow-brand-orange/15 scale-105"
                        : "bg-white border border-slate-200 text-slate-500 hover:text-brand-orange hover:border-brand-orange/30 hover:bg-brand-orange/[0.02]"
                    }`}
                  >
                    {statusOption}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp sharing controls & close */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              id="btn-whatsapp-share"
              onClick={handleShareWhatsApp}
              className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-600/95 text-white font-bold py-3.5 text-xs transition active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span>Share Order to Kitchen (WhatsApp)</span>
            </button>

            <button
              id="btn-track-close"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white text-xs font-bold text-brand-green py-3.5 px-6 hover:bg-rose-50/40 transition cursor-pointer"
            >
              Order Again
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
