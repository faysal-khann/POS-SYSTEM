import { View, Text, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { ExpenseByCategory } from "../services/expenseApi";

const COLORS = [
  "#3B82F6", // Office Rent
  "#A3A35A", // Purchase
  "#22C55E", // Salaries
  "#FBBF24", // Utilities
  "#F97316", // Marketing
  "#4169C1", // Travel
  "#9DB2D1", // Others
];

export default function ExpenseDonutChart({
  data,
  total,
}: {
  data: ExpenseByCategory[];
  total: number;
}) {
  const { width } = useWindowDimensions();

  // Responsive chart size
  const chartSize = width < 380 ? 135 : 150;

  const strokeWidth = 20;
  const radius = (chartSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4">
      {/* Title */}
      <Text className="text-sm font-semibold text-gray-900 mb-4">
        Expense By Category
      </Text>

      <View className="flex-row items-center">
        {/* ================= DONUT ================= */}
        <View
          className="items-center justify-center"
          style={{
            width: chartSize,
            height: chartSize,
          }}
        >
          <Svg
            width={chartSize}
            height={chartSize}
            viewBox={`0 0 ${chartSize} ${chartSize}`}
          >
            {/* Background ring */}
            <Circle
              cx={chartSize / 2}
              cy={chartSize / 2}
              r={radius}
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Expense segments */}
            {data.map((item, index) => {
              const percent = Number(item.Percent) || 0;

              const segmentLength =
                (percent / 100) * circumference;

              const dashOffset =
                -(cumulativePercent / 100) * circumference;

              cumulativePercent += percent;

              return (
                <Circle
                  key={item.CategoryName}
                  cx={chartSize / 2}
                  cy={chartSize / 2}
                  r={radius}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${segmentLength} ${
                    circumference - segmentLength
                  }`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  rotation="-90"
                  origin={`${chartSize / 2}, ${chartSize / 2}`}
                />
              );
            })}
          </Svg>

          {/* Center text */}
          <View className="absolute items-center justify-center">
            <Text
              className="font-bold text-gray-900"
              style={{ fontSize: chartSize < 140 ? 14 : 16 }}
            >
              ৳ {total.toLocaleString("en-BD")}
            </Text>

            <Text className="text-xs text-gray-500 mt-0.5">
              Total
            </Text>
          </View>
        </View>

        {/* ================= LEGEND ================= */}
        <View className="flex-1 ml-4">
          {data.map((item, index) => (
            <View
              key={item.CategoryName}
              className="flex-row items-center mb-3"
            >
              {/* Color dot */}
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />

              {/* Category name */}
              <Text
                className="text-xs text-gray-700 flex-1"
                numberOfLines={1}
              >
                {item.CategoryName}
              </Text>

              {/* Percentage + amount */}
              <Text className="text-xs text-gray-500 ml-1">
                {Number(item.Percent).toFixed(1)}% (
                ৳{Number(item.Amount).toLocaleString("en-BD")}
                )
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}