/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CreditCard, Landmark, Hash, Lock, ShieldCheck, X, RefreshCw, CheckCircle, Smartphone } from "lucide-react";

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentReference: string) => void;
  email: string;
  totalAmount: number;
}

enum PayMethod {
  CARD = "card",
  BANK = "bank",
  USSD = "ussd"
}

export default function PaystackModal({
  isOpen,
  onClose,
  onSuccess,
  email,
  totalAmount,
}: PaystackModalProps) {
  const [method, setMethod] = useState<PayMethod>(PayMethod.CARD);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Card States
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // USSD States
  const [selectedBankUssd, setSelectedBankUssd] = useState("gtb");
  
  // Bank Transfer States
  const [transferTimer, setTransferTimer] = useState(120);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (method === PayMethod.BANK && isOpen && transferTimer > 0) {
      interval = setInterval(() => {
        setTransferTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [method, isOpen, transferTimer]);

  if (!isOpen) return null;

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Paystack processing network latency
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Complete after showing beautiful green checkmark
      setTimeout(() => {
        const ref = `PSTK-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
        onSuccess(ref);
      }, 1500);
    }, 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      {/* Outer Paystack Styled Modal Box */}
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 font-sans text-gray-800">
        
        {/* Top Header representing Paystack banner */}
        <div className="bg-[#121A2C] px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-[#09A5DB] flex items-center justify-center font-bold text-xs font-mono text-[#121A2C]">
              P
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest font-mono">
                Secured by Paystack
              </p>
              <h4 className="text-xs text-gray-200">
                Paying <span className="font-semibold text-white">PUNIQUE KITCHEN</span>
              </h4>
            </div>
          </div>
          <button
            id="btn-close-paystack"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount bar */}
        <div className="bg-[#F8FAFC] px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{email || "customer@puniquekitchen.com"}</span>
          <span className="text-sm font-bold text-gray-800 font-mono">
            ₦{totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[340px]">
          {/* Method Selector Left Panel */}
          <div className="w-full md:w-1/3 bg-[#F8FAFC] border-r border-gray-100 flex md:flex-col justify-around md:justify-start p-2 gap-1">
            <button
              onClick={() => setMethod(PayMethod.CARD)}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                method === PayMethod.CARD ? "bg-white text-[#3AC0A0] shadow-sm border border-gray-200/50" : "text-gray-500 hover:bg-gray-100/50"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-[11px] font-bold">Card</span>
            </button>

            <button
              onClick={() => {
                setMethod(PayMethod.BANK);
                setTransferTimer(120);
              }}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                method === PayMethod.BANK ? "bg-white text-[#3AC0A0] shadow-sm border border-gray-200/50" : "text-gray-500 hover:bg-gray-100/50"
              }`}
            >
              <Landmark className="h-4 w-4" />
              <span className="text-[11px] font-bold">Transfer</span>
            </button>

            <button
              onClick={() => setMethod(PayMethod.USSD)}
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                method === PayMethod.USSD ? "bg-white text-[#3AC0A0] shadow-sm border border-gray-200/50" : "text-gray-500 hover:bg-gray-100/50"
              }`}
            >
              <Hash className="h-4 w-4" />
              <span className="text-[11px] font-bold">USSD</span>
            </button>
          </div>

          {/* Form Side Right Panel */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <CheckCircle className="h-16 w-16 text-[#3AC0A0] animate-bounce" />
                <h4 className="font-bold text-[#121A2C] mt-4">Payment Successful!</h4>
                <p className="text-xs text-gray-400 mt-1">Order authorized with kitchen</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <RefreshCw className="h-12 w-12 text-[#3AC0A0] animate-spin" />
                <h4 className="font-bold text-[#121A2C] mt-4">Verifying Transaction...</h4>
                <p className="text-xs text-gray-400 mt-1">Please do not refresh this frame</p>
              </div>
            ) : (
              <form onSubmit={handlePaySubmit} className="flex-1 flex flex-col justify-between">
                
                {/* 1. Card Layout */}
                {method === PayMethod.CARD && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Enter Card details
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Card Number</label>
                        <input
                          id="pay-card-num"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").substring(0, 16))}
                          placeholder="4012 3456 7890 1234"
                          required
                          className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-xs focus:border-[#3AC0A0] focus:outline-none focus:ring-1 focus:ring-[#3AC0A0]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Expiry</label>
                          <input
                            id="pay-card-exp"
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                            placeholder="MM/YY"
                            required
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-xs focus:border-[#3AC0A0] focus:outline-none focus:ring-1 focus:ring-[#3AC0A0]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">CVV</label>
                          <input
                            id="pay-card-cvv"
                            type="password"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 3))}
                            placeholder="123"
                            required
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-xs focus:border-[#3AC0A0] focus:outline-none focus:ring-1 focus:ring-[#3AC0A0]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Bank Transfer Layout */}
                {method === PayMethod.BANK && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start space-x-2">
                      <Smartphone className="h-4 w-4 text-brand-orange mt-0.5 shrink-0" />
                      <p className="text-[10px] text-brand-green/80 leading-normal">
                        Please make a local bank transfer of <span className="font-bold">₦{totalAmount.toLocaleString()}</span> to the Paystack Checkout account below.
                      </p>
                    </div>

                    <div className="bg-[#F8FAFC] border border-gray-200/50 p-4 rounded-xl space-y-2.5 text-center">
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Bank Name</span>
                        <span className="text-xs font-bold text-[#121A2C]">Wema Bank / Paystack Test</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Account Number</span>
                        <span className="text-lg font-bold font-mono tracking-wider text-brand-green">9841289145</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-mono">
                      <span>Waiting for transfer detection...</span>
                      <span className="font-bold text-red-500">{formatTimer(transferTimer)}</span>
                    </div>
                  </div>
                )}

                {/* 3. USSD Shortcode Layout */}
                {method === PayMethod.USSD && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Select your bank to dial USSD
                    </p>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBankUssd("gtb")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition ${
                          selectedBankUssd === "gtb" ? "bg-[#3AC0A0]/5 border-[#3AC0A0]" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span>GTBank</span>
                        <span className="font-mono font-bold text-gray-400">*737*1*2#</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBankUssd("zenith")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition ${
                          selectedBankUssd === "zenith" ? "bg-[#3AC0A0]/5 border-[#3AC0A0]" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span>Zenith Bank</span>
                        <span className="font-mono font-bold text-gray-400">*966*3#</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBankUssd("access")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition ${
                          selectedBankUssd === "access" ? "bg-[#3AC0A0]/5 border-[#3AC0A0]" : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span>Access Bank</span>
                        <span className="font-mono font-bold text-gray-400">*901#</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Secure checkout action bar */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <button
                    id="btn-paystack-submit"
                    type="submit"
                    className="w-full rounded-xl bg-[#3AC0A0] hover:bg-[#32ae91] text-white font-bold py-3 text-xs tracking-wider uppercase transition active:scale-95 flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>
                      {method === PayMethod.CARD
                        ? `Pay ₦${totalAmount.toLocaleString()}`
                        : "I have made the payment"}
                    </span>
                  </button>

                  <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400">
                    <ShieldCheck className="h-4 w-4 text-[#3AC0A0]" />
                    <span>Paystack Sandbox Environment</span>
                  </div>
                </div>

              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
