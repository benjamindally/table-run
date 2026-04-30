import React, { useEffect, useState } from "react";
import { BarChart3, Play, Palette, Headphones, Crown, RotateCcw } from "lucide-react";
import Modal from "./Modal";
import { useOfferings, usePurchase } from "../hooks/useSubscription";

const PRO_FEATURES = [
  { icon: BarChart3, label: "Advanced Statistics", description: "Deep player and team analytics" },
  { icon: Play, label: "Live Scoring Replay", description: "Review matches play-by-play" },
  { icon: Palette, label: "Custom Branding", description: "Personalize your league's look" },
  { icon: Headphones, label: "Priority Support", description: "Fast, dedicated help when you need it" },
];

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { data: offerings, isLoading: loadingOfferings } = useOfferings();
  const purchaseMutation = usePurchase();
  const [error, setError] = useState<string | null>(null);

  const defaultPackage = offerings?.current?.availablePackages?.[0];

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    if (!defaultPackage) return;
    setError(null);

    try {
      await purchaseMutation.mutateAsync(defaultPackage);
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Purchase failed. Please try again.");
    }
  };

  const priceString = defaultPackage?.rcBillingProduct?.currentPrice?.formattedPrice;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="League Genius Pro" maxWidth="sm">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          Unlock League Genius Pro
        </h3>
        <p className="text-gray-500 text-sm">
          Create and manage your leagues with powerful tools
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-6">
        {PRO_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.label} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {priceString && (
        <p className="text-center text-sm text-gray-600 mb-3">{priceString}/month</p>
      )}

      {error && (
        <p className="text-center text-sm text-red-500 mb-3">{error}</p>
      )}

      <button
        onClick={handlePurchase}
        disabled={purchaseMutation.isPending || loadingOfferings || !defaultPackage}
        className="w-full bg-primary hover:bg-primary-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
      >
        {purchaseMutation.isPending ? "Processing..." : defaultPackage ? "Subscribe Now" : "Loading..."}
      </button>

      <button
        onClick={onClose}
        className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 flex items-center justify-center gap-1.5 transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Restore Purchases
      </button>
    </Modal>
  );
};

export default PaywallModal;
