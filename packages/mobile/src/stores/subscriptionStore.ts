/* SUBSCRIPTIONS_DISABLED: entire file commented out — re-enable when adding IAP back

import { create } from "zustand";
import Purchases, {
  type PurchasesOfferings,
  type PurchasesPackage,
} from "react-native-purchases";
import { meApi, type Entitlements } from "@league-genius/shared";
import { useAuthStore } from "./authStore";

interface SubscriptionState {
  entitlements: Entitlements | null;
  offerings: PurchasesOfferings | null;
  isLoading: boolean;
  isLoadingOfferings: boolean;
  offeringsError: string | null;
  error: string | null;

  // Derived
  isPro: () => boolean;
  hasFeature: (name: keyof Entitlements["features"]) => boolean;

  // Actions
  setEntitlements: (entitlements?: Entitlements) => void;
  loadEntitlements: () => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  clearSubscription: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  entitlements: null,
  offerings: null,
  isLoading: false,
  isLoadingOfferings: false,
  offeringsError: null,
  error: null,

  isPro: () => get().entitlements?.tier === "pro",

  hasFeature: (name) => get().entitlements?.features?.[name] === true,

  setEntitlements: (entitlements) => {
    set({ entitlements: entitlements ?? null });
  },

  loadEntitlements: async () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    set({ isLoading: true, error: null });
    try {
      const entitlements = await meApi.getEntitlements(accessToken);
      set({ entitlements, isLoading: false });
    } catch (error) {
      console.error("[Subscription] Failed to load entitlements:", error);
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load entitlements",
        isLoading: false,
      });
    }
  },

  loadOfferings: async () => {
    set({ isLoadingOfferings: true, offeringsError: null });
    try {
      const offerings = await Purchases.getOfferings();
      set({ offerings, isLoadingOfferings: false });
    } catch (error) {
      console.error("[Subscription] Failed to load offerings:", error);
      set({
        offeringsError:
          error instanceof Error ? error.message : "Failed to load offerings",
        isLoadingOfferings: false,
      });
    }
  },

  purchasePackage: async (pkg) => {
    set({ isLoading: true, error: null });
    try {
      await Purchases.purchasePackage(pkg);
      // RevenueCat webhook will update the backend — re-fetch entitlements
      await get().loadEntitlements();
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      // User cancelled purchase is not an error
      if (error?.userCancelled) {
        set({ isLoading: false });
        return false;
      }
      console.error("[Subscription] Purchase failed:", error);
      set({
        error: error?.message || "Purchase failed",
        isLoading: false,
      });
      return false;
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });
    try {
      await Purchases.restorePurchases();
      // Re-fetch entitlements from backend after restore
      await get().loadEntitlements();
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error("[Subscription] Restore failed:", error);
      set({
        error:
          error instanceof Error ? error.message : "Restore failed",
        isLoading: false,
      });
      return false;
    }
  },

  clearSubscription: () => {
    set({
      entitlements: null,
      offerings: null,
      isLoading: false,
      isLoadingOfferings: false,
      offeringsError: null,
      error: null,
    });
  },
}));

*/
