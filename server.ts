/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { readDb, writeDb } from "./src/db/localDb";
import { Order, MenuItem, OrderStatus, DeliveryType, KitchenSettings } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client setup
let aiClient: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Get menu items and categories
app.get("/api/menu", (req, res) => {
  try {
    const db = readDb();
    res.json({
      menuItems: db.menuItems,
      categories: db.categories,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Add menu item
app.post("/api/menu", (req, res) => {
  try {
    const db = readDb();
    const { name, description, price, categoryId, imageUrl, inStock, proteinOptions, isTodaySpecial } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: "Missing required fields: name, price, categoryId" });
    }

    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      name,
      description: description || "",
      price: Number(price),
      categoryId,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
      inStock: inStock !== undefined ? inStock : true,
      proteinOptions: proteinOptions || [],
      isTodaySpecial: !!isTodaySpecial,
      createdAt: new Date().toISOString(),
    };

    db.menuItems.push(newItem);
    writeDb(db);
    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Edit menu item
app.put("/api/menu/:id", (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    const index = db.menuItems.findIndex((item) => item.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    const updated = {
      ...db.menuItems[index],
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : db.menuItems[index].price,
    };

    db.menuItems[index] = updated;
    writeDb(db);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete menu item
app.delete("/api/menu/:id", (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    const filtered = db.menuItems.filter((item) => item.id !== id);

    if (filtered.length === db.menuItems.length) {
      return res.status(404).json({ error: "Menu item not found" });
    }

    db.menuItems = filtered;
    writeDb(db);
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get all orders
app.get("/api/orders", (req, res) => {
  try {
    const db = readDb();
    // Sort by latest order first
    const sorted = [...db.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Create new order
app.post("/api/orders", (req, res) => {
  try {
    const db = readDb();
    const { customerName, phone, email, address, deliveryType, items, subtotal, deliveryFee, discountAmount, discountCode, total } = req.body;

    if (!customerName || !phone || !items || !items.length) {
      return res.status(400).json({ error: "Missing required fields: customerName, phone, items" });
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      phone,
      email,
      address,
      deliveryType: deliveryType || DeliveryType.PICKUP,
      status: OrderStatus.RECEIVED,
      subtotal: Number(subtotal),
      deliveryFee: Number(deliveryFee),
      discountAmount: Number(discountAmount || 0),
      discountCode,
      total: Number(total),
      items: items.map((it: any, index: number) => ({
        id: `oi-${Date.now()}-${index}`,
        menuItemId: it.menuItemId,
        name: it.name,
        quantity: Number(it.quantity),
        priceAtTime: Number(it.priceAtTime),
        selectedProtein: it.selectedProtein,
        proteinExtraFee: it.proteinExtraFee ? Number(it.proteinExtraFee) : undefined,
      })),
      createdAt: new Date().toISOString(),
    };

    db.orders.push(newOrder);

    // Update coupon usages if applicable
    if (discountCode) {
      const couponIndex = db.coupons.findIndex((c) => c.code.toLowerCase() === discountCode.toLowerCase());
      if (couponIndex !== -1) {
        db.coupons[couponIndex].usesCount += 1;
      }
    }

    writeDb(db);
    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Update order status
app.put("/api/orders/:id/status", (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Missing status field" });
    }

    const index = db.orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Order not found" });
    }

    db.orders[index].status = status as OrderStatus;
    writeDb(db);
    res.json(db.orders[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get coupons
app.get("/api/coupons", (req, res) => {
  try {
    const db = readDb();
    res.json(db.coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Add or delete coupons
app.post("/api/coupons", (req, res) => {
  try {
    const db = readDb();
    const { code, discountPercent, validUntil, maxUses } = req.body;

    if (!code || !discountPercent) {
      return res.status(400).json({ error: "Missing code or discountPercent" });
    }

    const newCoupon = {
      id: `c-${Date.now()}`,
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent),
      validUntil: validUntil || "2027-12-31",
      maxUses: Number(maxUses || 100),
      usesCount: 0,
      isActive: true,
    };

    db.coupons.push(newCoupon);
    writeDb(db);
    res.status(201).json(newCoupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/coupons/:id", (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    db.coupons = db.coupons.filter((c) => c.id !== id);
    writeDb(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Get/Update settings
app.get("/api/settings", (req, res) => {
  try {
    const db = readDb();
    res.json(db.settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/settings", (req, res) => {
  try {
    const db = readDb();
    db.settings = {
      ...db.settings,
      ...req.body,
      deliveryFee: req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) : db.settings.deliveryFee,
    };
    writeDb(db);
    res.json(db.settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10b. Get reviews
app.get("/api/reviews", (req, res) => {
  try {
    const db = readDb();
    const sorted = [...(db.reviews || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10c. Post a review
app.post("/api/reviews", (req, res) => {
  try {
    const db = readDb();
    const { customerName, phone, menuItemId, rating, comment } = req.body;

    if (!customerName || !phone || !menuItemId || !rating || !comment) {
      return res.status(400).json({ error: "Missing required fields: customerName, phone, menuItemId, rating, comment" });
    }

    const menuItem = db.menuItems.find((item) => item.id === menuItemId);
    if (!menuItem) {
      return res.status(404).json({ error: "Dish not found." });
    }

    // Verify customer has ordered this dish previously
    const cleanPhone = phone.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
    const hasOrdered = db.orders.some((o) => {
      const cleanOrderPhone = o.phone.trim().replace(/\s+/g, "").replace(/^\+2340/, "+234").replace(/^0/, "+234");
      const phoneMatches = cleanOrderPhone === cleanPhone || o.phone === phone;
      if (!phoneMatches) return false;
      return o.items.some((it) => it.menuItemId === menuItemId);
    });

    if (!hasOrdered) {
      return res.status(403).json({
        error: "Verified Purchase Required",
        message: `Our records show that ${phone} has not ordered "${menuItem.name}" yet. You can only review dishes you have actually ordered!`,
      });
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      customerName: customerName.trim(),
      phone: phone.trim(),
      menuItemId,
      menuItemName: menuItem.name,
      rating: Number(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    if (!db.reviews) {
      db.reviews = [];
    }
    db.reviews.push(newReview);
    writeDb(db);
    res.status(201).json(newReview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10d. Like a review
app.post("/api/reviews/:id/like", (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    
    if (!db.reviews) {
      db.reviews = [];
    }
    
    const index = db.reviews.findIndex((r) => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    db.reviews[index].likes = (db.reviews[index].likes || 0) + 1;
    writeDb(db);
    res.json(db.reviews[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// 11. Smart Copywriter Powered by Gemini
app.post("/api/copymaker", async (req, res) => {
  const { name, category, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Food item name is required" });
  }

  const prompt = `Write a vibrant, mouth-watering, and high-converting restaurant menu description (maximum 120 characters) for a dish named "${name}" in the "${category || "General"}" category. Include some local Nigerian/African-inspired culinary words if appropriate. Additional description notes: "${notes || "Fresh and hot"}". Keep it short, modern, and inviting. No quotation marks in response.`;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const description = response.text?.trim().replace(/^"|"$/g, "") || "";
    res.json({ description });
  } catch (error: any) {
    console.warn("Gemini API not available, using high-quality local fallback copywriting generator.", error.message);

    // Dynamic high-quality fallback generator
    const fallbacks: { [key: string]: string[] } = {
      "Everyday Favourites": [
        `Deliciously golden ${name}, freshly prepared with premium butter and love for a perfect day starter!`,
        `Satisfyingly rich and crispy ${name}, hot out of the kitchen with our signature Punique touch.`,
      ],
      "Signature Dishes": [
        `Our secret recipe ${name}, perfectly wok-fried with aromatic spices and fresh garden scallions.`,
        `A fiery, rich sensation of ${name} slow-cooked with select pepper seasoning for that signature local punch.`,
      ],
      "Rice Dishes": [
        `Rich, aromatic firewood-style ${name}, cooked slowly to unlock deep local smokey flavours.`,
        `Tender grains of ${name} tossed with spicy grilled meats, bell peppers, and fresh local herbs.`,
      ],
      "Soups": [
        `Thick, nutrient-rich traditional ${name}, stewed slow in palm oil, crayfish, and local delta spices.`,
        `Pure coastal luxury: our iconic ${name} loaded with seafood, periwinkles, and fresh local leaves.`,
      ],
      "Sauces": [
        `Fragrant, creamy ${name} simmered slowly with potatoes, fresh peppers, and seasoned local meats.`,
        `Thick aromatic ${name} infused with curry and ginger, cooked to perfection as a premium side.`,
      ],
    };

    const list = fallbacks[category] || [
      `Freshly prepared, succulent ${name} slow-cooked in rich peppers and local house spices.`,
      `The ultimate delta delight: ${name}, hot, comforting, and packed with traditional herbs.`,
    ];

    const randomDesc = list[Math.floor(Math.random() * list.length)];
    res.json({ description: randomDesc });
  }
} );

// 12. Dashboard Analytics Stats
app.get("/api/stats", (req, res) => {
  try {
    const db = readDb();
    const orders = db.orders;

    // Filter today's orders
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));

    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrdersCount = orders.filter((o) => o.status !== OrderStatus.DELIVERED).length;

    // Popular items
    const itemCounts: { [name: string]: { count: number; revenue: number } } = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (!itemCounts[it.name]) {
          itemCounts[it.name] = { count: 0, revenue: 0 };
        }
        itemCounts[it.name].count += it.quantity;
        itemCounts[it.name].revenue += (it.priceAtTime + (it.proteinExtraFee || 0)) * it.quantity;
      });
    });

    const popularItems = Object.entries(itemCounts)
      .map(([name, stat]) => ({ name, count: stat.count, revenue: stat.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Revenue by last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - index);
      return d.toISOString().split("T")[0];
    }).reverse();

    const revenueByDay = last7Days.map((dateStr) => {
      const dayOrders = orders.filter((o) => o.createdAt.startsWith(dateStr));
      const amount = dayOrders.reduce((sum, o) => sum + o.total, 0);
      
      // Parse day for chart label (e.g. "Jul 08")
      const parsedDate = new Date(dateStr);
      const label = parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        date: label,
        amount,
        orders: dayOrders.length,
      };
    });

    res.json({
      todayOrdersCount,
      todayRevenue,
      pendingOrdersCount,
      popularItems,
      revenueByDay,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Vite Server / Static File Serving Setup
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
