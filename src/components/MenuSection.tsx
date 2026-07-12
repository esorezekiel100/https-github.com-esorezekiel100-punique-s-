/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Search, Sparkles, AlertCircle, ShoppingCart, Plus, Check } from "lucide-react";
import { Category, MenuItem } from "../types";

interface MenuSectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddToCart: (item: MenuItem, selectedProtein?: string, proteinExtraFee?: number) => void;
}

export default function MenuSection({
  menuItems,
  categories,
  onAddToCart,
}: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchWord, setSearchWord] = useState<string>("");
  const [proteinModalItem, setProteinModalItem] = useState<MenuItem | null>(null);
  const [selectedProtein, setSelectedProtein] = useState<string>("");
  const [showNutrition, setShowNutrition] = useState<boolean>(true);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchWord.toLowerCase()) ||
      item.description.toLowerCase().includes(searchWord.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const todaySpecials = menuItems.filter((item) => item.isTodaySpecial && item.inStock);

  // Parse price add-on from protein option string e.g. "Local Goat Meat (+₦800)" -> 800
  const getProteinFee = (proteinStr: string): number => {
    const match = proteinStr.match(/\+₦([\d,]+)/);
    if (match) {
      return Number(match[1].replace(/,/g, ""));
    }
    return 0;
  };

  const handleOpenCustomize = (item: MenuItem) => {
    if (item.proteinOptions && item.proteinOptions.length > 0) {
      setProteinModalItem(item);
      setSelectedProtein(item.proteinOptions[0]);
    } else {
      onAddToCart(item);
    }
  };

  const handleAddCustomizedItem = () => {
    if (proteinModalItem) {
      const extraFee = getProteinFee(selectedProtein);
      onAddToCart(proteinModalItem, selectedProtein, extraFee);
      setProteinModalItem(null);
      setSelectedProtein("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Today's Specials Banner (Bento style highlight) */}
      {todaySpecials.length > 0 && selectedCategory === "all" && !searchWord && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-brand-orange animate-pulse" />
            <h2 className="font-serif text-2xl font-bold text-brand-green">
              Today's Specialties
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {todaySpecials.slice(0, 2).map((item) => (
              <div
                key={`special-${item.id}`}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-green p-6 text-white shadow-xl flex flex-col md:flex-row gap-6 border border-white/10 group"
              >
                {/* Floating Badge */}
                <div className="absolute top-4 right-4 bg-brand-orange text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md animate-bounce">
                  Chef's Special
                </div>
                
                <div className="w-full md:w-1/3 aspect-square md:aspect-auto rounded-xl overflow-hidden shadow-inner bg-white/10 shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-serif text-xl font-bold leading-snug tracking-tight text-[#FFF9F0]">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed font-light">
                      {item.description}
                    </p>

                    {/* Nutrition info in Dark Specials Card */}
                    {showNutrition && item.nutrition && (
                      <div className="mt-3.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-slate-200">
                        <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 border border-white/5 backdrop-blur-xs" title="Calories">
                          🔥 {item.nutrition.calories} kcal
                        </span>
                        {item.nutrition.protein && (
                          <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 border border-white/5 backdrop-blur-xs" title="Protein">
                            🥩 P: {item.nutrition.protein}
                          </span>
                        )}
                        {item.nutrition.carbs && (
                          <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 border border-white/5 backdrop-blur-xs" title="Carbohydrates">
                            🍞 C: {item.nutrition.carbs}
                          </span>
                        )}
                        {item.nutrition.fat && (
                          <span className="inline-flex items-center rounded-lg bg-white/10 px-2 py-1 border border-white/5 backdrop-blur-xs" title="Fats">
                            🥑 F: {item.nutrition.fat}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider">
                        Price
                      </p>
                      <p className="font-serif text-2xl font-bold text-brand-gold">
                        ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                    <button
                      id={`btn-add-special-${item.id}`}
                      onClick={() => handleOpenCustomize(item)}
                      className="flex items-center space-x-2 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-bold px-4 py-2.5 text-xs transition shadow-md shadow-brand-orange/20 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{item.proteinOptions ? "Customize" : "Order Now"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Horizontal Scroller */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-brand-green">
          Explore Our Menu
        </h2>
        <div className="flex space-x-3 overflow-x-auto pb-3 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`flex shrink-0 items-center space-x-2 rounded-full px-5 py-2.5 text-xs font-semibold transition cursor-pointer border ${
              selectedCategory === "all"
                ? "bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20"
                : "bg-white text-brand-green border-slate-200 hover:bg-rose-50/30"
            }`}
          >
            All Dishes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center space-x-2 rounded-full px-5 py-2.5 text-xs font-semibold transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-brand-orange text-white border-brand-orange shadow-md shadow-brand-orange/20"
                  : "bg-white text-brand-green border-slate-200 hover:bg-rose-50/30"
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
          <input
            id="menu-search-input"
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="Search smokey jollof, seafood okra, creamy sandwiches..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange font-medium"
          />
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            id="toggle-nutrition-info"
            onClick={() => setShowNutrition((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showNutrition 
                ? "bg-brand-orange/[0.04] text-brand-orange border-brand-orange/30 shadow-xs"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>🥗</span>
            <span>Nutrition Facts</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showNutrition ? "bg-brand-orange" : "bg-slate-400"}`}></span>
          </button>

          <div className="text-xs text-gray-400 font-medium shrink-0">
            Showing <span className="font-bold text-brand-green">{filteredItems.length}</span> delicious items
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm premium-card-transition group ${
                !item.inStock ? "opacity-75" : ""
              }`}
            >
              {/* Sold out Overlay */}
              {!item.inStock && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 p-4 backdrop-blur-[1px]">
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 px-4 py-3 flex items-center space-x-2 shadow-md">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-serif text-sm font-bold">Sold Out Today</span>
                  </div>
                </div>
              )}

              {/* Dish Image */}
              <div className="aspect-video w-full overflow-hidden bg-slate-50 relative">
                {item.inStock && (
                  <div className="steam-container opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="steam-vapor steam-vapor-1"></div>
                    <div className="steam-vapor steam-vapor-2"></div>
                    <div className="steam-vapor steam-vapor-3"></div>
                  </div>
                )}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Card Details */}
              <div className="flex flex-col justify-between flex-1 p-5">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-lg font-bold tracking-tight text-brand-green group-hover:text-brand-orange transition-colors">
                      {item.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Nutrition info */}
                  {showNutrition && item.nutrition && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      <span className="inline-flex items-center rounded-lg bg-orange-50 px-2 py-0.5 text-orange-700 border border-orange-100/70" title="Calories">
                        🔥 {item.nutrition.calories} kcal
                      </span>
                      {item.nutrition.protein && (
                        <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-100/70" title="Protein">
                          🥩 P: {item.nutrition.protein}
                        </span>
                      )}
                      {item.nutrition.carbs && (
                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-2 py-0.5 text-blue-700 border border-blue-100/70" title="Carbohydrates">
                          🍞 C: {item.nutrition.carbs}
                        </span>
                      )}
                      {item.nutrition.fat && (
                        <span className="inline-flex items-center rounded-lg bg-purple-50 px-2 py-0.5 text-purple-700 border border-purple-100/70" title="Fats">
                          🥑 F: {item.nutrition.fat}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">Price</span>
                    <span className="font-serif text-lg font-bold text-brand-green">
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>

                  {item.inStock && (
                    <button
                      id={`btn-add-${item.id}`}
                      onClick={() => handleOpenCustomize(item)}
                      className="flex items-center space-x-1 rounded-xl bg-brand-orange hover:bg-brand-orange/95 text-white text-xs font-bold px-3.5 py-2 shadow-sm transition hover:shadow active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>{item.proteinOptions ? "Customize" : "Add"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-brand-orange">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-serif text-lg font-bold text-brand-green">
            No culinary delights found
          </h3>
          <p className="mt-2 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            We couldn't find any dishes matching your query. Try clearing your search or checking another category!
          </p>
          <button
            onClick={() => {
              setSearchWord("");
              setSelectedCategory("all");
            }}
            className="mt-5 rounded-xl border border-brand-orange bg-transparent text-brand-orange px-4 py-2 text-xs font-bold hover:bg-brand-orange/5 transition"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Protein Customization Modal (For Soups & Sauces) */}
      {proteinModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="font-serif text-xl font-bold text-brand-green">
              Customize Your Dish
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select your preferred protein option for <span className="font-semibold text-brand-orange">{proteinModalItem.name}</span>
            </p>

            <div className="mt-4 space-y-2">
              {proteinModalItem.proteinOptions?.map((opt) => {
                const fee = getProteinFee(opt);
                const isSelected = selectedProtein === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedProtein(opt)}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 text-xs font-medium transition ${
                      isSelected
                        ? "bg-brand-orange/10 border-brand-orange text-brand-orange"
                        : "bg-white border-slate-200 hover:bg-rose-50/30 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        isSelected ? "border-brand-orange bg-brand-orange text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[4px]" />}
                      </div>
                      <span>{opt.split(" (")[0]}</span>
                    </div>
                    {fee > 0 ? (
                      <span className="font-serif font-bold text-brand-green">+₦{fee.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-400">Included</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                id="btn-cancel-customization"
                onClick={() => {
                  setProteinModalItem(null);
                  setSelectedProtein("");
                }}
                className="w-1/2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-gray-500 py-3 hover:bg-rose-50/30 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-customization"
                onClick={handleAddCustomizedItem}
                className="w-1/2 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-xs font-bold text-white py-3 shadow-md shadow-brand-orange/20 transition cursor-pointer"
              >
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
