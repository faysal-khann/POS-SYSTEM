import { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { deleteUnit, Unit } from "../services/unitApi";

type Props = {
  unit: Unit;
  index: number;
  onEdit: (unit: Unit) => void;
  onDeleted: (id: number) => void;
};

export default function UnitCard({ unit, index, onEdit, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const isActive = unit.Status === "Active";

  const handleDelete = () => {
    Alert.alert(
      "Delete Unit",
      `Delete "${unit.UnitName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteUnit(unit.UnitID);
              onDeleted(unit.UnitID);
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Couldn't delete unit.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* ACCENT BAR */}
      <View className={`w-1 ${isActive ? "bg-green-400" : "bg-red-300"}`} />

      {/* CONTENT */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center mb-2">
        <Text className="text-sm text-gray-400 mt-0.5 mr-3 ">#{index}</Text>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className="text-base font-semibold text-gray-900"
                numberOfLines={1}
              >
                {unit.UnitName}
              </Text>

              {unit.ShortName ? (
                <View className="bg-gray-100 rounded-md px-1.5 py-0.5 ml-2">
                  <Text className="text-[11px] font-medium text-gray-500">
                    {unit.ShortName}
                  </Text>
                </View>
              ) : null}
            </View>

          </View>
        </View>

        {unit.Description ? (
          <Text className="text-sm text-gray-500 leading-5 mb-2" numberOfLines={2}>
            {unit.Description}
          </Text>
        ) : null}

        <View
          className={`self-start px-2.5 py-1 rounded-full flex-row items-center ${
            isActive ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <View
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              isActive ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <Text
            className={`text-xs font-semibold ${
              isActive ? "text-green-600" : "text-red-600"
            }`}
          >
            {unit.Status}
          </Text>
        </View>
      </View>

      {/* VERTICAL ACTION RAIL */}
      <View className="justify-center items-center border-l border-gray-50 px-2">
        <Pressable
          onPress={() => onEdit(unit)}
          className="w-9 h-9 rounded-lg bg-blue-50 items-center justify-center mb-2 active:opacity-70"
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          className="w-9 h-9 rounded-lg bg-red-50 items-center justify-center active:opacity-70"
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          )}
        </Pressable>
      </View>
    </View>
  );
}