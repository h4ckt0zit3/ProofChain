import { Link } from 'react-router-dom';
import { CONTRACT_ADDRESS, getEtherscanAddressUrl, ETHERSCAN_BASE } from '../contract/contractConfig';

export default function Footer() {
  const truncated = CONTRACT_ADDRESS
    ? `${CONTRACT_ADDRESS.slice(0, 6)}...${CONTRACT_ADDRESS.slice(-4)}`
    : 'Not deployed';

  return (
    <footer className="footer" id="footer">
      <div className="footer-glow" />
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">⛓</span>
              <span className="logo-text">ProofChain</span>
            </Link>
            <p className="footer-tagline">
              Tamper-proof academic certificates powered by Ethereum smart contracts. v2 with admin bypass, batch ops, and institution registry.
            </p>
            <div className="footer-contract">
              <span className="footer-label">Contract</span>
              <a
                href={getEtherscanAddressUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-address mono"
              >
                {truncated}
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigate</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/verify">Verify Certificate</Link></li>
              <li><Link to="/issue">Issue Certificate</Link></li>
              <li><Link to="/admin">Admin Panel</Link></li>
              <li><Link to="/my-certificates">My Certificates</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-col">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li>
                <a href={ETHERSCAN_BASE} target="_blank" rel="noopener noreferrer">
                  Sepolia Etherscan
                </a>
              </li>
              <li>
                <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">
                  Sepolia Faucet
                </a>
              </li>
              <li>
                <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
                  MetaMask
                </a>
              </li>
            </ul>
          </div>

          {/* How it Works mini */}
          <div className="footer-col">
            <h4 className="footer-heading">How It Works</h4>
            <ol className="footer-steps">
              <li>Connect your MetaMask wallet</li>
              <li>Admin registers institutions</li>
              <li>Issuers create certificates</li>
              <li>Anyone can verify on-chain</li>
            </ol>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} ProofChain v2 — Built on Ethereum Sepolia Testnet
          </p>
          <div className="footer-badges">
            <span className="footer-badge">
              <span className="badge-dot" />
              Sepolia Network
            </span>
            <span className="footer-badge">
              <span className="badge-dot badge-dot-blue" />
              Solidity ^0.8.20
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
