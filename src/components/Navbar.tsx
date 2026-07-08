/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShoppingBag, Clock, History } from "lucide-react";
import { KitchenSettings } from "../types";

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  settings: KitchenSettings;
  onOpenHistory: () => void;
}

export default function Navbar({
  cartCount,
  onOpenCart,
  settings,
  onOpenHistory,
}: NavbarProps) {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex cursor-pointer items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange text-white shadow-md shadow-rose-500/20">
              <span className="font-serif text-2xl font-bold">P</span>
            </div>
            <div>
              <h1 id="brand-logo" className="font-serif text-xl font-bold tracking-tight text-brand-green sm:text-2xl">
                PUNIQUE <span className="text-brand-orange">KITCHEN</span>
              </h1>
              <p className="hidden text-[10px] font-mono tracking-wider text-brand-gold uppercase sm:block">
                Good meal equal happy bellies
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Store Status Badge */}
            <div
              className={`hidden items-center space-x-1 rounded-full px-3 py-1 text-xs font-medium sm:flex ${
                settings.isOpen
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>
                {settings.isOpen
                  ? `Open Now • Closes ${settings.closingTime}`
                  : "Closed Now"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-open-history"
                onClick={onOpenHistory}
                className="flex items-center space-x-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/50 px-3 py-2 text-xs font-semibold text-brand-orange transition cursor-pointer"
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">My Orders</span>
              </button>
            </div>

            {/* Cart Button */}
            <button
              id="btn-toggle-cart"
              onClick={onOpenCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-brand-orange text-white shadow-lg shadow-brand-orange/20 transition hover:bg-brand-orange/90 active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-bold text-white ring-2 ring-white">
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
