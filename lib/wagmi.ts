import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'wallet-infro',
  projectId: '9c737c43d9812e9b4be2c41fe1567436', // Get from WalletConnect
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: true,
});