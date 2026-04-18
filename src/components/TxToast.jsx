import { getEtherscanTxUrl } from '../contract/contractConfig';

const ICONS = {
  pending: '⏳',
  confirmed: '✅',
  error: '❌',
};

export default function TxToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`tx-toast toast-${toast.type}`} id="tx-toast">
      {toast.type === 'pending' ? (
        <span className="toast-spinner" />
      ) : (
        <span className="toast-icon">{ICONS[toast.type]}</span>
      )}
      <div className="toast-message">
        {toast.message}
        {toast.txHash && (
          <a
            href={getEtherscanTxUrl(toast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="toast-link"
          >
            View on Etherscan →
          </a>
        )}
      </div>
      {toast.type !== 'pending' && (
        <button className="toast-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  );
}
