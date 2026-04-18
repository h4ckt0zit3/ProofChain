import { Link } from 'react-router-dom';

export default function RoleGuard({ children, allowed, role, requiredRole }) {
  if (allowed) return children;

  return (
    <div className="page-container">
      <div className="role-guard-blocked">
        <div className="role-guard-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>
          {role === 'PUBLIC'
            ? 'Connect your wallet to access this page.'
            : `This page requires ${requiredRole} privileges. Your current role is ${role}.`}
        </p>
        <div className="role-guard-badge">
          <span className={`role-badge ${role === 'ADMIN' ? 'badge-admin' : role === 'ISSUER' ? 'badge-issuer' : 'badge-public'}`}>
            {role}
          </span>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/" className="btn btn-outline">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
