import { Box, Container, Portal, Stack, Tabs, Toast, Toaster, createToaster } from "@chakra-ui/react";
import { useState } from "react";
import Header from "./components/Header.tsx";
import BridgeForm from "./components/BridgeForm.tsx";
import BridgeHistory from "./components/BridgeHistory.tsx";

const toaster = createToaster({ placement: "top-end", pauseOnPageIdle: true });

export default function App() {
  const [activeTab, setActiveTab] = useState<"bridge" | "history">("bridge");

  function onDepositSuccess() {
    setActiveTab("history");
    toaster.create({ title: "Bridge submitted", description: "Your funds will arrive on the destination chain shortly.", type: "success", duration: 5000 });
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Header />

      <Container maxW="2xl" pt={10}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => {
            if (e.value === "bridge" || e.value === "history") {
              setActiveTab(e.value);
            }
          }}
          variant="line"
        >
          <Tabs.List mb={6}>
            <Tabs.Trigger value="bridge">Bridge</Tabs.Trigger>
            <Tabs.Trigger value="history">History</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="bridge">
            <BridgeForm onDepositSuccess={onDepositSuccess} />
          </Tabs.Content>
          <Tabs.Content value="history">
            <BridgeHistory />
          </Tabs.Content>
        </Tabs.Root>
      </Container>

      <Portal>
        <Toaster toaster={toaster} insetInline={{ mdDown: "4" }}>
          {(toast) => (
            <Toast.Root width={{ md: "sm" }}>
              <Toast.Indicator />
              <Stack gap="1" flex="1" maxWidth="100%">
                {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
              </Stack>
            </Toast.Root>
          )}
        </Toaster>
      </Portal>
    </Box>
  );
}
