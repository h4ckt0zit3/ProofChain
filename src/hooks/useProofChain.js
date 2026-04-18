import { useState, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, getEtherscanTxUrl } from '../contract/contractConfig';

function parseRevertReason(error) {
  if (error?.reason) return error.reason;
  if (error?.data?.message) return error.data.message;
  if (error?.message) {
    const match = error.message.match(/reason="([^"]+)"/);
    if (match) return match[1];
    const revert = error.message.match(/reverted with reason string '([^']+)'/);
    if (revert) return revert[1];
    // Try custom error name
    const customErr = error.message.match(/reverted with custom error '([^']+)'/);
    if (customErr) return customErr[1];
    if (error.message.includes('user rejected')) return 'Transaction rejected by user';
    if (error.message.length > 100) return error.message.substring(0, 100) + '...';
    return error.message;
  }
  return 'Transaction failed';
}

export function useProofChain(signer, provider) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'pending'|'confirmed'|'error', message, txHash }
  const [eventLog, setEventLog] = useState([]);

  const showToast = useCallback((type, message, txHash = null) => {
    setToast({ type, message, txHash });
    if (type !== 'pending') {
      setTimeout(() => setToast(null), 8000);
    }
  }, []);

  const addEvent = useCallback((blockNumber, eventName, params) => {
    setEventLog(prev => [{
      blockNumber,
      eventName,
      params,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev]);
  }, []);

  const getReadContract = useCallback(() => {
    if (provider) {
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }
    // Fallback: create a read-only provider
    const readProvider = new BrowserProvider(window.ethereum);
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
  }, [provider]);

  const getWriteContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }, [signer]);

  // === WRITE FUNCTIONS ===

  const registerInstitution = useCallback(async (institutionAddress, name = '') => {
    setLoading(true);
    showToast('pending', 'Registering institution...');
    try {
      const contract = getWriteContract();
      let tx;
      if (name) {
        tx = await contract['registerInstitution(address,string)'](institutionAddress, name);
      } else {
        tx = await contract['registerInstitution(address)'](institutionAddress);
      }
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'InstitutionRegistered';
        } catch { return false; }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        addEvent(receipt.blockNumber, 'InstitutionRegistered', {
          institution: parsed.args[0],
          name: parsed.args[1],
        });
      }

      showToast('confirmed', 'Institution registered successfully!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const revokeInstitution = useCallback(async (institutionAddress) => {
    setLoading(true);
    showToast('pending', 'Revoking institution...');
    try {
      const contract = getWriteContract();
      const tx = await contract.revokeInstitution(institutionAddress);
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'InstitutionRevoked';
        } catch { return false; }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        addEvent(receipt.blockNumber, 'InstitutionRevoked', { institution: parsed.args[0] });
      }

      showToast('confirmed', 'Institution revoked successfully!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const issueCertificate = useCallback(async (certHash, studentAddress) => {
    setLoading(true);
    showToast('pending', 'Issuing certificate...');
    try {
      const contract = getWriteContract();
      const tx = await contract.issueCertificate(certHash, studentAddress);
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'CertificateIssued';
        } catch { return false; }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        addEvent(receipt.blockNumber, 'CertificateIssued', {
          institution: parsed.args[0],
          student: parsed.args[1],
          certHash: parsed.args[2],
        });
      }

      showToast('confirmed', 'Certificate issued successfully!', tx.hash);
      return { txHash: tx.hash, receipt, certHash };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const batchIssueCertificates = useCallback(async (certHashes, studentAddresses) => {
    setLoading(true);
    showToast('pending', `Batch issuing ${certHashes.length} certificates...`);
    try {
      const contract = getWriteContract();
      const tx = await contract.batchIssueCertificates(certHashes, studentAddresses);
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      addEvent(receipt.blockNumber, 'BatchCertificatesIssued', {
        count: certHashes.length,
      });

      showToast('confirmed', `${certHashes.length} certificates issued!`, tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const revokeCertificate = useCallback(async (certHash) => {
    setLoading(true);
    showToast('pending', 'Revoking certificate...');
    try {
      const contract = getWriteContract();
      const tx = await contract.revokeCertificate(certHash);
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'CertificateRevoked';
        } catch { return false; }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        addEvent(receipt.blockNumber, 'CertificateRevoked', {
          certHash: parsed.args[0],
          revokedBy: parsed.args[1],
        });
      }

      showToast('confirmed', 'Certificate revoked!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const transferAdmin = useCallback(async (newAdminAddress) => {
    setLoading(true);
    showToast('pending', 'Transferring admin...');
    try {
      const contract = getWriteContract();
      const tx = await contract.transferAdmin(newAdminAddress);
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      addEvent(receipt.blockNumber, 'AdminTransferred', { newAdmin: newAdminAddress });

      showToast('confirmed', 'Admin transferred successfully!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const pauseContract = useCallback(async () => {
    setLoading(true);
    showToast('pending', 'Pausing contract...');
    try {
      const contract = getWriteContract();
      const tx = await contract.pause();
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      addEvent(receipt.blockNumber, 'ContractPaused', {});
      showToast('confirmed', 'Contract paused!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  const unpauseContract = useCallback(async () => {
    setLoading(true);
    showToast('pending', 'Unpausing contract...');
    try {
      const contract = getWriteContract();
      const tx = await contract.unpause();
      showToast('pending', 'Awaiting confirmation...', tx.hash);
      const receipt = await tx.wait();

      addEvent(receipt.blockNumber, 'ContractUnpaused', {});
      showToast('confirmed', 'Contract unpaused!', tx.hash);
      return { txHash: tx.hash, receipt };
    } catch (err) {
      showToast('error', parseRevertReason(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getWriteContract, showToast, addEvent]);

  // === READ FUNCTIONS ===

  const verifyCertificate = useCallback(async (certHash) => {
    try {
      let contract;
      if (provider) {
        contract = getReadContract();
      } else if (window.ethereum) {
        const fallbackProvider = new BrowserProvider(window.ethereum);
        contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, fallbackProvider);
      } else {
        throw new Error('No provider available');
      }
      const result = await contract.verifyCertificate(certHash);
      return {
        isValid: result[0],
        institution: result[1],
        student: result[2],
        issuedAt: Number(result[3]),
      };
    } catch (err) {
      throw new Error(parseRevertReason(err));
    }
  }, [provider, getReadContract]);

  const getStudentCertificates = useCallback(async (studentAddress) => {
    try {
      let contract;
      if (provider) {
        contract = getReadContract();
      } else if (window.ethereum) {
        const fallbackProvider = new BrowserProvider(window.ethereum);
        contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, fallbackProvider);
      } else {
        throw new Error('No provider available');
      }
      const hashes = await contract.getStudentCertificates(studentAddress);
      return hashes;
    } catch (err) {
      throw new Error(parseRevertReason(err));
    }
  }, [provider, getReadContract]);

  const isApprovedIssuer = useCallback(async (address) => {
    try {
      const contract = getReadContract();
      return await contract.approvedIssuers(address);
    } catch (err) {
      console.error('isApprovedIssuer error:', err);
      return false;
    }
  }, [getReadContract]);

  const getAdmin = useCallback(async () => {
    try {
      const contract = getReadContract();
      return await contract.admin();
    } catch (err) {
      console.error('getAdmin error:', err);
      return null;
    }
  }, [getReadContract]);

  const getTotalCertificates = useCallback(async () => {
    try {
      const contract = getReadContract();
      const total = await contract.totalCertificates();
      return Number(total);
    } catch (err) {
      console.error('getTotalCertificates error:', err);
      return 0;
    }
  }, [getReadContract]);

  const getTotalInstitutions = useCallback(async () => {
    try {
      const contract = getReadContract();
      const total = await contract.totalInstitutions();
      return Number(total);
    } catch (err) {
      console.error('getTotalInstitutions error:', err);
      return 0;
    }
  }, [getReadContract]);

  const getInstitutionDetails = useCallback(async (institutionAddress) => {
    try {
      const contract = getReadContract();
      const result = await contract.getInstitutionDetails(institutionAddress);
      return {
        name: result[0],
        approved: result[1],
        registeredAt: Number(result[2]),
        certificatesIssued: Number(result[3]),
      };
    } catch (err) {
      console.error('getInstitutionDetails error:', err);
      return null;
    }
  }, [getReadContract]);

  const isPaused = useCallback(async () => {
    try {
      const contract = getReadContract();
      return await contract.paused();
    } catch (err) {
      console.error('isPaused error:', err);
      return false;
    }
  }, [getReadContract]);

  return {
    loading,
    toast,
    setToast,
    eventLog,
    registerInstitution,
    revokeInstitution,
    issueCertificate,
    batchIssueCertificates,
    revokeCertificate,
    transferAdmin,
    pauseContract,
    unpauseContract,
    verifyCertificate,
    getStudentCertificates,
    isApprovedIssuer,
    getAdmin,
    getTotalCertificates,
    getTotalInstitutions,
    getInstitutionDetails,
    isPaused,
  };
}
