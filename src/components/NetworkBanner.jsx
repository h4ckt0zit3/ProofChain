export default function NetworkBanner({ wallet }) {
  if (!wallet.isConnected || wallet.isCorrectNetwork) return null;

  return (
    <div className="network-banner" id="network-banner">
      <div className="network-banner-inner">
        <span className="network-banner-icon">⚠️</span>
        <span className="network-banner-text">
          You're connected to <strong>{wallet.networkName}</strong>. ProofChain requires <strong>Sepolia Testnet</strong>.
        </span>
        <button
          className="btn btn-sm btn-primary"
          onClick={wallet.switchToSepolia}
          id="switch-network-btn"
        >
          Switch to Sepolia
        </button>
      </div>
    </div>
  );
}
