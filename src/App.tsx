/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { Sparkles, UtensilsCrossed, Calendar, Award, Phone, MapPin, Clock, ArrowUp, MessageSquare, Bell, Leaf, Heart, Crown, ChefHat } from "lucide-react";
import Navbar from "./components/Navbar";
import MenuSection from "./components/MenuSection";
import CartDrawer, { CartItem } from "./components/CartDrawer";
import PaystackModal from "./components/PaystackModal";
import OrderTracker from "./components/OrderTracker";
import OrderHistory from "./components/OrderHistory";
import Reviews from "./components/Reviews";
import { MenuItem, Category, Order, Coupon, KitchenSettings, OrderStatus, AdminNotification } from "./types";
import { fallbackCategories, fallbackMenuItems, fallbackCoupons, fallbackSettings } from "./db/fallbackData";

const HERO_DISHES = [
  {
    name: "Bayelsa Native Seafood Okra",
    tagline: "Good meal equal happy bellies! 🦀",
    description: "Slimy rich okra broth loaded with fresh periwinkles, baby crabs, prawns, stockfish, and local seafood spices.",
    price: 2800,
    imageUrl: "/assets/images/bayelsa_seafood_okra_1783865739908.jpg",
  },
  {
    name: "Smokey Jollof Rice",
    tagline: "Authentic local flavor! 🔥",
    description: "Authentic, party-style Nigerian Jollof rice cooked over high heat to achieve that distinct local smokey firewood aroma.",
    price: 1800,
    imageUrl: "/assets/images/smokey_jollof_rice_1783865479007.jpg",
  },
  {
    name: "Special Asun Rice",
    tagline: "Spicy charcoal-grilled goodness! 🐐",
    description: "Spiced Jollof rice tossed with chunks of fiery peppered charcoal-grilled goat meat (Asun), bell peppers, and raw onions.",
    price: 2200,
    imageUrl: "/assets/images/special_asun_rice_1783865130355.jpg",
  }
];

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

  // Loyalty Points State
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);

  // Admin Notifications & Live Alerts States
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevNotificationsRef = useRef<string[]>([]);

  // Check if we are in admin mode via URL query parameters or hash
  const isAdmin = typeof window !== "undefined" && (window.location.search.includes("admin=true") || window.location.hash.includes("admin"));

  // Fetch admin notifications from the server
  const fetchAdminNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setAdminNotifications(data);
      }
    } catch (e) {
      console.error("Failed to fetch admin notifications", e);
    }
  };

  // Mark all notifications as read
  const handleReadAllNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications/read-all", { method: "POST" });
      if (res.ok) {
        fetchAdminNotifications();
      }
    } catch (e) {
      console.error("Failed to read all admin notifications", e);
    }
  };

  // Clear all notifications
  const handleClearNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications/clear", { method: "POST" });
      if (res.ok) {
        fetchAdminNotifications();
      }
    } catch (e) {
      console.error("Failed to clear admin notifications", e);
    }
  };

  // Select an order from a notification click to show its tracker
  const handleSelectOrderId = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const allOrders = await res.json();
        const found = allOrders.find((o: any) => o.id === orderId);
        if (found) {
          setActiveOrder(found);
          // Scroll to the active order container if needed
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }
      
      // Fallback: search local orders history
      const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
      const localOrders = JSON.parse(localOrdersStr);
      const localFound = localOrders.find((o: any) => o.id === orderId);
      if (localFound) {
        setActiveOrder(localFound);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error("Failed to select order from notification click", e);
    }
  };

  const recalculateLoyaltyPoints = () => {
    try {
      const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
      const localOrders = JSON.parse(localOrdersStr);
      
      let bonusPoints = 0;
      const storedBonus = localStorage.getItem("punique_bonus_points");
      if (storedBonus === null) {
        // Start from zero point by default as requested
        localStorage.setItem("punique_bonus_points", "0");
        bonusPoints = 0;
      } else {
        bonusPoints = parseInt(storedBonus, 10) || 0;
      }

      let orderPoints = 0;
      let redeemedPoints = 0;
      
      if (Array.isArray(localOrders)) {
        // Compute points earned: 1 point per ₦100 of subtotal spent (matching UI indicators)
        orderPoints = localOrders.reduce((sum, o: any) => {
          return sum + Math.max(0, Math.floor((o.subtotal || 0) / 100));
        }, 0);
        
        // Sum of all points redeemed across previous orders
        redeemedPoints = localOrders.reduce((sum, o: any) => sum + (o.pointsRedeemed || 0), 0);
      }

      const netPoints = Math.max(0, bonusPoints + orderPoints - redeemedPoints);
      setLoyaltyPoints(netPoints);
      localStorage.setItem("punique_loyalty_points", netPoints.toString());
    } catch (e) {
      console.error("Failed to parse local orders for loyalty points", e);
    }
  };

  // Hero section active index
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);

  // Load Storefront Data
  const loadStoreData = async () => {
    try {
      let menuItemsLoaded = false;
      let categoriesLoaded = false;
      let settingsLoaded = false;
      let couponsLoaded = false;

      // 1. Fetch Menu
      try {
        const menuRes = await fetch("/api/menu");
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          if (menuData && Array.isArray(menuData.menuItems) && menuData.menuItems.length > 0) {
            setMenuItems(menuData.menuItems);
            menuItemsLoaded = true;
          }
          if (menuData && Array.isArray(menuData.categories) && menuData.categories.length > 0) {
            setCategories(menuData.categories);
            categoriesLoaded = true;
          }
        }
      } catch (e) {
        console.warn("API menu loading failed, using static fallback", e);
      }

      // 2. Fetch Settings
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData && settingsData.kitchenPhone) {
            setSettings({
              ...settingsData,
              kitchenPhone: "+2348083163956"
            });
            settingsLoaded = true;
          }
        }
      } catch (e) {
        console.warn("API settings loading failed, using static fallback", e);
      }

      // 3. Fetch Coupons
      try {
        const couponsRes = await fetch("/api/coupons");
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          if (Array.isArray(couponsData) && couponsData.length > 0) {
            setCoupons(couponsData);
            couponsLoaded = true;
          }
        }
      } catch (e) {
        console.warn("API coupons loading failed, using static fallback", e);
      }

      // Apply static fallbacks if APIs failed to load proper data
      if (!menuItemsLoaded) {
        setMenuItems(fallbackMenuItems);
      }
      if (!categoriesLoaded) {
        setCategories(fallbackCategories);
      }
      if (!settingsLoaded) {
        setSettings(fallbackSettings);
      }
      if (!couponsLoaded) {
        setCoupons(fallbackCoupons);
      }
    } catch (err) {
      console.error("Failed to load storefront metrics, applying all static fallbacks", err);
      setMenuItems(fallbackMenuItems);
      setCategories(fallbackCategories);
      setSettings(fallbackSettings);
      setCoupons(fallbackCoupons);
    }
  };

  // Synchronize and detect new notifications for live toast alerts
  useEffect(() => {
    if (adminNotifications.length > 0) {
      const prevIds = prevNotificationsRef.current;
      const currentIds = adminNotifications.map((n) => n.id);

      // Find notifications in current that were not in prev
      const newNotifs = adminNotifications.filter((n) => !prevIds.includes(n.id));

      if (prevIds.length > 0 && newNotifs.length > 0) {
        // We have a new notification! Trigger the live alert toast
        const latestNew = newNotifs[0];
        setToastMessage(latestNew.message);
      }

      prevNotificationsRef.current = currentIds;
    } else {
      prevNotificationsRef.current = [];
    }
  }, [adminNotifications]);

  useEffect(() => {
    loadStoreData();
    recalculateLoyaltyPoints();
    fetchAdminNotifications();

    // Poll order status and admin notifications every 10 seconds
    const interval = setInterval(() => {
      fetchAdminNotifications();

      if (activeOrder && activeOrder.status !== "Delivered") {
        if (activeOrder.id.startsWith("ORD-LOCAL-")) {
          // Auto-advance simulated status for demonstration / static mode
          const statusOrder = ["Received", "Preparing", activeOrder.deliveryType === "Delivery" ? "Out for Delivery" : "Ready for Pickup", "Delivered"];
          const currentIndex = statusOrder.indexOf(activeOrder.status);
          if (currentIndex !== -1 && currentIndex < statusOrder.length - 1) {
            const nextStatus = statusOrder[currentIndex + 1];
            const updatedOrder = {
              ...activeOrder,
              status: nextStatus as any
            };
            setActiveOrder(updatedOrder);

            // Update in local history too
            try {
              const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
              const localOrders: Order[] = JSON.parse(localOrdersStr);
              const mapped = localOrders.map(o => o.id === activeOrder.id ? updatedOrder : o);
              localStorage.setItem("punique_local_orders", JSON.stringify(mapped));
            } catch (e) {
              console.error("Failed to update local history in simulation", e);
            }
          }
        } else {
          // Regular real-time polling
          fetch("/api/orders")
            .then(res => res.json())
            .then((orders: Order[]) => {
              const updated = orders.find(o => o.id === activeOrder.id);
              if (updated) {
                setActiveOrder(updated);
              }
            })
            .catch(err => {
              console.warn("Polling via API failed, checking local storage as fallback", err);
              try {
                const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
                const localOrders: Order[] = JSON.parse(localOrdersStr);
                const updated = localOrders.find(o => o.id === activeOrder.id);
                if (updated) {
                  setActiveOrder(updated);
                }
              } catch (e) {
                console.error("Local storage search failed too", e);
              }
            });
        }
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

  const getWhatsAppCartMessageUrl = () => {
    const phone = settings.kitchenPhone.replace(/\+/g, "").replace(/\s+/g, "").trim();
    
    // Build the message lines
    const lines = [
      "🔥 *PUNIQUE KITCHEN QUICK ORDER* 🔥",
      "Hello! I want to place a quick order with the following items from my cart:\n",
    ];

    cartItems.forEach((item) => {
      const itemPrice = item.price + (item.proteinExtraFee || 0);
      const proteinText = item.selectedProtein ? ` (${item.selectedProtein})` : "";
      lines.push(`• *${item.quantity}x* ${item.name}${proteinText} - ₦${(itemPrice * item.quantity).toLocaleString()}`);
    });

    const subtotal = cartItems.reduce((acc, item) => {
      return acc + (item.price + (item.proteinExtraFee || 0)) * item.quantity;
    }, 0);

    const delivery = settings.deliveryFee || 0;
    const total = subtotal + delivery;

    lines.push("");
    lines.push(`💵 *Subtotal:* ₦${subtotal.toLocaleString()}`);
    lines.push(`🛵 *Est. Delivery:* ₦${delivery.toLocaleString()}`);
    lines.push(`⭐ *Total Amount:* ₦${total.toLocaleString()}`);
    lines.push("\n📍 Please deliver to my address in Yenagoa, Bayelsa State.");
    lines.push("Thank you!");

    const text = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/${phone}?text=${text}`;
  };

  const totalCartQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Triggered when Checkout form submits and initiates Paystack payment
  const handleCheckoutInitiate = (data: any) => {
    setCheckoutPayload(data);
    setIsCartOpen(false);
    if (data.total === 0) {
      // Direct checkout for 100% loyalty redeemed free orders!
      handlePaymentSuccess("LOYALTY_REDEEM_FREE_ORDER", data);
    } else {
      setShowPaystack(true);
    }
  };

  // Triggered on Paystack authorization success or direct checkout
  const handlePaymentSuccess = async (ref: string, directPayload?: any) => {
    const payload = directPayload || checkoutPayload;
    if (!payload) return;
    
    // Assemble final order post object
    const finalOrder = {
      customerName: payload.customerName,
      phone: payload.phone,
      email: payload.email || `${payload.customerName.toLowerCase().replace(/\s/g, "")}@puniquekitchen.com`,
      address: payload.address,
      deliveryType: payload.deliveryType,
      items: cartItems.map(it => ({
        menuItemId: it.menuItemId,
        name: it.name,
        quantity: it.quantity,
        priceAtTime: it.price,
        selectedProtein: it.selectedProtein,
        proteinExtraFee: it.proteinExtraFee
      })),
      subtotal: payload.subtotal,
      deliveryFee: payload.deliveryFee,
      discountAmount: payload.discountAmount,
      discountCode: payload.couponCode,
      pointsRedeemed: payload.pointsRedeemed || 0,
      loyaltyDiscount: payload.loyaltyDiscount || 0,
      total: payload.total
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalOrder)
      });
      
      let orderCreated: Order;
      if (res.ok) {
        orderCreated = await res.json();
      } else {
        throw new Error("Backend order submission returned non-OK");
      }
      
      // Save session details to local storage
      try {
        const newSession = {
          customerName: payload.customerName,
          phone: payload.phone,
          email: payload.email || "",
          address: payload.address || ""
        };
        localStorage.setItem("punique_customer_session", JSON.stringify(newSession));
      } catch (e) {
        console.error("Failed to store customer session in localStorage", e);
      }
 
      // Append order to local storage history for static safety
      try {
        const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
        const localOrders: Order[] = JSON.parse(localOrdersStr);
        localStorage.setItem("punique_local_orders", JSON.stringify([orderCreated, ...localOrders]));
        recalculateLoyaltyPoints();
      } catch (e) {
        console.error("Failed to append order to local orders history", e);
      }
 
      // Clear cart
      setCartItems([]);
      setCheckoutPayload(null);
      setShowPaystack(false);
      // Put customer on tracking screen
      setActiveOrder(orderCreated);
      // Immediately fetch new admin notification from server
      fetchAdminNotifications();
    } catch (err) {
      console.warn("Failed to persist order to database. Simulating local checkout success.", err);
      
      // Local Simulation Fallback for Static Hosting
      const simulatedOrder: Order = {
        ...finalOrder,
        id: `ORD-LOCAL-${Math.floor(1000 + Math.random() * 9000)}`,
        status: OrderStatus.RECEIVED,
        createdAt: new Date().toISOString()
      };
 
      // Save session details to local storage
      try {
        const newSession = {
          customerName: payload.customerName,
          phone: payload.phone,
          email: payload.email || "",
          address: payload.address || ""
        };
        localStorage.setItem("punique_customer_session", JSON.stringify(newSession));
      } catch (e) {
        console.error("Failed to store customer session in localStorage", e);
      }
 
      // Save local simulated order to localStorage history
      try {
        const localOrdersStr = localStorage.getItem("punique_local_orders") || "[]";
        const localOrders: Order[] = JSON.parse(localOrdersStr);
        localStorage.setItem("punique_local_orders", JSON.stringify([simulatedOrder, ...localOrders]));
        recalculateLoyaltyPoints();
      } catch (e) {
        console.error("Failed to append simulated order to local storage", e);
      }
 
      // Clear cart
      setCartItems([]);
      setCheckoutPayload(null);
      setShowPaystack(false);
      // Put customer on tracking screen
      setActiveOrder(simulatedOrder);

      // Create a local simulated admin notification
      const localNotif: AdminNotification = {
        id: `notif-local-${Date.now()}`,
        type: "payment",
        message: `Payment of ₦${Number(simulatedOrder.total).toLocaleString()} successfully received from ${simulatedOrder.customerName} for Order #${simulatedOrder.id}`,
        timestamp: new Date().toISOString(),
        amount: Number(simulatedOrder.total),
        orderId: simulatedOrder.id,
        customerName: simulatedOrder.customerName,
        isRead: false
      };
      setAdminNotifications((prev) => [localNotif, ...prev]);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream/60 flex flex-col justify-between font-sans selection:bg-brand-orange selection:text-white">
      
      {/* 1. Header Navigation */}
      <Navbar
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        onOpenHistory={() => setIsHistoryOpen(true)}
        loyaltyPoints={loyaltyPoints}
        adminNotifications={adminNotifications}
        onReadAllNotifications={handleReadAllNotifications}
        onClearNotifications={handleClearNotifications}
        onSelectOrderId={handleSelectOrderId}
        isAdmin={isAdmin}
      />

      {/* 2. Main Area Routing */}
      <main className="flex-1">
        {activeOrder ? (
          /* CUSTOMER TRACKING SCREEN */
          <div className="py-6">
            <OrderTracker
              order={activeOrder}
              kitchenPhone={settings.kitchenPhone}
              onUpdateOrder={(updated) => setActiveOrder(updated)}
              onClose={() => {
                setActiveOrder(null);
                loadStoreData();
              }}
            />
          </div>
        ) : (
          /* CUSTOMER STOREFRONT */
          <div>
            
            {/* HERO SECTION WITH LUXURIOUS CHARCOAL & GOLD AESTHETIC */}
            <section className="relative overflow-hidden bg-brand-charcoal text-[#F7F4EE] py-12 sm:py-20 px-4">
              {/* Decorative Gold Geometric Accents */}
              <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
              
              <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-10 sm:gap-12 relative z-10 px-4 sm:px-6">
                {/* Brand Messaging */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center space-x-2 bg-brand-gold/15 rounded-full px-4 py-1.5 border border-brand-gold/25 max-w-full">
                    <span className="text-[8px] min-[360px]:text-[10px] font-bold tracking-widest text-brand-gold uppercase font-mono text-center">
                      Homemade & Class • Fresh Meals, Premium Taste
                    </span>
                  </div>

                  <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-none tracking-tight text-[#F7F4EE]">
                    PUNIQUE <span className="text-brand-gold animate-pulse">KITCHEN</span>
                  </h2>

                  <div className="space-y-3">
                    <p className="font-script text-3xl min-[360px]:text-4xl sm:text-6xl text-brand-gold leading-none tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      Made like home, tastes like luxury
                    </p>
                    <p className="text-[9px] min-[360px]:text-xs sm:text-sm uppercase tracking-[0.12em] min-[360px]:tracking-[0.18em] sm:tracking-[0.25em] font-bold text-[#F7F4EE]/90 leading-relaxed">
                      Homemade & Class • Cooked with Love & Delivered with Class
                    </p>
                  </div>

                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-normal max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
                    It's not just about food – it's about the joy, comfort, and satisfaction that comes with every delicious bite. Prepared with genuine firewood smoke, seasoned with love, and delivered with class. When people eat well, they feel good, and that happiness spreads to families, friends, and communities.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                    <a
                      href="#menu-search-input"
                      className="rounded-2xl bg-brand-gold hover:bg-brand-gold/90 text-brand-charcoal font-bold py-4 px-8 text-xs uppercase tracking-wider transition shadow-lg shadow-brand-gold/20 active:scale-95 text-center"
                    >
                      Browse Our Menu
                    </a>
                    <a
                      href={`https://wa.me/${settings.kitchenPhone.replace(/\+/g, "").trim()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2.5 text-xs text-slate-300 hover:text-white font-semibold py-3 sm:py-0 transition"
                    >
                      <Phone className="h-4 w-4 text-brand-gold" />
                      <span>WhatsApp support: <span className="text-brand-gold font-bold font-mono hover:underline">{settings.kitchenPhone}</span></span>
                    </a>
                  </div>
                </div>

                {/* Hero Food Showcase Carousel */}
                <div className="flex-1 w-full max-w-lg lg:max-w-none space-y-4 shrink-0 relative">
                  {/* Subtle golden aroma glowing ring behind the dish */}
                  <div className="aroma-glow absolute inset-0 -m-8 scale-110 opacity-30 pointer-events-none" />

                  <div className="relative aspect-[4/3] sm:aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group bg-slate-900 floating-dish">
                    
                    {/* Live Steam rising from the hot meal */}
                    <div className="steam-container">
                      <div className="steam-vapor steam-vapor-1"></div>
                      <div className="steam-vapor steam-vapor-2"></div>
                      <div className="steam-vapor steam-vapor-3"></div>
                    </div>

                    <img
                      src={HERO_DISHES[activeHeroIndex].imageUrl}
                      alt={HERO_DISHES[activeHeroIndex].name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      key={activeHeroIndex}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6">
                      <span className="inline-flex items-center space-x-1.5 text-[9px] font-bold tracking-widest text-brand-orange uppercase font-mono bg-brand-orange/15 border border-brand-orange/25 rounded-full px-2.5 py-0.5 w-fit">
                        {HERO_DISHES[activeHeroIndex].tagline}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FFF9F0] mt-2">
                        {HERO_DISHES[activeHeroIndex].name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-md">
                        {HERO_DISHES[activeHeroIndex].description}
                      </p>
                      <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-white/10">
                        <span className="text-lg font-bold text-brand-gold font-mono">
                          ₦{HERO_DISHES[activeHeroIndex].price.toLocaleString()}
                        </span>
                        <a
                          href="#menu-search-input"
                          className="rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-2 px-4 text-[10px] uppercase tracking-wider transition active:scale-95 flex items-center space-x-1"
                        >
                          <span>Order Now</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Quick Toggle Food Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    {HERO_DISHES.map((dish, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveHeroIndex(idx)}
                        className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition text-left cursor-pointer ${
                          activeHeroIndex === idx
                            ? "bg-white/15 border-brand-orange text-white"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        <div className="h-10 w-full rounded-xl overflow-hidden mb-1.5 hidden sm:block">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=300";
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-bold truncate w-full text-center">
                          {dish.name.replace("Bayelsa Native ", "").replace("Smokey ", "").replace("Special ", "")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* BRAND PROMISE & CHERISHED VALUES (FROM THE OFFICIAL BRAND BOARD) */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 relative">
              <div className="absolute inset-0 bg-brand-cream/40 rounded-3xl sm:rounded-[2.5rem] -z-10" />
              
              <div className="grid gap-10 lg:grid-cols-12 items-center">
                
                {/* Left Pane: Official Brand Promise Card (Premium Charcoal & Gold) */}
                <div className="lg:col-span-5 bg-brand-charcoal text-[#F7F4EE] rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-brand-gold/30 flex flex-col items-center text-center">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-45 h-45 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <span className="text-[10px] font-bold tracking-[0.25em] text-brand-gold uppercase font-mono bg-brand-gold/10 px-4.5 py-2 rounded-full border border-brand-gold/20">
                    OUR BRAND PROMISE
                  </span>
                  
                  {/* Gold Heart Ornament from Brand Board */}
                  <div className="my-6 text-brand-gold animate-pulse">
                    <Heart className="h-12 w-12 fill-brand-gold stroke-[1.5px]" />
                  </div>
                  
                  <blockquote className="font-serif text-xl sm:text-2xl font-bold leading-relaxed text-[#F7F4EE] italic">
                    "Homemade meals made with <span className="text-brand-gold">fresh ingredients</span>, cooked with <span className="text-brand-gold font-script text-3xl sm:text-4xl not-italic">love</span> and delivered with <span className="text-brand-gold">class</span>."
                  </blockquote>
                  
                  <div className="mt-8 flex items-center space-x-2">
                    <span className="h-px w-8 bg-brand-gold/30"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold/80 font-mono">Punique Kitchen</span>
                    <span className="h-px w-8 bg-brand-gold/30"></span>
                  </div>
                </div>

                {/* Right Pane: The 4 Core Brand Pillars */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2 text-center lg:text-left">
                    <span className="text-xs font-bold text-brand-orange uppercase tracking-widest">Our Core Pillars</span>
                    <h3 className="font-serif text-2xl sm:text-4xl font-black text-brand-charcoal">
                      The Homemade &amp; Class Philosophy
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      Every order we prepare embodies these four core pillars to bring the absolute finest homemade experience to your table.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Pillar 1 */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-[375px]:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col min-[375px]:flex-row items-center min-[375px]:items-start space-y-3 min-[375px]:space-y-0 space-x-0 min-[375px]:space-x-4 text-center min-[375px]:text-left group">
                      <div className="h-12 w-12 bg-emerald-50 rounded-xl text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors duration-300">
                        <Leaf className="h-6 w-6 stroke-[1.5px]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Fresh Ingredients</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          Hand-selected farm produce and native delta spices, guaranteeing pure, wholesome goodness in every recipe.
                        </p>
                      </div>
                    </div>

                    {/* Pillar 2 */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-[375px]:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col min-[375px]:flex-row items-center min-[375px]:items-start space-y-3 min-[375px]:space-y-0 space-x-0 min-[375px]:space-x-4 text-center min-[375px]:text-left group">
                      <div className="h-12 w-12 bg-amber-50 rounded-xl text-brand-gold flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors duration-300">
                        <Sparkles className="h-6 w-6 stroke-[1.5px]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Premium Taste</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          Delivering high-quality gourmet luxury with traditional firewood smokiness and authentic culinary heritage.
                        </p>
                      </div>
                    </div>

                    {/* Pillar 3 */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-[375px]:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col min-[375px]:flex-row items-center min-[375px]:items-start space-y-3 min-[375px]:space-y-0 space-x-0 min-[375px]:space-x-4 text-center min-[375px]:text-left group">
                      <div className="h-12 w-12 bg-rose-50 rounded-xl text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors duration-300">
                        <Heart className="h-6 w-6 stroke-[1.5px] fill-rose-100 group-hover:fill-rose-200" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Made With Love</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          Prepared with pure care, passion, and warmth, just like food cooked for family and loved ones.
                        </p>
                      </div>
                    </div>

                    {/* Pillar 4 */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 min-[375px]:p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col min-[375px]:flex-row items-center min-[375px]:items-start space-y-3 min-[375px]:space-y-0 space-x-0 min-[375px]:space-x-4 text-center min-[375px]:text-left group">
                      <div className="h-12 w-12 bg-indigo-50 rounded-xl text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors duration-300">
                        <Crown className="h-6 w-6 stroke-[1.5px]" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">Served With Class</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-normal">
                          Elegantly packaged and transported by prompt dispatch riders to ensure your meal arrives warm and pristine.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
              <div className="flex items-center justify-center md:justify-start space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-charcoal text-brand-gold border border-brand-gold/20 shadow-md">
                  <ChefHat className="h-5.5 w-5.5 text-brand-gold" />
                </div>
                <span className="font-serif text-base sm:text-lg font-black tracking-tight bg-brand-charcoal px-3 py-1.5 rounded-xl flex items-center shadow-inner">
                  <span className="text-white">PUNIQUE</span>
                  <span className="text-brand-gold ml-1.5">KITCHEN</span>
                </span>
              </div>
              
              <p className="font-serif text-base italic text-brand-orange font-bold drop-shadow-xs">
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

      {/* Mobile Floating 'Quick Order' WhatsApp Button */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden animate-bounce" style={{ animationDuration: '3s' }}>
          <a
            href={getWhatsAppCartMessageUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2.5 bg-[#25D366] text-white py-3 px-4.5 rounded-full shadow-2xl hover:bg-[#20ba5a] active:scale-95 transition-all duration-300 border border-white/25 cursor-pointer hover:shadow-green-500/20"
            title="Place Quick Order via WhatsApp"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shrink-0">
              <svg
                className="h-4.5 w-4.5 fill-white"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
              </svg>
              {/* Pulse badge */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[9px] font-bold text-white ring-1 ring-white">
                {totalCartQuantity}
              </span>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[9px] tracking-wider uppercase opacity-90 font-mono font-medium">
                Quick Order
              </span>
              <span className="text-xs font-bold font-sans mt-0.5">
                Send to WhatsApp
              </span>
            </div>
          </a>
        </div>
      )}

      {/* Real-Time Admin Payment Alert Toast */}
      {isAdmin && toastMessage && (
        <div className="fixed top-24 right-4 sm:right-6 z-[60] max-w-sm w-[calc(100vw-2rem)] bg-slate-900 text-[#FFF9F0] border-2 border-brand-orange rounded-2xl p-4 shadow-2xl shadow-brand-orange/20 flex gap-3 animate-slideIn">
          <div className="h-9 w-9 rounded-xl bg-brand-orange/25 border border-brand-orange/30 text-brand-orange flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-brand-orange uppercase tracking-wider font-mono">Admin Notification</h4>
            <p className="text-xs text-slate-200 leading-relaxed font-serif mt-1">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold self-start h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}
