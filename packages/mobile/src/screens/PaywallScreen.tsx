import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import {
  Crown,
  BarChart3,
  Play,
  Palette,
  Headphones,
  RotateCcw,
  X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSubscriptionStore } from "../stores/subscriptionStore";
import type { RootStackScreenProps } from "../navigation/types";
import type { PurchasesPackage } from "react-native-purchases";

const PRO_FEATURES = [
  {
    icon: BarChart3,
    label: "Manage Multiple Leagues",
    description: "Scheduling, scoring, record keeping all in one place",
  },
  {
    icon: Play,
    label: "Live Scoring",
    description: "Score and see matches play-by-play",
  },
  {
    icon: Palette,
    label: "Built for League Operators",
    description: "Save hours a week with automated management",
  },
  {
    icon: Headphones,
    label: "Priority Support",
    description: "Fast, dedicated help when you need it",
  },
];

export default function PaywallScreen() {
  const navigation =
    useNavigation<RootStackScreenProps<"Paywall">["navigation"]>();

  const offerings = useSubscriptionStore((s) => s.offerings);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const isLoadingOfferings = useSubscriptionStore((s) => s.isLoadingOfferings);
  const error = useSubscriptionStore((s) => s.error);
  const offeringsError = useSubscriptionStore((s) => s.offeringsError);
  const purchasePackage = useSubscriptionStore((s) => s.purchasePackage);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);
  const loadOfferings = useSubscriptionStore((s) => s.loadOfferings);

  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!offerings) {
      loadOfferings();
    }
  }, [offerings, loadOfferings]);

  const defaultPackage: PurchasesPackage | undefined =
    offerings?.current?.availablePackages?.[0];

  const handlePurchase = async () => {
    if (!defaultPackage) {
      Alert.alert(
        "Error",
        "No subscription package available. Please try again later."
      );
      return;
    }

    setPurchasing(true);
    const success = await purchasePackage(defaultPackage);
    setPurchasing(false);

    if (success) {
      navigation.goBack();
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const success = await restorePurchases();
    setPurchasing(false);

    if (success) {
      const isPro = useSubscriptionStore.getState().isPro();
      if (isPro) {
        Alert.alert("Restored!", "Your subscription has been restored.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          "No Subscription Found",
          "We couldn't find an active subscription for your account."
        );
      }
    }
  };

  const priceLabel = defaultPackage
    ? `${defaultPackage.product.priceString}/${
        defaultPackage.packageType === "MONTHLY"
          ? "mo"
          : defaultPackage.packageType === "ANNUAL"
          ? "yr"
          : "period"
      }`
    : null;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View className="w-8" />
        <Text className="text-lg font-bold text-gray-900">
          League Genius Pro
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <X color="#6b7280" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <View className="items-center px-6 pt-6 pb-8">
          <View className="bg-amber-100 rounded-full p-4 mb-4">
            <Crown color="#d97706" size={40} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
            Unlock League Genius Pro
          </Text>
          <Text className="text-gray-500 text-center text-base">
            Create and manage your leagues with powerful tools
          </Text>
        </View>

        {/* Features */}
        <View className="px-4 mb-6">
          <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {PRO_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View
                  key={feature.label}
                  className={`flex-row items-center px-4 py-4 ${
                    index < PRO_FEATURES.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <View className="bg-primary-100 rounded-lg p-2 mr-3">
                    <Icon color="#26A69A" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {feature.label}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {feature.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Price + CTA */}
        <View className="px-4">
          {priceLabel && (
            <Text className="text-center text-gray-600 text-sm mb-3">
              {priceLabel}
            </Text>
          )}

          {(error || offeringsError) && (
            <Text className="text-center text-red-500 text-sm mb-3">
              {error || offeringsError}
            </Text>
          )}

          <TouchableOpacity
            onPress={
              offeringsError && !defaultPackage ? loadOfferings : handlePurchase
            }
            disabled={purchasing || isLoading || isLoadingOfferings || (!defaultPackage && !offeringsError)}
            className={`rounded-xl py-4 items-center mb-3 ${
              purchasing || isLoading || isLoadingOfferings || (!defaultPackage && !offeringsError)
                ? "bg-primary/60"
                : "bg-primary"
            }`}
          >
            {purchasing || isLoading || isLoadingOfferings ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">
                {defaultPackage
                  ? "Subscribe Now"
                  : offeringsError
                  ? "Retry"
                  : "Loading..."}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={purchasing}
            className="flex-row items-center justify-center py-3"
          >
            <RotateCcw color="#6b7280" size={16} />
            <Text className="text-gray-500 text-sm ml-2">
              Restore Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
