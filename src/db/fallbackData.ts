import { Category, MenuItem, Coupon, KitchenSettings, Review } from "../types";

export const fallbackCategories: Category[] = [
  { id: "cat-1", name: "Everyday Favourites", slug: "everyday-favourites", imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-2", name: "Signature Dishes", slug: "signature-dishes", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-3", name: "Rice Dishes", slug: "rice-dishes", imageUrl: "https://images.unsplash.com/photo-1612531388330-801a1d8db121?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-4", name: "Soups", slug: "soups", imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-5", name: "Sauces", slug: "sauces", imageUrl: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&q=80&w=400" },
  { id: "cat-6", name: "Special Dishes", slug: "special-dishes", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=400" }
];

export const fallbackMenuItems: MenuItem[] = [
  {
    id: "menu-1",
    name: "Creamy Beef Sandwich",
    description: "Rich, creamy slow-cooked shredded beef tucked inside warm toasted artisanal bread with special house sauce.",
    price: 1000,
    categoryId: "cat-1",
    imageUrl: "/assets/images/creamy_beef_sandwich_1783867694389.jpg",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 540, protein: "25g", carbs: "48g", fat: "19g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-2",
    name: "Pancakes",
    description: "Thick, golden, buttermilk pancakes served hot with a dollop of premium butter and sweet syrup.",
    price: 1000,
    categoryId: "cat-1",
    imageUrl: "/assets/images/golden_fluffy_pancakes_1783867783062.jpg",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 480, protein: "8g", carbs: "65g", fat: "14g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-3",
    name: "Stir Fry Noodles and Egg",
    description: "Wok-tossed noodles packed with shredded carrots, bell peppers, local bayelsa chili spices, finished with a fried egg.",
    price: 1400,
    categoryId: "cat-2",
    imageUrl: "/assets/images/stir_fry_noodles_egg_1783865362023.jpg",
    inStock: true,
    isTodaySpecial: true,
    nutrition: { calories: 620, protein: "18g", carbs: "72g", fat: "22g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-4",
    name: "Smokey Jollof Rice",
    description: "Authentic, party-style Nigerian Jollof rice cooked over high heat to achieve that distinct local smokey firewood aroma.",
    price: 1800,
    categoryId: "cat-3",
    imageUrl: "/assets/images/smokey_jollof_rice_1783865479007.jpg",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 680, protein: "24g", carbs: "90g", fat: "18g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-5",
    name: "Stir-Fried Rice",
    description: "Fragrant seasoned rice stir-fried with crisp greens, sweet corn, minced carrots, beef bits, and local spices.",
    price: 1600,
    categoryId: "cat-3",
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=500",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 610, protein: "20g", carbs: "82g", fat: "16g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-6",
    name: "Special Asun Rice",
    description: "Spiced Jollof rice tossed with chunks of fiery peppered charcoal-grilled goat meat (Asun), bell peppers, and raw onions.",
    price: 2200,
    categoryId: "cat-3",
    imageUrl: "/assets/images/special_asun_rice_1783865130355.jpg",
    inStock: true,
    isTodaySpecial: true,
    nutrition: { calories: 750, protein: "38g", carbs: "85g", fat: "28g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-7",
    name: "Rich Egusi Soup",
    description: "Thick melon seed soup steamed with rich palm oil, crayfish, bitterleaf, and Nigerian traditional spices. Select your protein option!",
    price: 2500,
    categoryId: "cat-4",
    imageUrl: "/assets/images/rich_egusi_soup_1783865915668.jpg",
    inStock: true,
    proteinOptions: ["Assorted Beef (+₦500)", "Local Goat Meat (+₦800)", "Fresh Catfish (+₦1,000)"],
    isTodaySpecial: false,
    nutrition: { calories: 580, protein: "28g", carbs: "14g", fat: "42g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-8",
    name: "Bayelsa Native Seafood Okra",
    description: "Good meal equal happy bellies! Slimy rich okra broth loaded with fresh periwinkles, baby crabs, prawns, stockfish, and local seafood spices.",
    price: 2800,
    categoryId: "cat-4",
    imageUrl: "/assets/images/bayelsa_seafood_okra_1783865739908.jpg",
    inStock: true,
    proteinOptions: ["Fresh Catfish (+₦1,000)", "Extra Jumbo Prawns (+₦1,200)", "Smoked Fish (+₦600)"],
    isTodaySpecial: true,
    nutrition: { calories: 450, protein: "32g", carbs: "12g", fat: "24g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-9",
    name: "Efik Afang Soup",
    description: "Nutritious waterleaf and wild Afang leaves ground fine and simmered slow with rich palm oil, cow skin (kpomo), and stockfish.",
    price: 2700,
    categoryId: "cat-4",
    imageUrl: "/assets/images/efik_afang_soup_1783866155901.jpg",
    inStock: true,
    proteinOptions: ["Beef (+₦500)", "Goat Meat (+₦800)", "Dry Fish (+₦600)"],
    isTodaySpecial: false,
    nutrition: { calories: 520, protein: "26g", carbs: "10g", fat: "38g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-10",
    name: "Beef Curry Sauce",
    description: "Aromatic, thick curry gravy packed with tender cuts of beef, chopped Irish potatoes, carrots, and warm spices.",
    price: 1500,
    categoryId: "cat-5",
    imageUrl: "/assets/images/beef_curry_sauce_1783866305014.jpg",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 490, protein: "22g", carbs: "32g", fat: "20g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-11",
    name: "Chicken Curry Sauce",
    description: "Mildly spiced, creamy, golden coconut curry with soft chicken chunks, delicious as a side or over white rice.",
    price: 1500,
    categoryId: "cat-5",
    imageUrl: "/assets/images/chicken_curry_sauce_1783866932326.jpg",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 460, protein: "28g", carbs: "16g", fat: "22g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  },
  {
    id: "menu-12",
    name: "Goat Meat Curry Sauce",
    description: "Rich, aromatic and savory goat meat pieces slow-cooked in a spicy traditional curry broth with potatoes and carrots.",
    price: 1800,
    categoryId: "cat-5",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=500",
    inStock: true,
    isTodaySpecial: false,
    nutrition: { calories: 510, protein: "31g", carbs: "14g", fat: "25g" },
    createdAt: "2026-07-08T10:00:00.000Z"
  }
];

export const fallbackCoupons: Coupon[] = [
  { id: "c-1", code: "PUNIQUE10", discountPercent: 10, validUntil: "2027-12-31", maxUses: 100, usesCount: 5, isActive: true },
  { id: "c-2", code: "YENAGOA20", discountPercent: 20, validUntil: "2027-12-31", maxUses: 50, usesCount: 12, isActive: true },
  { id: "c-3", code: "WELCOME5", discountPercent: 5, validUntil: "2027-12-31", maxUses: 500, usesCount: 84, isActive: true }
];

export const fallbackSettings: KitchenSettings = {
  deliveryFee: 800,
  isOpen: true,
  openingTime: "08:00",
  closingTime: "21:30",
  kitchenPhone: "+2348083163956",
  closingDays: ["Sunday"]
};

export const fallbackReviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Gift Amgbare",
    phone: "+2348055662211",
    menuItemId: "menu-8",
    menuItemName: "Bayelsa Native Seafood Okra",
    rating: 5,
    comment: "Oh my goodness! The periwinkles and fresh baby crabs are sweet and authentic. Best seafood okra in Yenagoa, bar none!",
    createdAt: "2026-07-09T10:00:00.000Z",
    likes: 12
  },
  {
    id: "rev-2",
    customerName: "Oyinmiebi Harrison",
    phone: "+2349088776655",
    menuItemId: "menu-4",
    menuItemName: "Smokey Jollof Rice",
    rating: 5,
    comment: "Proper party style! The firewood smoke flavor is perfect. Highly recommended.",
    createdAt: "2026-07-10T10:00:00.000Z",
    likes: 8
  },
  {
    id: "rev-3",
    customerName: "Precious Alagoa",
    phone: "+2348083163956",
    menuItemId: "menu-6",
    menuItemName: "Special Asun Rice",
    rating: 4,
    comment: "Extremely tasty and fiery hot, just how I like my Asun. Chunks of goat meat were so tender. Definitely ordering again!",
    createdAt: "2026-07-11T10:00:00.000Z",
    likes: 5
  },
  {
    id: "rev-4",
    customerName: "Ebimene Williams",
    phone: "+2348035552211",
    menuItemId: "menu-1",
    menuItemName: "Creamy Beef Sandwich",
    rating: 5,
    comment: "This is my absolute go-to breakfast. So creamy, satisfying, and filling.",
    createdAt: "2026-07-12T10:00:00.000Z",
    likes: 3
  }
];
