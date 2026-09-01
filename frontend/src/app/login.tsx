import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Dropdown from "../components/Dropdown";
import { login, saveSession, verifyCredentials } from "../services/authApi";
import { getCompanies } from "../services/companyApi";

type CompanyOption = { id: number; name: string };

export default function LoginScreen() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const [companyId, setCompanyId] = useState<number | undefined>();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [verifiedCompany, setVerifiedCompany] = useState<{
    CompanyID: number;
    CompanyName: string;
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!usernameOrEmail.trim() || !password) {
      setVerifiedCompany(null);
      setCompanyId(undefined);
      return;
    }

    const timeout = setTimeout(async () => {
      setVerifying(true);
      const result = await verifyCredentials(usernameOrEmail.trim(), password);
      if (result) {
        setVerifiedCompany(result);
        setCompanyId(result.CompanyID);
      } else {
        setVerifiedCompany(null);
        setCompanyId(undefined);
      }
      setVerifying(false);
    }, 600);

    return () => clearTimeout(timeout);
  }, [usernameOrEmail, password]);
  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanies();
        setCompanies(
          data.map((c) => ({ id: c.CompanyID, name: c.CompanyName })),
        );
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Couldn't load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!companyId) {
      Alert.alert("Missing field", "Please select a company.");
      return;
    }
    if (!usernameOrEmail.trim()) {
      Alert.alert("Missing field", "Please enter your username or email.");
      return;
    }
    if (!password) {
      Alert.alert("Missing field", "Please enter your password.");
      return;
    }

    try {
      setSigningIn(true);
      const session = await login({
        CompanyID: companyId,
        UsernameOrEmail: usernameOrEmail,
        Password: password,
      });
      await saveSession(session);
      router.replace("/(tabs)/products");
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.detail || "Login failed. Please try again.";
      Alert.alert("Login Failed", message);
    } finally {
      setSigningIn(false);
    }
  };

  if (loadingCompanies) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        className="px-6"
      >
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-3">
            <Ionicons name="storefront-outline" size={30} color="#fff" />
          </View>
          <Text className="text-xl font-bold text-gray-900">POS SYSTEM</Text>
          <Text className="text-sm text-gray-400 mt-1">
            Sign in to continue
          </Text>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Username or Email <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            placeholder="Enter username or email"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 bg-white"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Password <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-white">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 text-sm text-gray-800"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Dropdown
            label="Company"
            placeholder="Select company"
            required
            options={companies}
            selectedId={companyId}
            onSelect={setCompanyId}
          />
          {verifying ? (
            <View className="flex-row items-center mt-1.5 px-1">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-xs text-gray-400 ml-2">
                Verifying credentials...
              </Text>
            </View>
          )  : null}
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={signingIn}
          className="bg-blue-600 rounded-xl py-3.5 items-center flex-row justify-center"
        >
          {signingIn ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">Sign In</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
