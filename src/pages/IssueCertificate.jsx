import { useState } from 'react';
import RoleGuard from '../components/RoleGuard';
import { getEtherscanTxUrl } from '../contract/contractConfig';

export default function IssueCertificate({ wallet, proofChain, role }) {
  const [studentAddr, setStudentAddr] = useState('');
  const [courseName, setCourseName] = useState('');
  const [issuedCert, setIssuedCert] = useState(null);

  const [revokeHash, setRevokeHash] = useState('');
  const [revokeResult, setRevokeResult] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!studentAddr || !courseName) return;
    try {
      // Generate cert hash from course name + student address + timestamp
      const encoder = new TextEncoder();
      const data = encoder.encode(`${courseName}-${studentAddr}-${Date.now()}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const certHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const result = await proofChain.issueCertificate(certHash, studentAddr);
      setIssuedCert({
        certHash,
        txHash: result.txHash,
        student: studentAddr,
        course: courseName,
      });
      setStudentAddr('');
      setCourseName('');
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleRevoke = async (e) => {
    e.preventDefault();
    if (!revokeHash) return;
    try {
      const result = await proofChain.revokeCertificate(revokeHash);
      setRevokeResult({ certHash: revokeHash, txHash: result.txHash });
      setRevokeHash('');
    } catch (err) {
      // toast handled in hook
    }
  };

  return (
    <RoleGuard allowed={role === 'ISSUER' || role === 'ADMIN'} role={role} requiredRole="ISSUER">
      <div className="page-container" id="issue-page">
        <div className="page-header">
          <h1 className="page-title">
            <span className="page-icon">📜</span>
            Issue Certificate
          </h1>
          <p className="page-subtitle">Create tamper-proof credentials on the Ethereum blockchain</p>
        </div>

        <div className="issue-grid">
          {/* Issue Form */}
          <div className="glass-panel form-panel" id="issue-form-panel">
            <h2 className="panel-title">
              <span className="panel-icon">✍️</span>
              New Certificate
            </h2>
            <p className="panel-description">
              {role === 'ADMIN'
                ? 'As admin, you can issue certificates directly without being registered as an institution.'
                : 'Issue a blockchain-backed certificate to a student. The cert hash is generated automatically.'}
            </p>
            <form onSubmit={handleIssue} className="form">
              <div className="form-group">
                <label htmlFor="student-address" className="form-label">Student Address</label>
                <input
                  id="student-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={studentAddr}
                  onChange={(e) => setStudentAddr(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="course-name" className="form-label">Course Name</label>
                <input
                  id="course-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Blockchain Fundamentals"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={proofChain.loading}
                id="issue-cert-btn"
              >
                {proofChain.loading ? (
                  <><span className="btn-spinner" /> Issuing...</>
                ) : (
                  'Issue Certificate'
                )}
              </button>
            </form>

            {/* Success Result */}
            {issuedCert && (
              <div className="issue-result result-valid" id="issue-result">
                <div className="result-header">
                  <span className="result-icon">🎉</span>
                  <h3>Certificate Issued!</h3>
                </div>
                <div className="result-details">
                  <div className="detail-row">
                    <span className="detail-label">Certificate Hash</span>
                    <span
                      className="detail-value mono highlight copyable"
                      onClick={() => copyToClipboard(issuedCert.certHash)}
                      title="Click to copy"
                    >
                      {issuedCert.certHash.slice(0, 18)}... 📋
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Student</span>
                    <span className="detail-value mono">{issuedCert.student}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Course</span>
                    <span className="detail-value">{issuedCert.course}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tx Hash</span>
                    <a
                      href={getEtherscanTxUrl(issuedCert.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-value mono link"
                    >
                      {issuedCert.txHash.slice(0, 16)}...
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Revoke Section */}
          <div className="glass-panel form-panel" id="revoke-form-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🗑️</span>
              Revoke Certificate
            </h2>
            <p className="panel-description">
              {role === 'ADMIN'
                ? 'As admin, you can revoke any certificate regardless of who issued it.'
                : 'Only the original issuing institution can revoke a certificate.'}
            </p>
            <form onSubmit={handleRevoke} className="form">
              <div className="form-group">
                <label htmlFor="revoke-hash" className="form-label">Certificate Hash</label>
                <input
                  id="revoke-hash"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={revokeHash}
                  onChange={(e) => setRevokeHash(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-danger btn-full"
                disabled={proofChain.loading}
                id="revoke-cert-btn"
              >
                {proofChain.loading ? 'Processing...' : 'Revoke Certificate'}
              </button>
            </form>

            {revokeResult && (
              <div className="issue-result result-revoked" id="revoke-result">
                <div className="result-header">
                  <span className="result-icon">⚠️</span>
                  <h3>Certificate Revoked</h3>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Cert Hash</span>
                  <span className="detail-value mono">{revokeResult.certHash.slice(0, 16)}...</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tx Hash</span>
                  <a
                    href={getEtherscanTxUrl(revokeResult.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-value mono link"
                  >
                    {revokeResult.txHash.slice(0, 16)}...
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
