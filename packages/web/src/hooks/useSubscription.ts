/**
 * React Query hook for subscription state (entitlements + RevenueCat web SDK)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Purchases } from "@revenuecat/purchases-js";
import { meApi, type Entitlements } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { meKeys } from "./useMe";

// Singleton flag — SDK configured once per session
let rcConfigured = false;

const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || "";

export function configureRevenueCatWeb(appUserId: string) {
  if (rcConfigured || !RC_API_KEY) return;
  try {
    Purchases.configure(RC_API_KEY, appUserId);
    rcConfigured = true;
  } catch (e) {
    console.error("[RevenueCat Web] configure failed:", e);
  }
}

export const subscriptionKeys = {
  all: ["subscription"] as const,
  entitlements: () => [...subscriptionKeys.all, "entitlements"] as const,
  offerings: () => [...subscriptionKeys.all, "offerings"] as const,
};

/**
 * Fetch entitlements from backend
 */
export const useEntitlements = () => {
  const { getAuthToken, isAuthenticated } = useAuth();

  return useQuery<Entitlements>({
    queryKey: subscriptionKeys.entitlements(),
    queryFn: () => meApi.getEntitlements(getAuthToken() || undefined),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Fetch RevenueCat offerings (available products/prices)
 */
export const useOfferings = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: subscriptionKeys.offerings(),
    queryFn: async () => {
      if (!rcConfigured) return null;
      const purchases = Purchases.getSharedInstance();
      return purchases.getOfferings();
    },
    enabled: isAuthenticated && rcConfigured,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Purchase a package via RevenueCat web SDK
 */
export const usePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rcPackage: any) => {
      const purchases = Purchases.getSharedInstance();
      const { customerInfo } = await purchases.purchase({ rcPackage });
      return customerInfo;
    },
    onSuccess: () => {
      // Re-fetch entitlements from backend after webhook processes
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.entitlements(),
      });
      queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
};

/**
 * Convenience hook combining entitlements state
 */
export const useSubscription = () => {
  const { data: entitlements, isLoading, error } = useEntitlements();

  const isPro = entitlements?.tier === "pro";

  const hasFeature = (name: keyof Entitlements["features"]) =>
    entitlements?.features?.[name] === true;

  return {
    entitlements,
    isPro,
    isLoading,
    error,
    hasFeature,
  };
};
