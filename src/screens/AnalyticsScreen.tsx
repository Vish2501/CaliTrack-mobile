import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#124559] justify-center items-center px-5">
      <View className="bg-[#eff6e0] border border-[#aec3b0] rounded-2xl p-5 w-full">
        <Text className="text-xl font-bold text-[#01161e]">Analytics</Text>
        <Text className="mt-1.5 text-xs text-[#124559]">
          Progress and PRs live here.
        </Text>
      </View>
    </SafeAreaView>
  );
}
