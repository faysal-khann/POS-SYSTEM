import { Text, View, StyleSheet } from "react-native";
import "../../global.css"
export default function Index() {
  return (
    <View >
            <Text className="text-red-500 text-2xl bg-slate-500 rounded-2xl">Edit src/app/index.tsx to edit this screen 123.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
