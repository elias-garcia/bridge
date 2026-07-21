import { NativeSelect } from "@chakra-ui/react";
import { SUPPORTED_TOKENS } from "../constants.ts";
import type { Token } from "../types.ts";

type Props = {
  value: Token;
  onChange: (token: Token) => void;
};

export default function TokenSelector({ value, onChange }: Props) {
  return (
    <NativeSelect.Root size="sm" width="44">
      <NativeSelect.Field
        value={value.symbol}
        onChange={(e) => {
          const selected = SUPPORTED_TOKENS.find((t) => t.symbol === e.target.value);

          if (selected) {
            onChange(selected);
          }
        }}
      >
        {SUPPORTED_TOKENS.map((t) => (
          <option key={t.symbol} value={t.symbol}>{t.name} ({t.symbol})</option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
