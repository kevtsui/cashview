// components/PlaidLinkButton.web.tsx
// Web implementation — uses react-plaid-link (Plaid's official React SDK).
// Metro automatically uses this file on web, PlaidLinkButton.tsx on native.

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { usePlaidLink } from "react-plaid-link";

interface PlaidLinkButtonProps {
  linkToken: string;
  onSuccess: (publicToken: string, institution?: { id?: string; name?: string }) => void;
  onExit: () => void;
}

export default function PlaidLinkButton({ linkToken, onSuccess, onExit }: PlaidLinkButtonProps) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      onSuccess(public_token, metadata.institution ?? undefined);
    },
    onExit: () => onExit(),
  });

  return (
    <TouchableOpacity
      style={[styles.button, !ready && styles.buttonDisabled]}
      onPress={() => open()}
      disabled={!ready}
    >
      <Text style={styles.text}>+ Add account</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#0369a1",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
