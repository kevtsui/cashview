// Native stub
import { View, Text } from "react-native";
import { T } from "@/lib/tokens";
export default function NetWorthChart(_: { series: any[] }) {
  return (
    <View style={{ height: 180, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: T.fgMuted, fontSize: 13 }}>Chart (web only)</Text>
    </View>
  );
}
