import { useState } from 'react';

export default function EventLog({ events }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="event-log-toggle"
        onClick={() => setOpen(!open)}
        title="Event Log"
        id="event-log-toggle"
      >
        {open ? '✕' : '📋'}
        {events.length > 0 && !open && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#000',
            fontSize: '0.6rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {events.length}
          </span>
        )}
      </button>

      {open && (
        <div className="event-log-panel" id="event-log-panel">
          <div className="event-log-title">Event Log ({events.length})</div>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
              No events yet. Interact with the contract to see events here.
            </p>
          ) : (
            events.map((evt, i) => (
              <div className="event-item" key={i}>
                <div>
                  <span className="event-name">{evt.eventName}</span>
                  <span className="event-time"> · {evt.timestamp}</span>
                </div>
                <div className="event-block">Block #{evt.blockNumber}</div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
}
