import { Badge, Box, Flex, HStack, Link, Text, VStack } from "@chakra-ui/react";

const MOCK_TRANSFERS = [
  {
    id: "1",
    from: "Base Sepolia",
    to: "Linea Sepolia",
    amount: "100.00 ARKV",
    status: "completed",
    txHash: "0xabc123",
  },
  {
    id: "2",
    from: "Linea Sepolia",
    to: "Base Sepolia",
    amount: "50.00 wARKV",
    status: "pending",
    txHash: "0xdef456",
  },
];

export default function BridgeHistory() {
  return (
    <Box bg="white" borderWidth={1} borderRadius="xl" p={6}>
      <Text fontWeight="semibold" mb={4}>Bridge History</Text>
      <VStack gap={3} align="stretch">
        {MOCK_TRANSFERS.map((transfer) => (
          <Flex key={transfer.id} justify="space-between" align="center" px={3} py={2} bg="gray.50" borderRadius="md">
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontSize="sm" fontWeight="medium">{transfer.amount}</Text>
                <Text fontSize="sm" color="gray.500">{transfer.from} → {transfer.to}</Text>
              </HStack>
              <Link fontSize="xs" color="gray.400" href="#" target="_blank">
                {transfer.txHash.slice(0, 10)}...
              </Link>
            </VStack>
            <Badge colorScheme={transfer.status === "completed" ? "green" : "yellow"}>
              {transfer.status}
            </Badge>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
