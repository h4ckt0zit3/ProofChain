import { useState, useEffect } from 'react';
import { getEtherscanAddressUrl } from '../contract/contractConfig';

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateHash(hash) {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

export default function MyCertificates({ wallet, proofChain }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);

  const copyToClipboard = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchCerts = async () => {
      if (!wallet.isConnected || !wallet.account) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const hashes = await proofChain.getStudentCertificates(wallet.account);

        // Fetch full details for each cert including institution name
        const details = await Promise.all(
          hashes.map(async (hash) => {
            try {
              const cert = await proofChain.verifyCertificate(hash);
              let institutionName = '';
              try {
                const instDetails = await proofChain.getInstitutionDetails(cert.institution);
                if (instDetails) institutionName = instDetails.name;
              } catch {}
              return { hash, ...cert, institutionName };
            } catch {
              return { hash, error: true };
            }
          })
        );
        setCertificates(details);
      } catch (err) {
        setError(err.message || 'Failed to fetch certificates');
      } finally {
        setLoading(false);
      }
    };

    fetchCerts();
  }, [wallet.account, wallet.isConnected, proofChain]);

  if (!wallet.isConnected) {
    return (
      <div className="page-container" id="my-certs-page">
        <div className="page-header">
          <h1 className="page-title">
            <span className="page-icon">🎓</span>
            My Certificates
          </h1>
        </div>
        <div className="empty-state glass-panel">
          <div className="empty-icon">🔗</div>
          <h2>Connect Your Wallet</h2>
          <p>Connect your MetaMask wallet to view certificates issued to your address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" id="my-certs-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="page-icon">🎓</span>
          My Certificates
        </h1>
        <p className="page-subtitle">
          Certificates issued to <span className="mono">{wallet.account}</span>
        </p>
      </div>

      {/* Certificate count badge */}
      {!loading && !error && certificates.length > 0 && (
        <div className="cert-count-badge">
          <span className="cert-count-num">{certificates.length}</span>
          <span className="cert-count-text">certificate{certificates.length !== 1 ? 's' : ''} found</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner-large" />
          <p>Fetching your certificates from the blockchain...</p>
        </div>
      ) : error ? (
        <div className="error-state glass-panel">
          <span className="result-icon">❌</span>
          <p>{error}</p>
        </div>
      ) : certificates.length === 0 ? (
        <div className="empty-state glass-panel" id="no-certs-state">
          <div className="empty-icon">📭</div>
          <h2>No Certificates Found</h2>
          <p>No certificates have been issued to your connected wallet address yet.</p>
        </div>
      ) : (
        <div className="my-certs-grid">
          {certificates.map((cert) => (
            <div
              key={cert.hash}
              className={`cert-card glass-panel ${cert.isValid ? 'cert-valid' : 'cert-revoked'}`}
              id={`cert-card-${cert.hash?.slice(0, 10)}`}
            >
              <div className="cert-card-header">
                <span
                  className="cert-card-id mono copyable"
                  onClick={() => copyToClipboard(cert.hash)}
                  title="Click to copy full hash"
                >
                  {truncateHash(cert.hash)} {copied === cert.hash ? '✓' : '📋'}
                </span>
                <span className={`cert-card-status ${cert.isValid ? 'status-valid' : 'status-revoked'}`}>
                  {cert.isValid ? '✅ Valid' : '❌ Revoked'}
                </span>
              </div>

              {cert.error ? (
                <p className="cert-card-error">Failed to load details</p>
              ) : (
                <div className="cert-card-body">
                  <div className="cert-card-meta">
                    {cert.institutionName && (
                      <div className="meta-row">
                        <span className="meta-label">Institution</span>
                        <span className="meta-value institution-name">{cert.institutionName}</span>
                      </div>
                    )}
                    <div className="meta-row">
                      <span className="meta-label">{cert.institutionName ? 'Address' : 'Institution'}</span>
                      <a
                        href={getEtherscanAddressUrl(cert.institution)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="meta-value mono link"
                      >
                        {cert.institution?.slice(0, 6)}...{cert.institution?.slice(-4)}
                      </a>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Issued</span>
                      <span className="meta-value">{formatDate(cert.issuedAt)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
