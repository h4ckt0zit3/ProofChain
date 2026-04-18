import { useState, useEffect } from 'react';
import RoleGuard from '../components/RoleGuard';
import { getEtherscanAddressUrl, getEtherscanTxUrl } from '../contract/contractConfig';

export default function AdminPanel({ wallet, proofChain, role }) {
  const [adminAddress, setAdminAddress] = useState('');
  const [approveAddr, setApproveAddr] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [removeAddr, setRemoveAddr] = useState('');
  const [checkAddr, setCheckAddr] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [lastTx, setLastTx] = useState(null);

  // Certificate issuance state
  const [studentAddr, setStudentAddr] = useState('');
  const [courseName, setCourseName] = useState('');
  const [issuedCert, setIssuedCert] = useState(null);

  // Certificate revocation state
  const [revokeHash, setRevokeHash] = useState('');
  const [revokeResult, setRevokeResult] = useState(null);

  // Admin transfer state
  const [newAdminAddr, setNewAdminAddr] = useState('');

  // Contract state
  const [contractPaused, setContractPaused] = useState(false);
  const [stats, setStats] = useState({ totalCerts: 0, totalInstitutions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const [addr, paused, totalCerts, totalInst] = await Promise.all([
        proofChain.getAdmin(),
        proofChain.isPaused(),
        proofChain.getTotalCertificates(),
        proofChain.getTotalInstitutions(),
      ]);
      if (addr) setAdminAddress(addr);
      setContractPaused(paused);
      setStats({ totalCerts, totalInstitutions: totalInst });
    };
    fetchData();
  }, [proofChain]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!approveAddr) return;
    try {
      const result = await proofChain.registerInstitution(approveAddr, institutionName);
      setLastTx({ type: 'approve', ...result });
      setApproveAddr('');
      setInstitutionName('');
      setStats(prev => ({ ...prev, totalInstitutions: prev.totalInstitutions + 1 }));
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    if (!removeAddr) return;
    try {
      const result = await proofChain.revokeInstitution(removeAddr);
      setLastTx({ type: 'remove', ...result });
      setRemoveAddr('');
      setStats(prev => ({ ...prev, totalInstitutions: Math.max(0, prev.totalInstitutions - 1) }));
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!checkAddr) return;
    const [isApproved, details] = await Promise.all([
      proofChain.isApprovedIssuer(checkAddr),
      proofChain.getInstitutionDetails(checkAddr),
    ]);
    setCheckResult({ address: checkAddr, isApproved, details });
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!studentAddr || !courseName) return;
    try {
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
      setStats(prev => ({ ...prev, totalCerts: prev.totalCerts + 1 }));
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

  const handleTogglePause = async () => {
    try {
      if (contractPaused) {
        await proofChain.unpauseContract();
        setContractPaused(false);
      } else {
        await proofChain.pauseContract();
        setContractPaused(true);
      }
    } catch (err) {
      // toast handled in hook
    }
  };

  const handleTransferAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminAddr) return;
    try {
      await proofChain.transferAdmin(newAdminAddr);
      setAdminAddress(newAdminAddr);
      setNewAdminAddr('');
    } catch (err) {
      // toast handled in hook
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <RoleGuard allowed={role === 'ADMIN'} role={role} requiredRole="ADMIN">
      <div className="page-container" id="admin-page">
        <div className="page-header">
          <h1 className="page-title">
            <span className="page-icon">🛡️</span>
            Admin Panel
          </h1>
          <p className="page-subtitle">Manage institutions, certificates, and contract state on the ProofChain network</p>
        </div>

        {/* Contract Paused Banner */}
        {contractPaused && (
          <div className="pause-banner" id="pause-banner">
            <span className="pause-icon">⏸️</span>
            <span>Contract is <strong>PAUSED</strong> — all write operations are disabled</span>
            <button className="btn btn-sm btn-outline" onClick={handleTogglePause} disabled={proofChain.loading}>
              Unpause
            </button>
          </div>
        )}

        {/* Dashboard Stats */}
        <div className="admin-dashboard" id="admin-dashboard">
          <div className="admin-stat-card glass-panel">
            <span className="admin-stat-icon">📜</span>
            <div className="admin-stat-data">
              <span className="admin-stat-value">{stats.totalCerts}</span>
              <span className="admin-stat-label">Certificates</span>
            </div>
          </div>
          <div className="admin-stat-card glass-panel">
            <span className="admin-stat-icon">🏛️</span>
            <div className="admin-stat-data">
              <span className="admin-stat-value">{stats.totalInstitutions}</span>
              <span className="admin-stat-label">Institutions</span>
            </div>
          </div>
          <div className="admin-stat-card glass-panel">
            <span className="admin-stat-icon">{contractPaused ? '⏸️' : '▶️'}</span>
            <div className="admin-stat-data">
              <span className={`admin-stat-value ${contractPaused ? 'text-warning' : 'text-success'}`}>
                {contractPaused ? 'Paused' : 'Active'}
              </span>
              <span className="admin-stat-label">Contract Status</span>
            </div>
          </div>
          <div className="admin-stat-card glass-panel">
            <span className="admin-stat-icon">👤</span>
            <div className="admin-stat-data">
              <span className="admin-stat-value mono" style={{ fontSize: '0.85rem' }}>
                {adminAddress ? `${adminAddress.slice(0, 6)}...${adminAddress.slice(-4)}` : '...'}
              </span>
              <span className="admin-stat-label">Admin</span>
            </div>
          </div>
        </div>

        {/* ── Contract Controls ── */}
        <div className="admin-section-header" id="contract-controls-section">
          <h2 className="section-title">
            <span className="section-icon">⚙️</span>
            Contract Controls
          </h2>
          <p className="section-subtitle">Pause/unpause operations and transfer admin ownership</p>
        </div>

        <div className="admin-grid admin-grid-2col">
          {/* Pause/Unpause */}
          <div className="glass-panel form-panel" id="pause-panel">
            <h2 className="panel-title">
              <span className="panel-icon">{contractPaused ? '▶️' : '⏸️'}</span>
              {contractPaused ? 'Unpause Contract' : 'Pause Contract'}
            </h2>
            <p className="panel-description">
              {contractPaused
                ? 'The contract is currently paused. Unpause to re-enable all operations.'
                : 'Emergency pause — halts all certificate issuance and institutional operations.'}
            </p>
            <button
              className={`btn btn-full ${contractPaused ? 'btn-primary' : 'btn-warning'}`}
              onClick={handleTogglePause}
              disabled={proofChain.loading}
              id="toggle-pause-btn"
            >
              {proofChain.loading ? 'Processing...' : contractPaused ? '▶️ Unpause Contract' : '⏸️ Pause Contract'}
            </button>
          </div>

          {/* Transfer Admin */}
          <div className="glass-panel form-panel" id="transfer-admin-panel">
            <h2 className="panel-title">
              <span className="panel-icon">👑</span>
              Transfer Admin
            </h2>
            <p className="panel-description">
              Transfer admin ownership to another address. This action is irreversible.
            </p>
            <form onSubmit={handleTransferAdmin} className="form">
              <div className="form-group">
                <label htmlFor="new-admin-address" className="form-label">New Admin Address</label>
                <input
                  id="new-admin-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={newAdminAddr}
                  onChange={(e) => setNewAdminAddr(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-danger btn-full"
                disabled={proofChain.loading}
                id="transfer-admin-btn"
              >
                {proofChain.loading ? 'Processing...' : '⚠️ Transfer Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Institution Management Section ── */}
        <div className="admin-section-header" id="issuer-management-section">
          <h2 className="section-title">
            <span className="section-icon">🏛️</span>
            Institution Management
          </h2>
          <p className="section-subtitle">Register, revoke, and check institution status</p>
        </div>

        <div className="admin-grid">
          {/* Register Institution */}
          <div className="glass-panel form-panel" id="approve-issuer-panel">
            <h2 className="panel-title">
              <span className="panel-icon">✅</span>
              Register Institution
            </h2>
            <form onSubmit={handleApprove} className="form">
              <div className="form-group">
                <label htmlFor="institution-name" className="form-label">
                  Institution Name
                </label>
                <input
                  id="institution-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. MIT, Stanford, Harvard"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="approve-address" className="form-label">
                  Ethereum Address
                </label>
                <input
                  id="approve-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={approveAddr}
                  onChange={(e) => setApproveAddr(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={proofChain.loading}
                id="approve-issuer-btn"
              >
                {proofChain.loading ? 'Processing...' : 'Register Institution'}
              </button>
            </form>
          </div>

          {/* Revoke Institution */}
          <div className="glass-panel form-panel" id="remove-issuer-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🚫</span>
              Revoke Institution
            </h2>
            <form onSubmit={handleRemove} className="form">
              <div className="form-group">
                <label htmlFor="remove-address" className="form-label">
                  Ethereum Address
                </label>
                <input
                  id="remove-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={removeAddr}
                  onChange={(e) => setRemoveAddr(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-danger btn-full"
                disabled={proofChain.loading}
                id="remove-issuer-btn"
              >
                {proofChain.loading ? 'Processing...' : 'Revoke Institution'}
              </button>
            </form>
          </div>

          {/* Check Institution Status */}
          <div className="glass-panel form-panel" id="check-issuer-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🔎</span>
              Check Institution Status
            </h2>
            <form onSubmit={handleCheck} className="form">
              <div className="form-group">
                <label htmlFor="check-address" className="form-label">
                  Ethereum Address
                </label>
                <input
                  id="check-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={checkAddr}
                  onChange={(e) => setCheckAddr(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-outline btn-full"
                id="check-issuer-btn"
              >
                Check Status
              </button>
            </form>
            {checkResult && (
              <div className={`check-result ${checkResult.isApproved ? 'result-valid' : 'result-invalid'}`}>
                <span className="result-icon">{checkResult.isApproved ? '✅' : '❌'}</span>
                <div>
                  <p className="result-address mono">{checkResult.address}</p>
                  {checkResult.details && checkResult.details.name && (
                    <p className="result-name">{checkResult.details.name}</p>
                  )}
                  <p className="result-status">
                    {checkResult.isApproved ? 'Approved Institution' : 'Not an Approved Institution'}
                  </p>
                  {checkResult.details && checkResult.isApproved && (
                    <p className="result-stats">
                      {checkResult.details.certificatesIssued} certificates issued
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Certificate Management Section ── */}
        <div className="admin-section-header" id="certificate-management-section">
          <h2 className="section-title">
            <span className="section-icon">📜</span>
            Certificate Management
          </h2>
          <p className="section-subtitle">Issue and revoke certificates directly as admin</p>
        </div>

        <div className="admin-grid admin-grid-2col">
          {/* Issue Certificate */}
          <div className="glass-panel form-panel" id="admin-issue-panel">
            <h2 className="panel-title">
              <span className="panel-icon">✍️</span>
              Issue Certificate
            </h2>
            <p className="panel-description">
              As admin, you can issue certificates directly — no approved issuer status needed.
            </p>
            <form onSubmit={handleIssue} className="form">
              <div className="form-group">
                <label htmlFor="admin-student-address" className="form-label">Student Address</label>
                <input
                  id="admin-student-address"
                  type="text"
                  className="form-input mono"
                  placeholder="0x..."
                  value={studentAddr}
                  onChange={(e) => setStudentAddr(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="admin-course-name" className="form-label">Course Name</label>
                <input
                  id="admin-course-name"
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
                id="admin-issue-cert-btn"
              >
                {proofChain.loading ? (
                  <><span className="btn-spinner" /> Issuing...</>
                ) : (
                  'Issue Certificate'
                )}
              </button>
            </form>

            {/* Issue Success Result */}
            {issuedCert && (
              <div className="issue-result result-valid" id="admin-issue-result">
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
                      {issuedCert.certHash.slice(0, 16)}...
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

          {/* Revoke Certificate */}
          <div className="glass-panel form-panel" id="admin-revoke-panel">
            <h2 className="panel-title">
              <span className="panel-icon">🗑️</span>
              Revoke Certificate
            </h2>
            <p className="panel-description">
              As admin, you can revoke <strong>any</strong> certificate — even those issued by other institutions.
            </p>
            <form onSubmit={handleRevoke} className="form">
              <div className="form-group">
                <label htmlFor="admin-revoke-hash" className="form-label">Certificate Hash</label>
                <input
                  id="admin-revoke-hash"
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
                id="admin-revoke-cert-btn"
              >
                {proofChain.loading ? 'Processing...' : 'Revoke Certificate'}
              </button>
            </form>

            {revokeResult && (
              <div className="issue-result result-revoked" id="admin-revoke-result">
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
