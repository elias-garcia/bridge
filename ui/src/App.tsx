import { Box, Button, Container, Flex, Heading, Tabs } from "@chakra-ui/react";
import BridgeForm from "./components/BridgeForm.tsx";
import BridgeHistory from "./components/BridgeHistory.tsx";

export default function App() {
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Flex py={4} justify="center" borderBottomWidth={1} bg="white">
        <Container maxW="2xl">
          <Flex justify="space-between" align="center">
            <Heading size="md">Bridge</Heading>
            <Button size="sm" variant="outline">Connect Wallet</Button>
          </Flex>
        </Container>
      </Flex>

      <Container maxW="2xl" pt={10}>
        <Tabs.Root defaultValue="bridge" variant="line">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="bridge">Bridge</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="bridge">
            <BridgeForm />
          </Tabs.Content>
          <Tabs.Content value="history">
            <BridgeHistory />
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  );
}
