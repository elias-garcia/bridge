import { Box, Button, Flex, HStack, Input, Text, VStack } from "@chakra-ui/react";

export default function BridgeForm() {
  return (
    <Box bg="white" borderWidth={1} borderRadius="xl" p={6}>
      <VStack gap={4} align="stretch">

        {/* From */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>From</Text>
          <Flex justify="space-between" align="center" bg="gray.50" px={3} py={2} borderRadius="md">
            <Text fontWeight="medium">Base Sepolia</Text>
            <Text fontSize="sm" color="gray.500">Balance: 0.00 ARKV</Text>
          </Flex>
        </Box>

        {/* Swap arrow */}
        <Flex justify="center">
          <Button size="xs" variant="ghost">↓</Button>
        </Flex>

        {/* To */}
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>To</Text>
          <Flex justify="space-between" align="center" bg="gray.50" px={3} py={2} borderRadius="md">
            <Text fontWeight="medium">Linea Sepolia</Text>
            <Text fontSize="sm" color="gray.500">Balance: 0.00 wARKV</Text>
          </Flex>
        </Box>

        {/* Amount */}
        <Box>
          <HStack justify="space-between" mb={1}>
            <Text fontSize="xs" color="gray.500">Amount</Text>
            <Text fontSize="xs" color="gray.500" cursor="pointer">Max</Text>
          </HStack>
          <Input placeholder="0.00" size="lg" />
        </Box>

        {/* Submit */}
        <Button colorScheme="blue" size="lg" width="full" mt={2}>
          Bridge
        </Button>

      </VStack>
    </Box>
  );
}
