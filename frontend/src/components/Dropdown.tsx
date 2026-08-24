import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Option = { id: number; name: string };

type DropdownProps = {
  label: string;
  placeholder: string;
  options: Option[];
  selectedId?: number;
  onSelect: (id: number) => void;
  required?: boolean;
};

export default function Dropdown({
  label,
  placeholder,
  options,
  selectedId,
  onSelect,
  required,
}: DropdownProps) {
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selected = options.find((o) => o.id === selectedId);

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const closeModal = () => {
    setVisible(false);
    setSearchText("");
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>

      <TouchableOpacity
        onPress={() => setVisible(true)}
        className="flex-row items-center justify-between border border-gray-200 rounded-xl px-3 py-3 bg-white"
      >
        <Text
          className={`text-sm ${
            selected ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {selected ? selected.name : placeholder}
        </Text>

        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-center items-center px-6"
          onPress={closeModal}
        >
          <Pressable
            className="bg-white rounded-2xl w-full max-w-sm max-h-[70%] p-5"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {label}
              </Text>

              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-4 bg-gray-50">
              <Ionicons
                name="search"
                size={18}
                color="#9CA3AF"
              />

              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={`Search ${label.toLowerCase()}...`}
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 py-3 text-sm text-gray-800"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchText("")}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Options */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.id);
                    closeModal();
                  }}
                  className={`flex-row items-center justify-between border rounded-xl px-4 py-3 mb-2 ${
                    selectedId === item.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={
                      selectedId === item.id
                        ? "text-blue-600 font-semibold"
                        : "text-gray-700"
                    }
                  >
                    {item.name}
                  </Text>

                  {selectedId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#3B82F6"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text className="text-center text-gray-400 py-4">
                  {searchText
                    ? "No matching options found"
                    : "No options available"}
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}