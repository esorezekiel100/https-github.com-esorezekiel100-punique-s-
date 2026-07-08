/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Sparkles, UtensilsCrossed, Calendar, Award, Phone, Heart, MapPin, Clock, ArrowUp, MessageSquare } from "lucide-react";
import Navbar from "./components/Navbar";
import MenuSection from "./components/MenuSection";
import CartDrawer, { CartItem } from "./components/CartDrawer";
import PaystackModal from "./components/PaystackModal";
import OrderTracker from "./components/OrderTracker";
import OrderHistory from "./components/OrderHistory";
import Reviews from "./components/Reviews";
import { MenuItem, Category, Order, Coupon, KitchenSettings } from "./types";

export default function App() {
  // Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<KitchenSettings>({
    deliveryFee: 800,
    isOpen: true,
    openingTime: "08:00",
    closingTime: "21:30",
    kitchenPhone: "+2348083163956", // Updated phone to requested 08083163956
    closingDays: ["Sunday"]
  });
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Cart & Checkout States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [showPaystack, setShowPaystack] = useState<boolean>(false);
  const [checkoutPayload, setCheckoutPayload] = useState<any | null>(null);

  // Active Order Tracking State
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Load Storefront Data
  const loadStoreData = async () => {
    try {
      const menuRes = await fetch("/api/menu");
      const menuData = await menuRes.json();
      setMenuItems(menuData.menuItems || []);
      setCategories(menuData.categories || []);

      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      // Ensure settings retains the correct WhatsApp phone number
      setSettings({
        ...settingsData,
        kitchenPhone: "+2348083163956"
      });

      const couponsRes = await fetch("/api/coupons");
      const couponsData = await couponsRes.json();
      setCoupons(couponsData);
    } catch (err) {
      console.error("Failed to load storefront metrics", err);
    }
  };

  useEffect(() => {
    loadStoreData();
    // Poll order status every 10 seconds for real-time order tracking feel
    const interval = setInterval(() => {
      if (activeOrder && activeOrder.status !== "Delivered") {
        fetch("/api/orders")
          .then(res => res.json())
          .then((orders: Order[]) => {
            const updated = orders.find(o => o.id === activeOrder.id);
            if (updated) {
              setActiveOrder(updated);
            }
          })
          .catch(err => console.error("Error polling tracking status", err));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [activeOrder]);

  // Handle adding an item to the cart
  const handleAddToCart = (item: MenuItem, selectedProtein?: string, proteinExtraFee?: number) => {
    // Unique ID combining item and protein choice to distinguish them in the cart
    const cartId = selectedProtein ? `${item.id}-${selectedProtein}` : item.id;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === cartId);
      if (existing) {
        return prev.map((i) =>
          i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: cartId,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl,
          selectedProtein,
          proteinExtraFee,
        },
      ];
    });

    // Automatically open the cart drawer when adding an item for optimal user flow
    setIsCartOpen(true);
  };

  // Modify quantity inside cart drawer
  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  // Remove single item completely from cart drawer
  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Triggered when Checkout form submits and initiates Paystack payment
  const handleCheckoutInitiate = (data: any) => {
    setCheckoutPayload(data);
    setIsCartOpen(false);
    setShowPaystack(true);
  };

  // Triggered on Paystack authorization success
  const handlePaymentSuccess = async (ref: string) => {
    if (!checkoutPayload) return;
    
    // Assemble final order post object
    const finalOrder = {
      customerName: checkoutPayload.customerName,
      phone: checkoutPayload.phone,
      email: checkoutPayload.email || `${checkoutPayload.customerName.toLowerCase().replace(/\s/g, "")}@puniquekitchen.com`,
      address: checkoutPayload.address,
      deliveryType: checkoutPayload.deliveryType,
      items: cartItems.map(it => ({
        menuItemId: it.menuItemId,
        name: it.name,
        quantity: it.quantity,
        priceAtTime: it.price,
        selectedProtein: it.selectedProtein,
        proteinExtraFee: it.proteinExtraFee
      })),
      subtotal: checkoutPayload.subtotal,
      deliveryFee: checkoutPayload.deliveryFee,
      discountAmount: checkoutPayload.discountAmount,
      discountCode: checkoutPayload.couponCode,
      total: checkoutPayload.total
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalOrder)
      });
      
      if (res.ok) {
        const orderCreated = await res.json();
        
        // Save session details to local storage
        try {
          const newSession = {
            customerName: checkoutPayload.customerName,
            phone: checkoutPayload.phone,
            email: checkoutPayload.email || "",
            address: checkoutPayload.address || ""
          };
          localStorage.setItem("punique_customer_session", JSON.stringify(newSession));
        } catch (e) {
          console.error("Failed to store customer session in localStorage", e);
        }

        // Clear cart
        setCartItems([]);
        setCheckoutPayload(null);
        setShowPaystack(false);
        // Put customer on tracking screen
        setActiveOrder(orderCreated);
      }
    } catch (err) {
      console.error("Failed to persist order to database", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-brand-orange selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* 2. Main Area Routing */}
      <main className="flex-1">
        {activeOrder ? (
          /* CUSTOMER TRACKING SCREEN */
          <div className="py-6">
            <OrderTracker
              order={activeOrder}
              kitchenPhone={settings.kitchenPhone}
              onClose={() => {
                setActiveOrder(null);
                loadStoreData();
              }}
            />
          </div>
        ) : (
          /* CUSTOMER STOREFRONT */
          <div>
            
            {/* HERO SECTION WITH AFRICAN INSPIRED AESTHETIC */}
            <section className="relative overflow-hidden bg-brand-green text-white py-12 sm:py-20 px-4">
              {/* Decorative Geometric Accents */}
              <div className="absolute inset-0 bg-[radial-gradient(#E21B5A_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-10 pointer-events-none" />
              
              <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-10 sm:gap-12 relative z-10 px-4 sm:px-6">
                {/* Brand Messaging */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4.5 py-1.5 border border-white/15">
                    <Sparkles className="h-4 w-4 text-brand-orange animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-brand-gold uppercase font-mono">
                      Delta Premium Culinary Experience
                    </span>
                  </div>

                  <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-[#FFF9F0]">
                    PUNIQUE <span className="text-brand-orange">KITCHEN</span>
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                    It's not just about food – it's about the joy, comfort, and satisfaction that comes with every delicious bite. When people eat well, they feel good, and that happiness spreads to families, friends, and communities. PUNIQUE KITCHEN exists to make that happen – one warm, tasty meal at a time, delivered right to your doorstep in Yenagoa.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                    <a
                      href="#menu-search-input"
                      className="rounded-2xl bg-brand-orange hover:bg-brand-orange/95 text-white font-bold py-4 px-8 text-xs uppercase tracking-wider transition shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/30 active:scale-95 text-center"
                    >
                      Browse Our Menu
                    </a>
                    <a
                      href={`https://wa.me/${settings.kitchenPhone.replace(/\+/g, "").trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2.5 text-xs text-slate-300 hover:text-white font-semibold py-3 sm:py-0 transition"
                    >
                      <Phone className="h-4 w-4 text-brand-orange" />
                      <span>WhatsApp support: <span className="text-brand-orange font-bold font-mono hover:underline">{settings.kitchenPhone}</span></span>
                    </a>
                  </div>
                </div>

                {/* Hero Dish Visual Grid */}
                <div className="flex-1 w-full max-w-md lg:max-w-none relative aspect-square sm:aspect-video lg:aspect-square shrink-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                  <img
                    src="https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&q=80&w=700"
                    alt="Smokey Jollof Rice"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span className="text-[10px] font-bold tracking-widest text-brand-orange uppercase font-mono">Featured Specialty</span>
                    <h3 className="font-serif text-lg font-bold text-[#FFF9F0] mt-1">Smokey Firewood Party Jollof</h3>
                    <p className="text-xs text-slate-300 mt-1">Fragrant long-grain rice layered with peppered broth, deep local spices.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* VALUE PROPOSITION GRID */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start space-x-4">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl text-brand-orange flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-green">Traditional Pride</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Every soup, sauce, and rice dish is cooked using age-old delta recipes and fresh native ingredients.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start space-x-4">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl text-brand-orange flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-green">Rapid Dispatch</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Equipped with designated dispatch riders to deliver piping-hot meals across Yenagoa in minutes.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-start space-x-4">
                  <div className="h-10 w-10 bg-rose-50 rounded-xl text-brand-orange flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-green">Clean & Certified</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-normal">
                      Maintained with immaculate sanitary kitchen standards to ensure premium health and quality in every box.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ANNOUNCEMENT BANNER */}
            <section className="bg-brand-orange text-white py-3.5 text-center px-4 overflow-hidden relative">
              <div className="flex items-center justify-center space-x-2 animate-pulse text-xs font-semibold uppercase tracking-wider font-mono">
                <span>🔥 SPECIAL PROMO CODE ACTIVE: Use code <span className="font-bold text-brand-green bg-white rounded px-1.5 py-0.5 ml-1 mr-1">PUNIQUE10</span> for 10% off your basket!</span>
              </div>
            </section>

            {/* DYNAMIC MENU & CATEGORIES GRID */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
              <MenuSection
                menuItems={menuItems}
                categories={categories}
                onAddToCart={handleAddToCart}
              />
            </section>

            {/* CUSTOMER REVIEWS & RATINGS */}
            <Reviews menuItems={menuItems} />

          </div>
        )}
      </main>

      {/* 3. Sliding Shopping Cart Drawer Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        settings={settings}
        coupons={coupons}
        onCheckout={handleCheckoutInitiate}
      />

      {/* 3b. Order History & Live Tracking Drawer */}
      <OrderHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        menuItems={menuItems}
        onAddToCart={handleAddToCart}
        onSelectActiveOrder={(order) => setActiveOrder(order)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 4. Paystack Gateway Emulator Modal */}
      <PaystackModal
        isOpen={showPaystack}
        onClose={() => setShowPaystack(false)}
        onSuccess={handlePaymentSuccess}
        email={checkoutPayload?.email || ""}
        totalAmount={checkoutPayload?.total || 0}
      />

      {/* 5. Cozy, Friendly & Smooth Footer */}
      <footer className="relative bg-gradient-to-b from-[#FAF6F0] to-[#F3EDE3] border-t border-brand-green/10 mt-16 overflow-hidden">
        {/* Subtle decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange via-brand-gold to-brand-green" />

        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12 lg:gap-16 pb-12 border-b border-brand-green/5">
            
            {/* Column 1: Our Kitchen Story & Vibe */}
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white shadow-lg shadow-brand-orange/20">
                  <span className="font-serif text-xl font-bold">P</span>
                </div>
                <span className="font-serif text-brand-green text-lg font-bold">
                  PUNIQUE <span className="text-brand-orange">KITCHEN</span>
                </span>
              </div>
              
              <p className="font-serif text-sm italic text-brand-orange font-medium">
                "Good meal equal happy bellies"
              </p>
              
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                From our family fireplace to your table, we prepare every dish with local firewood, pure culinary respect, and love. Bringing authentic native soups and Smokey Jollof right to your doorstep in Yenagoa!
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
                <span className="inline-flex items-center text-[9px] font-bold text-brand-green bg-white/60 border border-brand-green/5 rounded-full px-2.5 py-1">
                  🔥 Firewood Touch
                </span>
                <span className="inline-flex items-center text-[9px] font-bold text-brand-green bg-white/60 border border-brand-green/5 rounded-full px-2.5 py-1">
                  🦀 Fresh Seafood
                </span>
                <span className="inline-flex items-center text-[9px] font-bold text-brand-green bg-white/60 border border-brand-green/5 rounded-full px-2.5 py-1">
                  ⚡ Express Rider
                </span>
              </div>
            </div>

            {/* Column 2: Quick Delivery Neighborhoods */}
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 text-brand-green">
                <MapPin className="h-5 w-5 text-brand-orange shrink-0" />
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider">Yenagoa Delivery Zones</h4>
              </div>
              
              <p className="text-xs text-slate-500 leading-normal">
                Piping hot food dispatched instantly from our hub to any of these neighborhoods in Bayelsa:
              </p>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="text-[11px] font-medium text-slate-600 bg-white/40 rounded-lg p-2 hover:bg-white/70 transition">
                  📍 Amarata
                </div>
                <div className="text-[11px] font-medium text-slate-600 bg-white/40 rounded-lg p-2 hover:bg-white/70 transition">
                  📍 Ekeki
                </div>
                <div className="text-[11px] font-medium text-slate-600 bg-white/40 rounded-lg p-2 hover:bg-white/70 transition">
                  📍 Biogbolo
                </div>
                <div className="text-[11px] font-medium text-slate-600 bg-white/40 rounded-lg p-2 hover:bg-white/70 transition">
                  📍 Tombia Road
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start space-x-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/60 rounded-xl px-3 py-1.5 font-bold w-fit mx-auto md:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Riders on Standby: 15-35 mins Delivery!</span>
              </div>
            </div>

            {/* Column 3: Contact, Hours & Support */}
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 text-brand-green">
                <Clock className="h-5 w-5 text-brand-orange shrink-0" />
                <h4 className="font-serif text-sm font-bold uppercase tracking-wider">Kitchen Hours</h4>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold flex items-center justify-center md:justify-start gap-1.5 text-brand-green">
                  <span>Monday – Saturday:</span>
                  <span className="text-brand-orange font-mono">08:00 AM – 09:30 PM</span>
                </p>
                <p className="text-slate-400 font-medium">Sunday: Closed (Resting & Soup preparation)</p>
              </div>

              <div className="pt-2">
                <a
                  href={`https://wa.me/${settings.kitchenPhone.replace(/\+/g, "").trim()}?text=Hello%20Punique%20Kitchen%2C%20I%20would%20like%20to%20make%20an%20inquiry%20about%20my%20food!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center space-x-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3.5 px-6 text-xs uppercase tracking-wider transition shadow-lg shadow-green-600/10 hover:shadow-green-600/20 active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4 fill-white" />
                  <span>Chat With Chef on WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Copyright, Heart & Smooth Scroll to Top */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium gap-6">
            <p className="font-mono text-[10px] text-center sm:text-left">
              &copy; {new Date().getFullYear()} Punique Kitchen Ltd. All rights reserved.
            </p>

            <div className="flex items-center space-x-1.5 text-brand-green font-bold">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-[#E11D48] fill-[#E11D48] animate-pulse" />
              <span>for Yenagoa, Bayelsa State</span>
            </div>

            <button
              id="btn-scroll-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-brand-orange/10 border border-slate-200/50 hover:border-brand-orange/20 text-slate-600 hover:text-brand-orange transition cursor-pointer text-[10px] uppercase font-bold"
              title="Back to Top"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
