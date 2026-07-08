/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, Clock, MapPin, MessageSquare, Phone, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { Order, OrderStatus, DeliveryType } from "../types";

interface OrderTrackerProps {
  order: Order | null;
  onClose: () => void;
  kitchenPhone: string;
}

export default function OrderTracker({
  order,
  onClose,
  kitchenPhone,
}: OrderTrackerProps) {
  if (!order) return null;

  const steps = [
    { label: "Received", status: OrderStatus.RECEIVED, description: "We have received your order", icon: Clock },
    { label: "Preparing", status: OrderStatus.PREPARING, description: "Chef is prepping your fresh meal", icon: Sparkles },
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
