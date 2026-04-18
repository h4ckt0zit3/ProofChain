import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_PARAMS } from '../contract/contractConfig';

const STORAGE_KEY = 'proofchain_connected';

const NETWORK_NAMES = {
  '0x1': 'Ethereum Mainnet',
  '0xaa36a7': 'Sepolia Testnet',
  '0x5': 'Goerli Testnet',
  '0x89': 'Polygon',
  '0x13881': 'Mumbai',
  '0x7a69': 'Hardhat Local',
  '0x539': 'Hardhat Local',
};

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [chainId, setChainId] = useState(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const updateNetwork = useCallback(async (ethereum) => {
    try {
      const cid = await ethereum.request({ method: 'eth_chainId' });
      setChainId(cid);
      setNetworkName(NETWORK_NAMES[cid] || `Unknown (${cid})`);
      setIsCorrectNetwork(cid === SEPOLIA_CHAIN_ID);
    } catch (e) {
      console.error('Failed to get chain:', e);
    }
  }, []);

  const setupProvider = useCallback(async (ethereum) => {
    const prov = new BrowserProvider(ethereum);
    setProvider(prov);
    const s = await prov.getSigner();
    setSigner(s);
    return s;
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to use ProofChain.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        await setupProvider(window.ethereum);
        await updateNetwork(window.ethereum);
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
  }, [setupProvider, updateNetwork]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setNetworkName('');
    setIsCorrectNetwork(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_PARAMS],
          });
        } catch (addError) {
          console.error('Failed to add Sepolia:', addError);
        }
      }
    }
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    const autoConnect = async () => {
      if (localStorage.getItem(STORAGE_KEY) === 'true' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            await setupProvider(window.ethereum);
            await updateNetwork(window.ethereum);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (err) {
          console.error('Auto-connect failed:', err);
        }
      }
    };
    autoConnect();
  }, [setupProvider, updateNetwork]);

  // Listen for MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        setIsConnected(true);
        await setupProvider(window.ethereum);
      }
    };

    const handleChainChanged = (_chainId) => {
      setChainId(_chainId);
      setNetworkName(NETWORK_NAMES[_chainId] || `Unknown (${_chainId})`);
      setIsCorrectNetwork(_chainId === SEPOLIA_CHAIN_ID);
      // Refresh provider on chain change
      if (window.ethereum && localStorage.getItem(STORAGE_KEY) === 'true') {
        setupProvider(window.ethereum);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, setupProvider]);

  return {
    account,
    provider,
    signer,
    connect,
    disconnect,
    isConnected,
    networkName,
    chainId,
    isCorrectNetwork,
    switchToSepolia,
  };
}
