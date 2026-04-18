import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  🚀 ProofChain v2 — Deployment");
  console.log("═══════════════════════════════════════════════\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const network = hre.network.name;

  console.log(`📡  Network:   ${network}`);
  console.log(`👤  Deployer:  ${deployer.address}`);
  console.log(`💰  Balance:   ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy
  console.log("⏳  Deploying ProofChain...");
  const ProofChain = await hre.ethers.getContractFactory("ProofChain");
  const proofchain = await ProofChain.deploy();
  await proofchain.waitForDeployment();

  const address = await proofchain.getAddress();
  const deployTx = proofchain.deploymentTransaction();

  console.log(`\n✅  ProofChain deployed successfully!\n`);
  console.log("───────────────────────────────────────────────");
  console.log(`  Contract:  ${address}`);
  console.log(`  Tx Hash:   ${deployTx?.hash || "N/A"}`);
  console.log(`  Admin:     ${deployer.address}`);
  console.log("───────────────────────────────────────────────\n");

  // Etherscan links
  if (network === "sepolia") {
    console.log(`🔗  Etherscan: https://sepolia.etherscan.io/address/${address}`);
    console.log(`🔗  Tx:        https://sepolia.etherscan.io/tx/${deployTx?.hash}\n`);
  }

  // Auto-update .env file
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("VITE_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /VITE_CONTRACT_ADDRESS=.*/,
        `VITE_CONTRACT_ADDRESS=${address}`
      );
    } else {
      envContent += `\nVITE_CONTRACT_ADDRESS=${address}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("📝  .env updated with new contract address");
  }

  // Copy ABI to frontend
  const artifactPath = path.resolve(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "ProofChain.sol",
    "ProofChain.json"
  );
  const frontendAbiPath = path.resolve(
    __dirname,
    "..",
    "src",
    "contract",
    "ProofChain.json"
  );

  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(artifactPath, frontendAbiPath);
    console.log("📋  ABI copied to src/contract/ProofChain.json");
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✨ Deployment complete!");
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
