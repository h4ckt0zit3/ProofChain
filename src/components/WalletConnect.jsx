export default function WalletConnect({ wallet }) {
  if (!wallet.isConnected) {
    return (
      <div className="wallet-connect">
        <button className="btn btn-primary btn-sm" onClick={wallet.connect} id="connect-wallet-btn">
          🦊 Connect
        </button>
      </div>
    );
  }

  const truncated = `${wallet.account.slice(0, 6)}...${wallet.account.slice(-4)}`;

  return (
    <div className="wallet-connect">
      <div className="wallet-info">
        <span className="wallet-address">{truncated}</span>
        {wallet.isCorrectNetwork && (
          <span className="wallet-network">Sepolia</span>
        )}
      </div>
      <button
        className="wallet-disconnect"
        onClick={wallet.disconnect}
        id="disconnect-wallet-btn"
      >
        Disconnect
      </button>
    </div>
  );
}
