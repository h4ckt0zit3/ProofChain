import { useState } from 'react';
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

export default function VerifyCertificate({ proofChain }) {
  const [certHash, setCertHash] = useState('');
  const [certResult, setCertResult] = useState(null);
  const [certError, setCertError] = useState('');
  const [loading, setLoading] = useState(false);
  const [institutionName, setInstitutionName] = useState('');

  const [studentLookup, setStudentLookup] = useState('');
  const [studentCerts, setStudentCerts] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certHash) return;
    setLoading(true);
    setCertError('');
    setCertResult(null);
    setInstitutionName('');
    try {
      const result = await proofChain.verifyCertificate(certHash);
      // Check if it's a non-existent certificate
      if (result.institution === '0x0000000000000000000000000000000000000000' && result.issuedAt === 0) {
        setCertError('No certificate found with this hash.');
      } else {
        setCertResult({ hash: certHash, ...result });
        // Try to fetch institution name
        try {
          const details = await proofChain.getInstitutionDetails(result.institution);
          if (details && details.name) {
            setInstitutionName(details.name);
          }
        } catch {}
      }
    } catch (err) {
      setCertError(err.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLookup = async (e) => {
    e.preventDefault();
    if (!studentLookup) return;
    setLookupLoading(true);
    setLookupError('');
    setStudentCerts(null);
    try {
      const hashes = await proofChain.getStudentCertificates(studentLookup);
      setStudentCerts({ address: studentLookup, hashes });
    } catch (err) {
      setLookupError(err.message || 'Failed to lookup certificates');
    } finally {
      setLookupLoading(false);
    }
  };

  const quickVerify = async (hash) => {
    setCertHash(hash);
    setLoading(true);
    setCertError('');
    setCertResult(null);
    setInstitutionName('');
    try {
      const result = await proofChain.verifyCertificate(hash);
      if (result.institution === '0x0000000000000000000000000000000000000000' && result.issuedAt === 0) {
        setCertError('No certificate found with this hash.');
      } else {
        setCertResult({ hash, ...result });
        try {
          const details = await proofChain.getInstitutionDetails(result.institution);
          if (details && details.name) setInstitutionName(details.name);
        } catch {}
      }
    } catch (err) {
      setCertError(err.message || 'Failed to verify');
    } finally {
      setLoading(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container" id="verify-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="page-icon">🔍</span>
          Verify Certificate
        </h1>
        <p className="page-subtitle">Verify any certificate's authenticity — no wallet required</p>
      </div>

      <div className="verify-grid">
        {/* Verify by Hash */}
        <div className="glass-panel form-panel" id="verify-by-id-panel">
          <h2 className="panel-title">
            <span className="panel-icon">🔎</span>
            Verify by Certificate Hash
          </h2>
          <form onSubmit={handleVerify} className="form">
            <div className="form-group">
              <label htmlFor="cert-hash-input" className="form-label">Certificate Hash</label>
              <input
                id="cert-hash-input"
                type="text"
                className="form-input mono"
                placeholder="0x..."
                value={certHash}
                onChange={(e) => setCertHash(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              id="verify-cert-btn"
            >
              {loading ? <><span className="btn-spinner" /> Verifying...</> : 'Verify Certificate'}
            </button>
          </form>

          {certError && (
            <div className="verify-error" id="verify-error">
              <span className="result-icon">❌</span>
              <p>{certError}</p>
            </div>
          )}

          {certResult && (
            <div
              className={`cert-result-card glass-panel ${certResult.isValid ? 'cert-valid' : 'cert-revoked'}`}
              id="cert-result-card"
            >
              <div className="cert-status-banner">
                <span className="cert-status-icon">
                  {certResult.isValid ? '✅' : '❌'}
                </span>
                <span className="cert-status-text">
                  {certResult.isValid ? 'VALID CERTIFICATE' : 'REVOKED CERTIFICATE'}
                </span>
              </div>

              <div className="cert-details">
                <div className="detail-row">
                  <span className="detail-label">Certificate Hash</span>
                  <span
                    className="detail-value mono highlight copyable"
                    onClick={() => copyToClipboard(certResult.hash)}
                    title="Click to copy full hash"
                  >
                    {truncateHash(certResult.hash)} {copied ? '✓' : '📋'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Student Address</span>
                  <a
                    href={getEtherscanAddressUrl(certResult.student)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-value mono link"
                  >
                    {certResult.student}
                  </a>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Institution</span>
                  <div className="detail-value-group">
                    {institutionName && (
                      <span className="detail-value institution-name">{institutionName}</span>
                    )}
                    <a
                      href={getEtherscanAddressUrl(certResult.institution)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-value mono link"
                    >
                      {certResult.institution}
                    </a>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Issued Date</span>
                  <span className="detail-value">{formatDate(certResult.issuedAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status-badge ${certResult.isValid ? 'status-valid' : 'status-revoked'}`}>
                    {certResult.isValid ? '✅ Valid' : '❌ Revoked'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lookup by Student */}
        <div className="glass-panel form-panel" id="student-lookup-panel">
          <h2 className="panel-title">
            <span className="panel-icon">🎓</span>
            Student Lookup
          </h2>
          <p className="panel-description">
            Find all certificates issued to a specific student address.
          </p>
          <form onSubmit={handleStudentLookup} className="form">
            <div className="form-group">
              <label htmlFor="student-lookup-input" className="form-label">Student Address</label>
              <input
                id="student-lookup-input"
                type="text"
                className="form-input mono"
                placeholder="0x..."
                value={studentLookup}
                onChange={(e) => setStudentLookup(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-outline btn-full"
              disabled={lookupLoading}
              id="student-lookup-btn"
            >
              {lookupLoading ? 'Searching...' : 'Find Certificates'}
            </button>
          </form>

          {lookupError && (
            <div className="verify-error">
              <span className="result-icon">❌</span>
              <p>{lookupError}</p>
            </div>
          )}

          {studentCerts && (
            <div className="student-certs-list" id="student-certs-list">
              <h3 className="list-title">
                {studentCerts.hashes.length} Certificate{studentCerts.hashes.length !== 1 ? 's' : ''} Found
              </h3>
              {studentCerts.hashes.length === 0 ? (
                <p className="empty-state-text">No certificates found for this address.</p>
              ) : (
                <div className="cert-id-grid">
                  {studentCerts.hashes.map(hash => (
                    <button
                      key={hash}
                      className="cert-id-chip"
                      onClick={() => quickVerify(hash)}
                    >
                      <span className="chip-hash">#</span>{truncateHash(hash)}
                      <span className="chip-action">Verify →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
