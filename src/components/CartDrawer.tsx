/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, MapPin, Tag, Phone, User, Mail, Sparkles, Clock, Award } from "lucide-react";
import { MenuItem, KitchenSettings, DeliveryType, Coupon } from "../types";

export interface CartItem {
  id: string; // unique item id (combines menu id + protein selection)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selectedProtein?: string;
  proteinExtraFee?: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  settings: KitchenSettings;
  coupons: Coupon[];
  loyaltyPoints?: number;
  onCheckout: (checkoutData: {
    customerName: string;
    phone: string;
    email: string;
    address: string;
    deliveryType: DeliveryType;
    couponCode?: string;
    discountAmount: number;
    pointsRedeemed?: number;
    loyaltyDiscount?: number;
    subtotal: number;
    deliveryFee: number;
    total: number;
  }) => void;
}

// Simulated Yenagoa neighborhood list with travel overhead estimates
const YENAGOA_NEIGHBORHOODS = [
  { name: "Amarata, Yenagoa", estTime: "25-35 mins" },
  { name: "Biogbolo, Yenagoa", estTime: "20-30 mins" },
  { name: "Ekeki, Yenagoa", estTime: "15-25 mins" },
  { name: "Tombia Road, Yenagoa", estTime: "30-40 mins" },
  { name: "Yenizue-Gene, Yenagoa", estTime: "25-35 mins" },
  { name: "Azikoro, Yenagoa", estTime: "35-45 mins" },
  { name: "Etegwe, Yenagoa", estTime: "20-30 mins" },
  { name: "Mbiama-Yenagoa Expressway", estTime: "30-40 mins" },
  { name: "Bayelsa State Secretariat Area", estTime: "25-35 mins" }
];

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  settings,
  coupons,
  loyaltyPoints = 0,
  onCheckout,
}: CartDrawerProps) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.DELIVERY);
  const [couponCode, setCouponCode] = useState<string>("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>("");
  const [couponSuccess, setCouponSuccess] = useState<string>("");

  // Loyalty Points Redemption states
  const [isLoyaltyApplied, setIsLoyaltyApplied] = useState<boolean>(false);
  const [redeemedPointsInput, setRedeemedPointsInput] = useState<number>(1000);

  // Customer details
  const [customerName, setCustomerName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [showAddressDropdown, setShowAddressDropdown] = useState<boolean>(false);
  const [estDeliveryTime, setEstDeliveryTime] = useState<string>("30-40 mins");

  // Error validations
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("punique_customer_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.email) setEmail(parsed.email || "");
          if (parsed.address) setAddress(parsed.address || "");
        }
      }
    } catch (e) {
      console.error("Failed to auto-fill customer session in CartDrawer", e);
    }
  }, []);

  if (!isOpen) return null;

  // Calculators
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.price + (item.proteinExtraFee || 0)) * item.quantity,
    0
  );

  const deliveryFee = deliveryType === DeliveryType.DELIVERY ? settings.deliveryFee : 0;
  
  const discountAmount = activeCoupon
    ? Math.round((subtotal * activeCoupon.discountPercent) / 100)
    : 0;

  const cashBeforeLoyalty = subtotal + deliveryFee - discountAmount;
  const maxPointsRedeemable = Math.min(loyaltyPoints, cashBeforeLoyalty);

  const pointsApplied = isLoyaltyApplied && loyaltyPoints >= 1000
    ? Math.max(0, Math.min(redeemedPointsInput, maxPointsRedeemable))
    : 0;

  const loyaltyDiscount = pointsApplied; // 1 point = 1 Naira
  const total = Math.max(0, cashBeforeLoyalty - loyaltyDiscount);

  // Verify coupon code
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    
    if (!couponCode) {
      setCouponError("Please enter a code");
      return;
    }

    const matched = coupons.find(
      (c) => c.code.toLowerCase() === couponCode.trim().toLowerCase()
    );

    if (!matched) {
      setCouponError("Invalid coupon code");
      setActiveCoupon(null);
    } else if (!matched.isActive || matched.usesCount >= matched.maxUses) {
      setCouponError("This coupon has expired or reached max uses");
      setActiveCoupon(null);
    } else {
      setActiveCoupon(matched);
      setCouponSuccess(`Applied! ${matched.discountPercent}% discount code active.`);
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!customerName.trim()) errors.customerName = "Name is required";
    if (!phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!phone.startsWith("+234") && !phone.startsWith("0")) {
      errors.phone = "Enter a valid Nigerian phone number";
    }
    
    if (deliveryType === DeliveryType.DELIVERY && !address.trim()) {
      errors.address = "Delivery address is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onCheckout({
      customerName,
      phone,
      email,
      address: deliveryType === DeliveryType.DELIVERY ? address : "Punique Kitchen Pickup Outlet",
      deliveryType,
      couponCode: activeCoupon?.code,
      discountAmount,
      pointsRedeemed: pointsApplied,
      loyaltyDiscount: loyaltyDiscount,
      subtotal,
      deliveryFee,
      total,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      {/* Click outside background closes */}
      <div className="flex-1" onClick={onClose} />

      {/* Cart Container */}
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl border-l border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-brand-orange" />
            <h2 className="font-serif text-xl font-bold text-brand-green">Your Order</h2>
          </div>
          <button
            id="btn-close-cart"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-rose-50 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="h-16 w-16 rounded-full bg-rose-50 text-brand-orange flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-green">Your basket is empty</h3>
              <p className="text-xs text-gray-500 mt-2 max-w-xs leading-relaxed">
                Add smokey Jollof rice, signature sandviches, and premium Fisherman soup from our menu to start your order!
              </p>
              <button
                onClick={onClose}
                className="mt-6 rounded-xl bg-brand-orange px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orange/95 cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-brand-green uppercase tracking-wider mb-2">Selected Dishes</h3>
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => {
                    const itemUnitTotal = item.price + (item.proteinExtraFee || 0);
                    return (
                      <div key={item.id} className="py-3.5 flex gap-4 items-start">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-14 w-14 rounded-lg object-cover bg-slate-100 shadow-inner"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif text-sm font-black text-brand-orange truncate">{item.name}</h4>
                          {item.selectedProtein && (
                            <span className="inline-block mt-0.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-0.5 text-[10px] font-medium font-mono">
                              {item.selectedProtein.split(" (")[0]}
                            </span>
                          )}
                          <p className="text-xs font-serif font-extrabold text-brand-orange mt-1">
                            ₦{itemUnitTotal.toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col items-end justify-between h-14">
                          <button
                            id={`btn-remove-${item.id}`}
                            onClick={() => onRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="flex items-center space-x-2 border border-slate-200 bg-white rounded-lg p-0.5">
                            <button
                              id={`btn-dec-${item.id}`}
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="h-5 w-5 flex items-center justify-center rounded text-gray-500 hover:bg-rose-50 cursor-pointer"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-bold text-brand-green px-1 w-4 text-center">{item.quantity}</span>
                            <button
                              id={`btn-inc-${item.id}`}
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="h-5 w-5 flex items-center justify-center rounded text-gray-500 hover:bg-rose-50 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery or Pickup Toggle */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-brand-green uppercase tracking-wider">Service Type</h3>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 border border-slate-200 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDeliveryType(DeliveryType.DELIVERY)}
                    className={`rounded-lg py-2.5 text-xs font-bold transition cursor-pointer ${
                      deliveryType === DeliveryType.DELIVERY
                        ? "bg-brand-orange text-white shadow-sm"
                        : "text-brand-green hover:bg-rose-50/60"
                    }`}
                  >
                    Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType(DeliveryType.PICKUP)}
                    className={`rounded-lg py-2.5 text-xs font-bold transition cursor-pointer ${
                      deliveryType === DeliveryType.PICKUP
                        ? "bg-brand-orange text-white shadow-sm"
                        : "text-brand-green hover:bg-rose-50/60"
                    }`}
                  >
                    Pickup at Kitchen
                  </button>
                </div>
              </div>

              {/* Address Form */}
              {deliveryType === DeliveryType.DELIVERY && (
                <div className="space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-brand-green uppercase tracking-wider">
                      Yenagoa Delivery Neighborhood
                    </label>
                    <span className="flex items-center text-[10px] text-brand-orange font-bold font-mono">
                      <Clock className="h-3 w-3 mr-1" />
                      {estDeliveryTime}
                    </span>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-orange" />
                    <input
                      id="cart-address-input"
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setShowAddressDropdown(true);
                      }}
                      onFocus={() => setShowAddressDropdown(true)}
                      placeholder="Start typing your street, compound or district..."
                      className={`w-full rounded-xl border ${
                        formErrors.address ? "border-red-400" : "border-slate-200"
                      } bg-white pl-10 pr-4 py-3.5 text-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange`}
                    />
                    {formErrors.address && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.address}</p>
                    )}

                    {/* Neighborhood Dropdown Autocomplete simulator */}
                    {showAddressDropdown && (
                      <div className="absolute top-13 left-0 right-0 z-30 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 font-semibold px-4 py-2 bg-slate-50 border-b border-slate-100">
                          Popular Bayelsa Districts
                        </p>
                        {YENAGOA_NEIGHBORHOODS.map((item) => (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              setAddress(item.name);
                              setEstDeliveryTime(item.estTime);
                              setShowAddressDropdown(false);
                            }}
                            className="w-full text-left text-xs text-gray-700 hover:bg-rose-50/30 px-4 py-2.5 border-b border-slate-100 flex justify-between items-center"
                          >
                            <span className="font-medium">{item.name}</span>
                            <span className="text-[10px] font-mono text-gray-400">{item.estTime}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="text-xs font-bold text-brand-green uppercase tracking-wider block">Promo Code</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-orange" />
                    <input
                      id="cart-coupon-input"
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. PUNIQUE10, YENAGOA20"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3.5 text-xs uppercase focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange font-bold font-mono"
                    />
                  </div>
                  <button
                    id="btn-apply-coupon"
                    type="submit"
                    className="rounded-xl bg-brand-green hover:bg-brand-green/95 text-white font-bold px-4 text-xs shadow-sm transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-semibold mt-1">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-green-600 font-semibold mt-1">{couponSuccess}</p>}
              </form>

              {/* Loyalty Points Reward Section */}
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-100 p-4 space-y-3.5 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className={`h-5 w-5 ${loyaltyPoints >= 1000 ? 'text-brand-gold animate-bounce' : 'text-slate-400'}`} style={{ animationDuration: '3s' }} />
                    <h4 className="font-serif text-sm font-bold text-brand-green">Punique Club Rewards</h4>
                  </div>
                  <span className="font-mono text-xs font-black text-brand-orange bg-brand-orange/5 px-2.5 py-1 rounded-xl">
                    {loyaltyPoints.toLocaleString()} PTS
                  </span>
                </div>

                {loyaltyPoints < 1000 ? (
                  <div className="text-[11px] text-slate-500 bg-white/70 rounded-xl p-2.5 border border-slate-100 leading-relaxed font-medium">
                    <span className="text-slate-400 font-bold">🔒 Locked:</span> Once you reach <strong className="text-brand-green">1,000 points</strong>, you can use them to buy delicious food! 1,000 points is equivalent to ₦1,000 Naira discount.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      🎉 <strong>You qualify!</strong> You have reached the 1,000 points milestone. You can now use your loyalty points to pay for this order (1 pt = ₦1).
                    </p>

                    <label className="flex items-center space-x-3.5 cursor-pointer bg-white rounded-xl border border-emerald-100 p-3 shadow-xs hover:border-emerald-300 transition select-none">
                      <input
                        type="checkbox"
                        checked={isLoyaltyApplied}
                        onChange={(e) => {
                          setIsLoyaltyApplied(e.target.checked);
                          if (e.target.checked) {
                            setRedeemedPointsInput(maxPointsRedeemable);
                          }
                        }}
                        className="h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-700 block">Apply Loyalty Points</span>
                        <span className="text-[10px] text-slate-400 font-semibold font-mono">1 Point = ₦1 Naira discount</span>
                      </div>
                    </label>

                    {isLoyaltyApplied && (
                      <div className="space-y-2.5 bg-white rounded-xl border border-slate-100 p-3.5 animate-fadeIn">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-600">Points to redeem:</span>
                          <span className="font-mono text-sm font-extrabold text-brand-green">{pointsApplied.toLocaleString()} pts</span>
                        </div>

                        {/* Slider Control */}
                        <div className="space-y-1">
                          <input
                            type="range"
                            min="1"
                            max={maxPointsRedeemable}
                            value={redeemedPointsInput}
                            onChange={(e) => setRedeemedPointsInput(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                            <span>1 pt</span>
                            <span>Max: {maxPointsRedeemable.toLocaleString()} pts</span>
                          </div>
                        </div>

                        {/* Quick Presets Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRedeemedPointsInput(Math.min(1000, maxPointsRedeemable))}
                            className="rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-bold py-1.5 px-2.5 border border-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            Redeem 1k Pts
                          </button>
                          {maxPointsRedeemable >= 2000 && (
                            <button
                              type="button"
                              onClick={() => setRedeemedPointsInput(Math.min(2000, maxPointsRedeemable))}
                              className="rounded-lg bg-slate-50 hover:bg-slate-100 text-[10px] font-bold py-1.5 px-2.5 border border-slate-200 text-slate-700 transition cursor-pointer"
                            >
                              Redeem 2k Pts
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRedeemedPointsInput(maxPointsRedeemable)}
                            className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold py-1.5 px-2.5 border border-emerald-200 text-emerald-800 transition cursor-pointer"
                          >
                            Redeem Max
                          </button>
                        </div>

                        <div className="text-[10px] text-emerald-700 bg-emerald-50 rounded-lg p-2 font-bold flex justify-between">
                          <span>₦{pointsApplied.toLocaleString()} discount applied!</span>
                          <span className="font-mono text-slate-400">Bal after: {(loyaltyPoints - pointsApplied).toLocaleString()} pts</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Checkout Details */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 pt-4 border-t border-slate-100 mt-4">
                <h3 className="text-xs font-bold text-brand-green uppercase tracking-wider mb-2">Recipient Details</h3>
                
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-orange" />
                    <input
                      id="recipient-name-input"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Full Name"
                      className={`w-full rounded-xl border ${
                        formErrors.customerName ? "border-red-400" : "border-slate-200"
                      } bg-white pl-10 pr-4 py-3 text-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange`}
                    />
                    {formErrors.customerName && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.customerName}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-orange" />
                    <input
                      id="recipient-phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="WhatsApp Phone Number (e.g., 08030001122)"
                      className={`w-full rounded-xl border ${
                        formErrors.phone ? "border-red-400" : "border-slate-200"
                      } bg-white pl-10 pr-4 py-3 text-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange`}
                    />
                    {formErrors.phone && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-brand-orange" />
                    <input
                      id="recipient-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address (Optional)"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-xs focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
                    />
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="pt-4 space-y-2 border-t border-dashed border-slate-200 mt-6">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-serif">₦{subtotal.toLocaleString()}</span>
                  </div>
                  {deliveryType === DeliveryType.DELIVERY && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Yenagoa Dispatch Fee</span>
                      <span className="font-serif">₦{deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  {activeCoupon && (
                    <div className="flex justify-between text-xs text-green-600 font-medium">
                      <span>Promo Discount ({activeCoupon.discountPercent}%)</span>
                      <span className="font-serif">-₦{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Loyalty Reward Discount ({pointsApplied.toLocaleString()} pts)</span>
                      <span className="font-serif">-₦{loyaltyDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-brand-green pt-2 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span className="font-serif text-brand-orange text-lg">₦{total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  id="btn-checkout-submit"
                  type="submit"
                  className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-xs tracking-wider uppercase mt-4 shadow-lg shadow-red-600/20 transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{total === 0 ? "Place Loyalty Order 🎁 (Free)" : "Secure Online Checkout"}</span>
                </button>

                {subtotal > 0 && (
                  <div className="mt-3.5 bg-brand-orange/5 border border-brand-orange/15 rounded-xl px-3 py-2.5 text-[11px] font-medium text-brand-orange flex items-center justify-center space-x-1.5 animate-fadeIn">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-gold shrink-0" />
                    <span>You'll earn <strong className="font-extrabold">{Math.floor(subtotal / 100)}</strong> Loyalty Points from this delicious order!</span>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
