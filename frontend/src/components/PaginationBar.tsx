import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type PaginationBarProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[]; // 👈 change default options here
};

export default function PaginationBar({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}: PaginationBarProps) {
  return (
    <View className="bg-white border border-gray-200 px-4 py-2 absolute bottom-7 left-0 right-0 rounded-full mx-4">
      {/* Page size selector */}
      <View className="flex-row items-center justify-center mb-1">
        <Text className="text-xs text-gray-500 mr-2">Show:</Text>
        {pageSizeOptions.map((size) => (
          <TouchableOpacity
            key={size}
            onPress={() => onPageSizeChange(size)}
            className={`px-3 py-1 rounded-lg mx-1 ${
              pageSize === size ? "bg-blue-500" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs ${
                pageSize === size ? "text-white font-semibold" : "text-gray-600"
              }`}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Prev / Next */}
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={onPrev}
          className={`flex-row items-center px-3 py-2 rounded-lg ${
            currentPage === 1 ? "opacity-40" : ""
          }`}
        >
          <Ionicons name="chevron-back" size={16} color="#3B82F6" />
          <Text className="text-blue-500 font-medium ml-1">Previous</Text>
        </TouchableOpacity>

        <Text className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={onNext}
          className={`flex-row items-center px-3 py-2 rounded-lg ${
            currentPage === totalPages ? "opacity-40" : ""
          }`}
        >
          <Text className="text-blue-500 font-medium mr-1">Next</Text>
          <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}