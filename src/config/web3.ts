import { base } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { injected, metaMask } from 'wagmi/connectors';

// Base Mainnet configuration
export const baseChain = base;

// TCO Token Contract Address on Base
// Update this with your actual TCO contract address
export const TCO_TOKEN_ADDRESS = import.meta.env.VITE_TCO_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

// ERC20 ABI for reading token balance
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// Wagmi config - ensure it's only created once
let wagmiConfigInstance: ReturnType<typeof createConfig> | null = null;

export function getWagmiConfig() {
  if (!wagmiConfigInstance) {
    wagmiConfigInstance = createConfig({
      chains: [baseChain],
      connectors: [
        injected(),
        metaMask(),
      ],
      transports: {
        [baseChain.id]: http(),
      },
    });
  }
  return wagmiConfigInstance;
}

export const wagmiConfig = getWagmiConfig();

