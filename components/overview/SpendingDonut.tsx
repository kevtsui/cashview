// Native stub
import { View, Text } from "react-native";
import { T } from "@/lib/tokens";
export default function SpendingDonut(_: { categories: any[]; total: number }) {
  return (
    <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: T.fgMuted, fontSize: 13 }}>Chart (web only)</Text>
    </View>
  );
}
