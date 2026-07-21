import { Button } from "@chakra-ui/react";

type Props = {
  isConnected: boolean;
  isWrongChain: boolean;
  isPending: boolean;
  hasAmount: boolean;
  isInsufficientBalance: boolean;
  sourceChainName: string;
  onConnect: () => void;
  onSwitchChain: () => void;
};

export default function BridgeButton({
  isConnected,
  isWrongChain,
  isPending,
  hasAmount,
  isInsufficientBalance,
  sourceChainName,
  onConnect,
  onSwitchChain,
}: Props) {
  if (!isConnected) {
    return <Button type="button" size="lg" width="full" onClick={onConnect}>Connect Wallet</Button>;
  }

  if (isWrongChain) {
    return <Button type="button" size="lg" width="full" onClick={onSwitchChain}>Switch to {sourceChainName}</Button>;
  }

  if (isInsufficientBalance) {
    return <Button size="lg" width="full" disabled>Insufficient balance</Button>;
  }

  return (
    <Button type="submit" size="lg" width="full" loading={isPending} disabled={!hasAmount || isPending}>
      Bridge
    </Button>
  );
}
