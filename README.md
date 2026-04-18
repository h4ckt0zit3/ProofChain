# 🎓 ProofChain — Blockchain Certificate Verification

> 🔴 Live Demo: [proof-chain-one.vercel.app](https://proof-chain-one.vercel.app) &nbsp;|&nbsp;
> 📄 Contract: [View on Etherscan](https://sepolia.etherscan.io/address/0x2D067dDc17F3aAd1B5B6c7b87B52031b4794c37d)

Eliminate academic document fraud. ProofChain stores certificate hashes immutably on Ethereum — institutions issue, students share, anyone verifies in seconds without contacting the university.

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Ethereum](https://img.shields.io/badge/Network-Sepolia-6B8AFF?logo=ethereum)

---

## 🏗 Architecture

| Layer | Technology |
|---|---|
| Smart Contract | Solidity ^0.8.20, Custom Errors, NatSpec |
| Development | Hardhat, Chai, ethers.js v6 |
| Frontend | React 18 + Vite 5, ethers.js v6 |
| Styling | React Router 6 + Custom CSS Design System |
| Network | Ethereum Sepolia Testnet (ChainId: 11155111) |

---

## 📍 Deployed Contract

| Contract | Address | Etherscan |
|---|---|---|
| ProofChain | `0x2D067dDc17F3aAd1B5B6c7b87B52031b4794c37d` | [View on Etherscan](https://sepolia.etherscan.io/address/0x2D067dDc17F3aAd1B5B6c7b87B52031b4794c37d) |

---

## 👥 Roles

| Role | Permissions |
|---|---|
| Admin | Register/revoke institutions, pause/unpause, transfer admin, issue & revoke any certificate |
| Institution | Issue and revoke certificates |
| Public | Verify any certificate — no wallet needed |

---

## ⚙️ Core Functions

### Admin Functions
| Function | Access | Description |
|---|---|---|
| `registerInstitution(addr, name)` | Admin | Whitelist a named institution |
| `revokeInstitution(addr)` | Admin | Remove institution access |
| `transferAdmin(addr)` | Admin | Transfer admin ownership |
| `pause()` / `unpause()` | Admin | Emergency pause toggle |

### Certificate Functions
| Function | Access | Description |
|---|---|---|
| `issueCertificate(hash, student)` | Admin/Issuer | Store cert hash on-chain |
| `batchIssueCertificates(hashes[], students[])` | Admin/Issuer | Batch issue certificates |
| `revokeCertificate(hash)` | Admin/Issuer | Invalidate a certificate |

### View Functions (No gas)
| Function | Description |
|---|---|
| `verifyCertificate(hash)` | Returns validity + full details |
| `getStudentCertificates(addr)` | Get all cert hashes for student |
| `getInstitutionDetails(addr)` | Get institution name + stats |

---

## 🧪 Test Coverage

```
  ProofChain
    Deployment
      ✔ Should set the deployer as admin
      ✔ Should start with 0 total certificates
      ✔ Should start with 0 total institutions
      ✔ Should start unpaused
    Admin Management
      ✔ Should transfer admin to a new address
      ✔ Should revert if non-admin tries to transfer
      ✔ Should revert on transferring to zero address
    Pause/Unpause
      ✔ Admin can pause the contract
      ✔ Admin can unpause the contract
      ✔ Non-admin cannot pause
      ✔ Cannot pause when already paused
      ✔ Cannot unpause when not paused
      ✔ Write operations revert when paused
    Institution Management
      ✔ Admin can register an institution with a name
      ✔ Admin can register an institution without a name (legacy)
      ✔ Should revert on registering zero address
      ✔ Should revert on empty name
      ✔ Should revert on double registration
      ✔ Non-admin cannot register
      ✔ Admin can revoke an institution
      ✔ Should revert revoking unregistered institution
    Certificate Issuance
      ✔ Approved issuer can issue a certificate
      ✔ Admin can issue certificates directly (bypass issuer check)
      ✔ Random user cannot issue certificates
      ✔ Cannot issue to zero address
      ✔ Cannot issue duplicate certificate hash
      ✔ Tracks institution certificate count
    Batch Certificate Issuance
      ✔ Can batch issue multiple certificates
      ✔ Reverts on array length mismatch
      ✔ Admin can batch issue
    Certificate Revocation
      ✔ Issuing institution can revoke their certificate
      ✔ Admin can revoke ANY certificate
      ✔ Random user cannot revoke
      ✔ Cannot revoke non-existent certificate
      ✔ Cannot double revoke
    View Functions
      ✔ verifyCertificate returns correct data for valid cert
      ✔ verifyCertificate returns invalid for revoked cert
      ✔ verifyCertificate returns invalid for non-existent cert
      ✔ getStudentCertificates returns correct hashes
      ✔ getStudentCertificateCount works correctly
      ✔ getInstitutionDetails returns correct data
    Integration
      ✔ Full lifecycle: register → issue → verify → revoke → verify
      ✔ Admin can bypass all flows
      ✔ Pause blocks all operations, unpause resumes

  44 passing (2s)
```

---

## 🔒 Security Considerations

- **Custom errors** replace `require()` strings for gas efficiency and machine-readable error handling
- **CEI pattern** (Checks-Effects-Interactions) applied on all state-changing functions to prevent reentrancy
- **Role-based access control** — only whitelisted institutions can issue certificates, preventing spam and fraud
- **Immutable records** — issued hashes cannot be modified, only explicitly revoked by the original issuer or admin
- **Pausable** — emergency stop mechanism to halt all write operations
- **Indexed events** on all state changes for efficient off-chain querying

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set environment variables
```bash
cp .env.example .env
# Fill in:
# SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
# PRIVATE_KEY=your_deployer_private_key
# VITE_CONTRACT_ADDRESS=0x2D067dDc17F3aAd1B5B6c7b87B52031b4794c37d
```

### 3. Compile and test
```bash
npx hardhat compile
npx hardhat test
```

### 4. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

### 5. Run frontend locally
```bash
npm run dev
```

---

## 📁 Project Structure

```
ProofChain/
├── contracts/
│   └── ProofChain.sol          # Main verification contract
├── test/
│   └── ProofChain.test.js      # 44 unit tests
├── scripts/
│   └── deploy.js               # Hardhat deploy script
├── src/
│   ├── contract/               # ABI + address config
│   ├── hooks/                  # useWallet, useProofChain
│   ├── components/             # Navbar, WalletConnect, NetworkBanner, etc.
│   ├── pages/                  # Admin, Issue, Verify, My Certificates
│   └── styles/globals.css      # Premium dark design system
├── hardhat.config.js
├── vite.config.js
└── README.md
```

---

## 📝 License

MIT
