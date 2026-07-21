import { Badge, Box, Flex, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { formatUnits } from "viem";
import { useConnection } from "wagmi";
import { useDepositsHistory } from "../hooks/useDepositsHistory.ts";

export default function BridgeHistory() {
  const { address } = useConnection();
  const { data: deposits, isLoading } = useDepositsHistory(address);

  return (
    <Box bg="white" borderWidth={1} borderRadius="xl" p={6}>
      <Text fontWeight="semibold" mb={4}>Bridge History</Text>

      {!address && (
        <Text fontSize="sm" color="gray.400" textAlign="center">Connect your wallet to see your history.</Text>
      )}

      {address && isLoading && (
        <Flex justify="center" py={4}>
          <Spinner size="sm" />
        </Flex>
      )}

      {address && !isLoading && deposits?.length === 0 && (
        <Text fontSize="sm" color="gray.400" textAlign="center">No transactions yet.</Text>
      )}

      {deposits && deposits.length > 0 && (
        <VStack gap={3} align="stretch">
          {deposits.map((deposit) => (
            <Flex key={deposit.key} justify="space-between" align="center" px={3} py={2} bg="gray.50" borderRadius="md">
              <HStack>
                <Text fontSize="sm" fontWeight="medium">{formatUnits(deposit.amount, deposit.token.decimals)} {deposit.token.symbol}</Text>
                <Text fontSize="sm" color="gray.500">{deposit.srcChainName} → {deposit.dstChainName}</Text>
              </HStack>
              <Badge colorPalette={deposit.status === "completed" ? "green" : "orange"}>
                {deposit.status === "completed" ? "Completed" : "Pending"}
              </Badge>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
}
