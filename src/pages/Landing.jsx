import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CONTRACT_ADDRESS, getEtherscanAddressUrl } from '../contract/contractConfig';

function truncateAddress(addr) {
  if (!addr || addr === '0x0000000000000000000000000000000000000000') return 'Not deployed';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function BlockchainCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let nodes = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2.5;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.12 * (1 - dist / 180)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="blockchain-canvas" />;
}

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

const STEPS = [
  {
    num: '01',
    icon: '🦊',
    title: 'Connect Wallet',
    desc: 'Link your MetaMask wallet to the Sepolia testnet to interact with the ProofChain smart contract.',
  },
  {
    num: '02',
    icon: '🛡️',
    title: 'Admin Approves Issuers',
    desc: 'The contract owner whitelists trusted institutions and educators as authorized certificate issuers.',
  },
  {
    num: '03',
    icon: '📜',
    title: 'Issue Certificates',
    desc: 'Approved issuers create on-chain certificates with student address, course name, and grade.',
  },
  {
    num: '04',
    icon: '✅',
    title: 'Verify Anytime',
    desc: 'Anyone can instantly verify a certificate\'s authenticity — no wallet or sign-in required.',
  },
];

const FEATURES_LIST = [
  {
    icon: '🔐',
    title: 'Immutable Records',
    desc: 'Every certificate is permanently stored on the Ethereum blockchain — impossible to tamper with.',
  },
  {
    icon: '⚡',
    title: 'Instant Verification',
    desc: 'Verify any certificate in seconds with just the hash — no sign-in or wallet connection needed.',
  },
  {
    icon: '🏛️',
    title: 'Institution Registry',
    desc: 'Named institutions with on-chain registration, certificate counters, and approval tracking.',
  },
  {
    icon: '👑',
    title: 'Admin Controls',
    desc: 'Pause/unpause, transfer admin, and direct certificate issuance — complete governance built-in.',
  },
  {
    icon: '📦',
    title: 'Batch Operations',
    desc: 'Issue multiple certificates in a single transaction — save gas and time for large classes.',
  },
  {
    icon: '🛡️',
    title: 'Role-Based Access',
    desc: 'Three roles: Admin, Issuer, and Public — each with precise permissions enforced on-chain.',
  },
];

export default function Landing({ proofChain, wallet }) {
  const [stats, setStats] = useState({ totalCerts: 0, totalInstitutions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [total, instCount] = await Promise.all([
          proofChain.getTotalCertificates(),
          proofChain.getTotalInstitutions(),
        ]);
        setStats({ totalCerts: total, totalInstitutions: instCount });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, [proofChain]);

  return (
    <div className="landing-page" id="landing-page">
      <BlockchainCanvas />

      {/* ── Hero ── */}
      <section className="hero" id="hero-section">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Live on Ethereum Sepolia
        </div>
        <h1 className="hero-title">
          <span className="title-gradient">ProofChain</span>
        </h1>
        <p className="hero-tagline">Tamper-Proof Academic Certificates on Ethereum</p>
        <p className="hero-description">
          Issue, verify, and manage blockchain-backed academic credentials.
          Every certificate is immutable, transparent, and instantly verifiable.
        </p>

        <div className="hero-cta-group">
          <Link to="/verify" className="btn btn-primary btn-lg" id="cta-verify">
            <span>🔍</span> Verify Certificate
          </Link>
          <Link to="/issue" className="btn btn-outline btn-lg" id="cta-issue">
            <span>📜</span> Issue Certificate
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="hero-trust">
          <div className="trust-item">
            <span className="trust-icon">🔐</span>
            <span className="trust-text">End-to-End On-Chain</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon">⚡</span>
            <span className="trust-text">Instant Verification</span>
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <span className="trust-icon">🌍</span>
            <span className="trust-text">Open & Transparent</span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section" id="stats-section">
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <span className="stat-value">
              <AnimatedCounter target={stats.totalCerts} />
            </span>
            <span className="stat-label">Certificates Issued</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value">
              <AnimatedCounter target={stats.totalInstitutions} />
            </span>
            <span className="stat-label">Registered Institutions</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value mono">
              <a
                href={getEtherscanAddressUrl(CONTRACT_ADDRESS)}
                target="_blank"
                rel="noopener noreferrer"
                className="stat-link"
              >
                {truncateAddress(CONTRACT_ADDRESS)}
              </a>
            </span>
            <span className="stat-label">Contract Address</span>
          </div>
          <div className="stat-card glass-panel">
            <span className="stat-value">Sepolia</span>
            <span className="stat-label">Network</span>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section" id="how-section">
        <div className="section-header">
          <span className="section-badge">PROCESS</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            A simple four-step workflow powered by Ethereum smart contracts
          </p>
        </div>
        <div className="steps-grid">
          {STEPS.map((step, i) => (
            <div className="step-card glass-panel" key={step.num} style={{ animationDelay: `${i * 120}ms` }}>
              <div className="step-num">{step.num}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {i < STEPS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features-section">
        <div className="section-header">
          <span className="section-badge">FEATURES</span>
          <h2 className="section-title">Core Capabilities</h2>
          <p className="section-subtitle">
            Everything you need to manage blockchain-backed academic credentials
          </p>
        </div>
        <div className="features-grid features-grid-3col">
          {FEATURES_LIST.map((feature, i) => (
            <div className="feature-card glass-panel" key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta-section" id="cta-section">
        <div className="cta-inner glass-panel">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-desc">
            Connect your wallet and start issuing tamper-proof certificates on the blockchain.
          </p>
          <div className="cta-buttons">
            <Link to="/admin" className="btn btn-primary btn-lg" id="cta-admin">
              🛡️ Admin Panel
            </Link>
            <Link to="/verify" className="btn btn-outline btn-lg" id="cta-verify-bottom">
              🔍 Verify Certificate
            </Link>
            <Link to="/my-certificates" className="btn btn-outline btn-lg" id="cta-my-certs">
              🎓 My Certificates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
