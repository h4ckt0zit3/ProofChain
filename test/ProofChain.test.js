import { expect } from "chai";
import hre from "hardhat";

describe("ProofChain", function () {
  let proofChain;
  let admin, institution1, institution2, student1, student2, randomUser;
  const CERT_HASH_1 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("cert-1"));
  const CERT_HASH_2 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("cert-2"));
  const CERT_HASH_3 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("cert-3"));
  const CERT_HASH_4 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("cert-4"));
  const CERT_HASH_5 = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("cert-5"));

  beforeEach(async function () {
    [admin, institution1, institution2, student1, student2, randomUser] =
      await hre.ethers.getSigners();
    const ProofChain = await hre.ethers.getContractFactory("ProofChain");
    proofChain = await ProofChain.deploy();
    await proofChain.waitForDeployment();
  });

  // ══════════════════════════════════════════════
  // DEPLOYMENT
  // ══════════════════════════════════════════════

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await proofChain.admin()).to.equal(admin.address);
    });

    it("Should start with 0 total certificates", async function () {
      expect(await proofChain.totalCertificates()).to.equal(0);
    });

    it("Should start with 0 total institutions", async function () {
      expect(await proofChain.totalInstitutions()).to.equal(0);
    });

    it("Should start unpaused", async function () {
      expect(await proofChain.paused()).to.equal(false);
    });
  });

  // ══════════════════════════════════════════════
  // ADMIN MANAGEMENT
  // ══════════════════════════════════════════════

  describe("Admin Management", function () {
    it("Should transfer admin to a new address", async function () {
      await expect(proofChain.transferAdmin(institution1.address))
        .to.emit(proofChain, "AdminTransferred")
        .withArgs(admin.address, institution1.address, () => true);

      expect(await proofChain.admin()).to.equal(institution1.address);
    });

    it("Should revert if non-admin tries to transfer", async function () {
      await expect(
        proofChain.connect(randomUser).transferAdmin(randomUser.address)
      ).to.be.revertedWithCustomError(proofChain, "NotAdmin");
    });

    it("Should revert on transferring to zero address", async function () {
      await expect(
        proofChain.transferAdmin(hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(proofChain, "ZeroAddress");
    });
  });

  // ══════════════════════════════════════════════
  // PAUSE / UNPAUSE
  // ══════════════════════════════════════════════

  describe("Pause/Unpause", function () {
    it("Admin can pause the contract", async function () {
      await expect(proofChain.pause())
        .to.emit(proofChain, "ContractPausedEvent");
      expect(await proofChain.paused()).to.equal(true);
    });

    it("Admin can unpause the contract", async function () {
      await proofChain.pause();
      await expect(proofChain.unpause())
        .to.emit(proofChain, "ContractUnpausedEvent");
      expect(await proofChain.paused()).to.equal(false);
    });

    it("Non-admin cannot pause", async function () {
      await expect(
        proofChain.connect(randomUser).pause()
      ).to.be.revertedWithCustomError(proofChain, "NotAdmin");
    });

    it("Cannot pause when already paused", async function () {
      await proofChain.pause();
      await expect(proofChain.pause()).to.be.revertedWithCustomError(
        proofChain,
        "ContractPaused"
      );
    });

    it("Cannot unpause when not paused", async function () {
      await expect(proofChain.unpause()).to.be.revertedWithCustomError(
        proofChain,
        "ContractNotPaused"
      );
    });

    it("Write operations revert when paused", async function () {
      await proofChain.pause();
      await expect(
        proofChain["registerInstitution(address,string)"](institution1.address, "MIT")
      ).to.be.revertedWithCustomError(proofChain, "ContractPaused");
    });
  });

  // ══════════════════════════════════════════════
  // INSTITUTION MANAGEMENT
  // ══════════════════════════════════════════════

  describe("Institution Management", function () {
    it("Admin can register an institution with a name", async function () {
      await expect(
        proofChain["registerInstitution(address,string)"](institution1.address, "MIT")
      )
        .to.emit(proofChain, "InstitutionRegistered")
        .withArgs(institution1.address, "MIT", () => true);

      expect(await proofChain.approvedIssuers(institution1.address)).to.equal(true);
      expect(await proofChain.totalInstitutions()).to.equal(1);

      const details = await proofChain.getInstitutionDetails(institution1.address);
      expect(details.name).to.equal("MIT");
      expect(details.approved).to.equal(true);
    });

    it("Admin can register an institution without a name (legacy)", async function () {
      await proofChain["registerInstitution(address)"](institution1.address);
      expect(await proofChain.approvedIssuers(institution1.address)).to.equal(true);

      const details = await proofChain.getInstitutionDetails(institution1.address);
      expect(details.name).to.equal("Unnamed Institution");
    });

    it("Should revert on registering zero address", async function () {
        await expect(
          proofChain["registerInstitution(address,string)"](hre.ethers.ZeroAddress, "MIT")
        ).to.be.revertedWithCustomError(proofChain, "ZeroAddress");
    });

    it("Should revert on empty name", async function () {
      await expect(
        proofChain["registerInstitution(address,string)"](institution1.address, "")
      ).to.be.revertedWithCustomError(proofChain, "EmptyName");
    });

    it("Should revert on double registration", async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
      await expect(
        proofChain["registerInstitution(address,string)"](institution1.address, "MIT")
      ).to.be.revertedWithCustomError(proofChain, "InstitutionAlreadyRegistered");
    });

    it("Non-admin cannot register", async function () {
      await expect(
        proofChain.connect(randomUser)["registerInstitution(address,string)"](institution1.address, "MIT")
      ).to.be.revertedWithCustomError(proofChain, "NotAdmin");
    });

    it("Admin can revoke an institution", async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
      await expect(proofChain.revokeInstitution(institution1.address))
        .to.emit(proofChain, "InstitutionRevoked");

      expect(await proofChain.approvedIssuers(institution1.address)).to.equal(false);
      expect(await proofChain.totalInstitutions()).to.equal(0);
    });

    it("Should revert revoking unregistered institution", async function () {
      await expect(
        proofChain.revokeInstitution(institution1.address)
      ).to.be.revertedWithCustomError(proofChain, "InstitutionNotRegistered");
    });
  });

  // ══════════════════════════════════════════════
  // CERTIFICATE ISSUANCE
  // ══════════════════════════════════════════════

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
    });

    it("Approved issuer can issue a certificate", async function () {
      await expect(
        proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address)
      )
        .to.emit(proofChain, "CertificateIssued")
        .withArgs(institution1.address, student1.address, CERT_HASH_1, () => true);

      expect(await proofChain.totalCertificates()).to.equal(1);
    });

    it("Admin can issue certificates directly (bypass issuer check)", async function () {
      await expect(
        proofChain.issueCertificate(CERT_HASH_1, student1.address)
      ).to.emit(proofChain, "CertificateIssued");

      expect(await proofChain.totalCertificates()).to.equal(1);
    });

    it("Random user cannot issue certificates", async function () {
      await expect(
        proofChain.connect(randomUser).issueCertificate(CERT_HASH_1, student1.address)
      ).to.be.revertedWithCustomError(proofChain, "NotAdminOrIssuer");
    });

    it("Cannot issue to zero address", async function () {
      await expect(
        proofChain.connect(institution1).issueCertificate(CERT_HASH_1, hre.ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(proofChain, "ZeroAddress");
    });

    it("Cannot issue duplicate certificate hash", async function () {
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
      await expect(
        proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student2.address)
      ).to.be.revertedWithCustomError(proofChain, "CertificateAlreadyExists");
    });

    it("Tracks institution certificate count", async function () {
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_2, student2.address);

      const details = await proofChain.getInstitutionDetails(institution1.address);
      expect(details.certificatesIssued).to.equal(2);
    });
  });

  // ══════════════════════════════════════════════
  // BATCH CERTIFICATE ISSUANCE
  // ══════════════════════════════════════════════

  describe("Batch Certificate Issuance", function () {
    beforeEach(async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
    });

    it("Can batch issue multiple certificates", async function () {
      await proofChain.connect(institution1).batchIssueCertificates(
        [CERT_HASH_1, CERT_HASH_2, CERT_HASH_3],
        [student1.address, student2.address, student1.address]
      );

      expect(await proofChain.totalCertificates()).to.equal(3);

      const student1Certs = await proofChain.getStudentCertificates(student1.address);
      expect(student1Certs.length).to.equal(2);
    });

    it("Reverts on array length mismatch", async function () {
      await expect(
        proofChain.connect(institution1).batchIssueCertificates(
          [CERT_HASH_1, CERT_HASH_2],
          [student1.address]
        )
      ).to.be.revertedWithCustomError(proofChain, "ArrayLengthMismatch");
    });

    it("Admin can batch issue", async function () {
      await proofChain.batchIssueCertificates(
        [CERT_HASH_1, CERT_HASH_2],
        [student1.address, student2.address]
      );
      expect(await proofChain.totalCertificates()).to.equal(2);
    });
  });

  // ══════════════════════════════════════════════
  // CERTIFICATE REVOCATION
  // ══════════════════════════════════════════════

  describe("Certificate Revocation", function () {
    beforeEach(async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
    });

    it("Issuing institution can revoke their certificate", async function () {
      await expect(
        proofChain.connect(institution1).revokeCertificate(CERT_HASH_1)
      )
        .to.emit(proofChain, "CertificateRevoked")
        .withArgs(CERT_HASH_1, institution1.address, () => true);
    });

    it("Admin can revoke ANY certificate", async function () {
      await expect(
        proofChain.revokeCertificate(CERT_HASH_1)
      ).to.emit(proofChain, "CertificateRevoked");
    });

    it("Random user cannot revoke", async function () {
      await expect(
        proofChain.connect(randomUser).revokeCertificate(CERT_HASH_1)
      ).to.be.revertedWithCustomError(proofChain, "NotCertificateIssuerOrAdmin");
    });

    it("Cannot revoke non-existent certificate", async function () {
      await expect(
        proofChain.revokeCertificate(CERT_HASH_2)
      ).to.be.revertedWithCustomError(proofChain, "CertificateNotFound");
    });

    it("Cannot double revoke", async function () {
      await proofChain.connect(institution1).revokeCertificate(CERT_HASH_1);
      await expect(
        proofChain.connect(institution1).revokeCertificate(CERT_HASH_1)
      ).to.be.revertedWithCustomError(proofChain, "CertificateAlreadyRevoked");
    });
  });

  // ══════════════════════════════════════════════
  // VIEW FUNCTIONS
  // ══════════════════════════════════════════════

  describe("View Functions", function () {
    beforeEach(async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
    });

    it("verifyCertificate returns correct data for valid cert", async function () {
      const result = await proofChain.verifyCertificate(CERT_HASH_1);
      expect(result.isValid).to.equal(true);
      expect(result.institution).to.equal(institution1.address);
      expect(result.student).to.equal(student1.address);
      expect(result.timestamp).to.be.greaterThan(0);
    });

    it("verifyCertificate returns invalid for revoked cert", async function () {
      await proofChain.connect(institution1).revokeCertificate(CERT_HASH_1);
      const result = await proofChain.verifyCertificate(CERT_HASH_1);
      expect(result.isValid).to.equal(false);
    });

    it("verifyCertificate returns invalid for non-existent cert", async function () {
      const result = await proofChain.verifyCertificate(CERT_HASH_2);
      expect(result.isValid).to.equal(false);
      expect(result.institution).to.equal(hre.ethers.ZeroAddress);
    });

    it("getStudentCertificates returns correct hashes", async function () {
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_2, student1.address);
      const certs = await proofChain.getStudentCertificates(student1.address);
      expect(certs.length).to.equal(2);
      expect(certs[0]).to.equal(CERT_HASH_1);
      expect(certs[1]).to.equal(CERT_HASH_2);
    });

    it("getStudentCertificateCount works correctly", async function () {
      expect(await proofChain.getStudentCertificateCount(student1.address)).to.equal(1);
      expect(await proofChain.getStudentCertificateCount(student2.address)).to.equal(0);
    });

    it("getInstitutionDetails returns correct data", async function () {
      const details = await proofChain.getInstitutionDetails(institution1.address);
      expect(details.name).to.equal("MIT");
      expect(details.approved).to.equal(true);
      expect(details.registeredAt).to.be.greaterThan(0);
      expect(details.certificatesIssued).to.equal(1);
    });
  });

  // ══════════════════════════════════════════════
  // INTEGRATION TESTS
  // ══════════════════════════════════════════════

  describe("Integration", function () {
    it("Full lifecycle: register → issue → verify → revoke → verify", async function () {
      // Register institution
      await proofChain["registerInstitution(address,string)"](institution1.address, "Harvard");
      expect(await proofChain.approvedIssuers(institution1.address)).to.equal(true);

      // Issue certificate
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
      expect(await proofChain.totalCertificates()).to.equal(1);

      // Verify — should be valid
      let result = await proofChain.verifyCertificate(CERT_HASH_1);
      expect(result.isValid).to.equal(true);

      // Revoke
      await proofChain.connect(institution1).revokeCertificate(CERT_HASH_1);

      // Verify again — should be invalid
      result = await proofChain.verifyCertificate(CERT_HASH_1);
      expect(result.isValid).to.equal(false);
    });

    it("Admin can bypass all flows", async function () {
      // Admin issues directly without being an approved issuer
      await proofChain.issueCertificate(CERT_HASH_1, student1.address);
      expect(await proofChain.totalCertificates()).to.equal(1);

      // Admin revokes it
      await proofChain.revokeCertificate(CERT_HASH_1);
      const result = await proofChain.verifyCertificate(CERT_HASH_1);
      expect(result.isValid).to.equal(false);
    });

    it("Pause blocks all operations, unpause resumes", async function () {
      await proofChain["registerInstitution(address,string)"](institution1.address, "MIT");

      // Pause
      await proofChain.pause();

      // All write ops should fail
      await expect(
        proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address)
      ).to.be.revertedWithCustomError(proofChain, "ContractPaused");

      // Unpause
      await proofChain.unpause();

      // Should work again
      await proofChain.connect(institution1).issueCertificate(CERT_HASH_1, student1.address);
      expect(await proofChain.totalCertificates()).to.equal(1);
    });
  });
});
