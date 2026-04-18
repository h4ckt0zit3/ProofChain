import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useWallet } from './hooks/useWallet';
import { useProofChain } from './hooks/useProofChain';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TxToast from './components/TxToast';
import EventLog from './components/EventLog';
import NetworkBanner from './components/NetworkBanner';

import Landing from './pages/Landing';
import AdminPanel from './pages/AdminPanel';
import IssueCertificate from './pages/IssueCertificate';
import VerifyCertificate from './pages/VerifyCertificate';
import MyCertificates from './pages/MyCertificates';

export default function App() {
  const wallet = useWallet();
  const proofChain = useProofChain(wallet.signer, wallet.provider);
  const [role, setRole] = useState('PUBLIC');

  useEffect(() => {
    const determineRole = async () => {
      if (!wallet.isConnected || !wallet.account) {
        setRole('PUBLIC');
        return;
      }
      try {
        const adminAddr = await proofChain.getAdmin();
        if (adminAddr && adminAddr.toLowerCase() === wallet.account.toLowerCase()) {
          setRole('ADMIN');
          return;
        }
        const isIssuer = await proofChain.isApprovedIssuer(wallet.account);
        if (isIssuer) {
          setRole('ISSUER');
          return;
        }
        setRole('PUBLIC');
      } catch (err) {
        console.error('Role detection error:', err);
        setRole('PUBLIC');
      }
    };
    determineRole();
  }, [wallet.isConnected, wallet.account, proofChain]);

  return (
    <BrowserRouter>
      <div className="app" id="app-root">
        <Navbar wallet={wallet} role={role} />
        <NetworkBanner wallet={wallet} />
        <TxToast toast={proofChain.toast} onClose={() => proofChain.setToast(null)} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing proofChain={proofChain} wallet={wallet} />} />
            <Route path="/admin" element={<AdminPanel wallet={wallet} proofChain={proofChain} role={role} />} />
            <Route path="/issue" element={<IssueCertificate wallet={wallet} proofChain={proofChain} role={role} />} />
            <Route path="/verify" element={<VerifyCertificate proofChain={proofChain} />} />
            <Route path="/my-certificates" element={<MyCertificates wallet={wallet} proofChain={proofChain} />} />
          </Routes>
        </main>
        <Footer />
        <EventLog events={proofChain.eventLog} />
      </div>
    </BrowserRouter>
  );
}
