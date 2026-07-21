import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { useState, type FormEvent } from "react";
import { formatUnits, type Chain } from "viem";
import { useConnect, useConnectors, useConnection, useSwitchChain } from "wagmi";
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS } from "../constants.ts";
import { useBridge } from "../hooks/useBridge.ts";
import { useTokenBalance } from "../hooks/useTokenBalance.ts";
import type { Token } from "../types.ts";
import { parseAmount } from "../utils.ts";
import BridgeButton from "./BridgeButton.tsx";
import TokenSelector from "./TokenSelector.tsx";

const NUMERIC_INPUT_REGEX = /^\d*\.?\d*$/;

export default function BridgeForm({ onDepositSuccess }: { onDepositSuccess: () => void }) {
  const { address, isConnected, chainId } = useConnection();
  const { mutate: connect } = useConnect();
  const connectors = useConnectors();
  const { mutate: switchChain } = useSwitchChain();

  const [sourceChain, setSourceChain] = useState<Chain>(SUPPORTED_CHAINS[0]);
  const [destinationChain, setDestinationChain] = useState<Chain>(SUPPORTED_CHAINS[1]);
  const [token, setToken] = useState<Token>(SUPPORTED_TOKENS[0]);
  const [amount, setAmount] = useState("");

  const parsedAmount = parseAmount(amount, token.decimals);

  const { data: sourceBalance } = useTokenBalance(token, sourceChain, address);
  const { data: destinationBalance } = useTokenBalance(token, destinationChain, address);

  const { bridge, isReady } = useBridge(token, sourceChain, parsedAmount);
  const [isPending, setIsPending] = useState(false);

  const isInsufficientBalance = sourceBalance !== undefined && parsedAmount > 0n && parsedAmount > sourceBalance;
  const isWrongChain = isConnected && chainId !== sourceChain.id;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!address) {
      return;
    }
    setIsPending(true);
    try {
      await bridge(address);
      setAmount("");
      onDepositSuccess();
    } catch(e) {
      console.error(e)
    } finally {
      setIsPending(false);
    }
  }

  function toggleChains() {
    setSourceChain(destinationChain);
    setDestinationChain(sourceChain);
  }

  return (
    <form onSubmit={handleSubmit}>
      <VStack gap={4} align="stretch">

        {/* From + To with overlapping toggle */}
        <Box position="relative">
          {/* From box */}
          <Box bg="white" borderWidth={1} borderRadius="xl" p={4} mb={1}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">From: {sourceChain.name}</Text>
              <TokenSelector value={token} onChange={setToken} />
            </Flex>
            <Flex justify="space-between" align="flex-end">
              <input
                value={amount}
                onChange={(e) => {
                  if (NUMERIC_INPUT_REGEX.test(e.target.value)) {
                    setAmount(e.target.value);
                  }
                }}
                placeholder="0"
                style={{ fontSize: "2rem", fontWeight: 600, border: "none", outline: "none", background: "transparent", width: "100%" }}
              />
              <Text fontSize="sm" color="gray.400" flexShrink={0}>
                Balance: {sourceBalance !== undefined ? formatUnits(sourceBalance, token.decimals) : "0"}
              </Text>
            </Flex>
          </Box>

          {/* Toggle button — absolutely centered between the two boxes */}
          <Flex
            position="absolute"
            left="50%"
            top="50%"
            transform="translate(-50%, -50%)"
            zIndex={2}
          >
            <Button
              type="button"
              borderRadius="full"
              bg="white"
              color="gray.700"
              borderWidth={2}
              borderColor="gray.300"
              onClick={toggleChains}
              width={10}
              height={10}
              fontSize="xl"
              boxShadow="sm"
              variant="plain"
              _hover={{ bg: "gray.50", borderColor: "gray.400" }}
            >
              ↕
            </Button>
          </Flex>

          {/* To box */}
          <Box bg="gray.50" borderWidth={1} borderRadius="xl" p={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">To: {destinationChain.name}</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="medium">{token.name} ({token.symbol})</Text>
            </Flex>
            <Flex justify="space-between" align="flex-end">
              <Text fontSize="4xl" fontWeight="semibold" color={amount ? "gray.800" : "gray.300"}>
                {amount || "0"}
              </Text>
              <Text fontSize="sm" color="gray.400">
                Balance: {destinationBalance !== undefined ? formatUnits(destinationBalance, token.decimals) : "0"}
              </Text>
            </Flex>
          </Box>
        </Box>

        <BridgeButton
          isConnected={isConnected}
          isWrongChain={!!isWrongChain}
          isPending={isPending || !isReady}
          hasAmount={parsedAmount > 0n}
          isInsufficientBalance={isInsufficientBalance}
          sourceChainName={sourceChain.name}
          onConnect={() => connect({ connector: connectors[0] })}
          onSwitchChain={() => switchChain({ chainId: sourceChain.id })}
        />

      </VStack>
    </form>
  );
}
