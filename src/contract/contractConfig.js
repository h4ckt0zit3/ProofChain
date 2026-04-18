import ProofChainABI from './ProofChain.json';

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x2D067dDc17F3aAd1B5B6c7b87B52031b4794c37d';

export const CONTRACT_ABI = ProofChainABI.abi;

export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

export const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Testnet',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const ETHERSCAN_BASE = 'https://sepolia.etherscan.io';

export const getEtherscanTxUrl = (txHash) => `${ETHERSCAN_BASE}/tx/${txHash}`;
export const getEtherscanAddressUrl = (address) => `${ETHERSCAN_BASE}/address/${address}`;
