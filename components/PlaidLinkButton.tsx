// components/PlaidLinkButton.tsx
// Native implementation — uses react-native-plaid-link-sdk.
// Used on iOS and Android. Web uses PlaidLinkButton.web.tsx instead.

import {
  PlaidLink,
  LinkSuccess,
  LinkExit,
  LinkLogLevel,
  LinkIOSPresentationStyle,
} from "react-native-plaid-link-sdk";

interface PlaidLinkButtonProps {
  linkToken: string;
  onSuccess: (publicToken: string, institution?: { id?: string; name?: string }) => void;
  onExit: () => void;
}

export default function PlaidLinkButton({ linkToken, onSuccess, onExit }: PlaidLinkButtonProps) {
  return (
    <PlaidLink
      tokenConfig={{
        token: linkToken,
        noLoadingState: false,
        logLevel: __DEV__ ? LinkLogLevel.DEBUG : LinkLogLevel.ERROR,
      }}
      iOSPresentationStyle={LinkIOSPresentationStyle.MODAL}
      onSuccess={(success: LinkSuccess) => {
        onSuccess(success.publicToken, success.metadata.institution ?? undefined);
      }}
      onExit={(_exit: LinkExit) => onExit()}
    >
      {null}
    </PlaidLink>
  );
}
