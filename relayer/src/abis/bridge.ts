export const BridgeAbi = [
  {
    type: "function",
    name: "claim",
    inputs: [
      {
        name: "m",
        type: "tuple",
        components: [
          { name: "srcChainId", type: "uint256" },
          { name: "dstChainId", type: "uint256" },
          { name: "srcToken", type: "address" },
          { name: "recipient", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      { name: "sig", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "processed",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "messageId",
    inputs: [
      { name: "srcChainId", type: "uint256" },
      { name: "dstChainId", type: "uint256" },
      { name: "srcToken", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "pure",
  },
] as const;
