import "../../global.css";
import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getStoredToken } from "../services/authApi";

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      if (!token) {
        router.replace("/login");
      }
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}