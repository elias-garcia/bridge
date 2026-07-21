import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useConnect, useConnectors, useConnection, useDisconnect } from "wagmi";

export default function Header() {
  const { address, isConnected } = useConnection();
  const { mutate: connect } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const connectors = useConnectors();

  return (
    <Flex py={4} justify="center" borderBottomWidth={1} bg="white">
      <Container maxW="2xl">
        <Flex justify="space-between" align="center">
          <Heading size="md">Bridge</Heading>
          {isConnected && address ? (
            <Button size="sm" variant="outline" onClick={() => disconnect({})}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => connect({ connector: connectors[0] })}>
              Connect Wallet
            </Button>
          )}
        </Flex>
      </Container>
    </Flex>
  );
}
