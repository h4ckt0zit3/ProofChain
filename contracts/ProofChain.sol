// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ProofChain — Blockchain Certificate Verification
/// @author ProofChain Team
/// @notice Tamper-proof academic credential management on Ethereum
/// @dev Role-based access: admin → institutions → public verification
///      v2: Admin bypass, pausable, batch ops, institution names

contract ProofChain {
    // ──────────────────────────────────────────────
    // Custom Errors (gas-efficient replacements for require strings)
    // ──────────────────────────────────────────────
    error NotAdmin();
    error NotAdminOrIssuer();
    error NotApprovedIssuer();
    error CertificateAlreadyExists();
    error CertificateNotFound();
    error NotCertificateIssuerOrAdmin();
    error ZeroAddress();
    error InstitutionAlreadyRegistered();
    error InstitutionNotRegistered();
    error CertificateAlreadyRevoked();
    error ContractPaused();
    error ContractNotPaused();
    error EmptyName();
    error ArrayLengthMismatch();

    // ──────────────────────────────────────────────
    // State Variables
    // ──────────────────────────────────────────────

    /// @notice The contract admin (deployer, transferable)
    address public admin;

    /// @notice Total number of certificates ever issued
    uint256 public totalCertificates;

    /// @notice Total number of registered institutions
    uint256 public totalInstitutions;

    /// @notice Whether the contract is paused
    bool public paused;

    /// @notice Stores certificate data keyed by certHash
    struct Certificate {
        address institution;
        address student;
        uint256 issuedAt;
        bool exists;
        bool revoked;
    }

    /// @notice Stores institution data
    struct Institution {
        bool approved;
        string name;
        uint256 registeredAt;
        uint256 certificatesIssued;
    }

    /// @notice Mapping of institution addresses to their data
    mapping(address => Institution) public institutions;

    /// @notice Mapping of institution addresses to their approval status (legacy compat)
    mapping(address => bool) public approvedIssuers;

    /// @notice Mapping of cert hash to certificate struct
    mapping(bytes32 => Certificate) public certificates;

    /// @notice Mapping of student address to their certificate hashes
    mapping(address => bytes32[]) public studentCertificates;

    // ──────────────────────────────────────────────
    // Events (all indexed for efficient off-chain querying)
    // ──────────────────────────────────────────────

    event InstitutionRegistered(address indexed institution, string name, uint256 timestamp);
    event InstitutionRevoked(address indexed institution, uint256 timestamp);
    event CertificateIssued(
        address indexed institution,
        address indexed student,
        bytes32 indexed certHash,
        uint256 timestamp
    );
    event CertificateRevoked(
        bytes32 indexed certHash,
        address indexed revokedBy,
        uint256 timestamp
    );
    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin, uint256 timestamp);
    event ContractPausedEvent(address indexed admin, uint256 timestamp);
    event ContractUnpausedEvent(address indexed admin, uint256 timestamp);

    // ──────────────────────────────────────────────
    // Modifiers
    // ──────────────────────────────────────────────

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyAdminOrIssuer() {
        if (msg.sender != admin && !approvedIssuers[msg.sender]) revert NotAdminOrIssuer();
        _;
    }

    modifier onlyApprovedIssuer() {
        if (!approvedIssuers[msg.sender]) revert NotApprovedIssuer();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    // ──────────────────────────────────────────────
    // Constructor
    // ──────────────────────────────────────────────

    /// @notice Deploys ProofChain and sets deployer as admin
    constructor() {
        admin = msg.sender;
    }

    // ──────────────────────────────────────────────
    // Admin Management
    // ──────────────────────────────────────────────

    /// @notice Transfer admin role to a new address
    /// @param _newAdmin The Ethereum address of the new admin
    function transferAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert ZeroAddress();
        address previousAdmin = admin;
        admin = _newAdmin;
        emit AdminTransferred(previousAdmin, _newAdmin, block.timestamp);
    }

    /// @notice Pause all write operations on the contract
    function pause() external onlyAdmin whenNotPaused {
        paused = true;
        emit ContractPausedEvent(msg.sender, block.timestamp);
    }

    /// @notice Unpause the contract
    function unpause() external onlyAdmin whenPaused {
        paused = false;
        emit ContractUnpausedEvent(msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // Institution Management (Admin only)
    // ──────────────────────────────────────────────

    /// @notice Register a new institution as an approved certificate issuer
    /// @param _institution The Ethereum address of the institution to approve
    /// @param _name The display name of the institution
    function registerInstitution(address _institution, string calldata _name) external onlyAdmin whenNotPaused {
        if (_institution == address(0)) revert ZeroAddress();
        if (bytes(_name).length == 0) revert EmptyName();
        if (approvedIssuers[_institution]) revert InstitutionAlreadyRegistered();

        approvedIssuers[_institution] = true;
        institutions[_institution] = Institution({
            approved: true,
            name: _name,
            registeredAt: block.timestamp,
            certificatesIssued: 0
        });
        totalInstitutions++;

        emit InstitutionRegistered(_institution, _name, block.timestamp);
    }

    /// @notice Register institution (legacy compat — uses address as name)
    /// @param _institution The Ethereum address of the institution to approve
    function registerInstitution(address _institution) external onlyAdmin whenNotPaused {
        if (_institution == address(0)) revert ZeroAddress();
        if (approvedIssuers[_institution]) revert InstitutionAlreadyRegistered();

        approvedIssuers[_institution] = true;
        institutions[_institution] = Institution({
            approved: true,
            name: "Unnamed Institution",
            registeredAt: block.timestamp,
            certificatesIssued: 0
        });
        totalInstitutions++;

        emit InstitutionRegistered(_institution, "Unnamed Institution", block.timestamp);
    }

    /// @notice Revoke an institution's ability to issue certificates
    /// @param _institution The Ethereum address of the institution to revoke
    function revokeInstitution(address _institution) external onlyAdmin whenNotPaused {
        if (_institution == address(0)) revert ZeroAddress();
        if (!approvedIssuers[_institution]) revert InstitutionNotRegistered();

        approvedIssuers[_institution] = false;
        institutions[_institution].approved = false;
        totalInstitutions--;

        emit InstitutionRevoked(_institution, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // Certificate Issuance (Admin or Approved Issuers)
    // ──────────────────────────────────────────────

    /// @notice Issue a new certificate by storing its hash on-chain
    /// @dev Admin can issue directly without being an approved issuer
    /// @param _certHash The keccak256 hash uniquely identifying this certificate
    /// @param _student The Ethereum address of the certificate recipient
    function issueCertificate(bytes32 _certHash, address _student) external onlyAdminOrIssuer whenNotPaused {
        if (_student == address(0)) revert ZeroAddress();
        if (certificates[_certHash].exists) revert CertificateAlreadyExists();

        certificates[_certHash] = Certificate({
            institution: msg.sender,
            student: _student,
            issuedAt: block.timestamp,
            exists: true,
            revoked: false
        });

        studentCertificates[_student].push(_certHash);
        totalCertificates++;

        // Track institution stats
        if (institutions[msg.sender].registeredAt > 0) {
            institutions[msg.sender].certificatesIssued++;
        }

        emit CertificateIssued(msg.sender, _student, _certHash, block.timestamp);
    }

    /// @notice Batch issue certificates to multiple students
    /// @param _certHashes Array of certificate hashes
    /// @param _students Array of student addresses
    function batchIssueCertificates(
        bytes32[] calldata _certHashes,
        address[] calldata _students
    ) external onlyAdminOrIssuer whenNotPaused {
        if (_certHashes.length != _students.length) revert ArrayLengthMismatch();

        for (uint256 i = 0; i < _certHashes.length; i++) {
            if (_students[i] == address(0)) revert ZeroAddress();
            if (certificates[_certHashes[i]].exists) revert CertificateAlreadyExists();

            certificates[_certHashes[i]] = Certificate({
                institution: msg.sender,
                student: _students[i],
                issuedAt: block.timestamp,
                exists: true,
                revoked: false
            });

            studentCertificates[_students[i]].push(_certHashes[i]);
            totalCertificates++;

            if (institutions[msg.sender].registeredAt > 0) {
                institutions[msg.sender].certificatesIssued++;
            }

            emit CertificateIssued(msg.sender, _students[i], _certHashes[i], block.timestamp);
        }
    }

    // ──────────────────────────────────────────────
    // Certificate Revocation (Issuing Institution or Admin)
    // ──────────────────────────────────────────────

    /// @notice Revoke a previously issued certificate
    /// @dev Admin can revoke any certificate; issuers can only revoke their own
    /// @param _certHash The keccak256 hash of the certificate to revoke
    function revokeCertificate(bytes32 _certHash) external whenNotPaused {
        if (!certificates[_certHash].exists) revert CertificateNotFound();
        if (certificates[_certHash].revoked) revert CertificateAlreadyRevoked();
        // Allow admin OR the original issuer
        if (msg.sender != admin && certificates[_certHash].institution != msg.sender) {
            revert NotCertificateIssuerOrAdmin();
        }

        certificates[_certHash].revoked = true;

        emit CertificateRevoked(_certHash, msg.sender, block.timestamp);
    }

    // ──────────────────────────────────────────────
    // View Functions (Public — no wallet required)
    // ──────────────────────────────────────────────

    /// @notice Verify a certificate and return its full details
    /// @param certHash The keccak256 hash of the certificate
    /// @return isValid Whether the certificate is valid and not revoked
    /// @return institution Address of the issuing institution
    /// @return student Address of the certificate recipient
    /// @return timestamp When the certificate was issued
    function verifyCertificate(bytes32 certHash)
        public
        view
        returns (
            bool isValid,
            address institution,
            address student,
            uint256 timestamp
        )
    {
        Certificate memory cert = certificates[certHash];
        isValid = cert.exists && !cert.revoked;
        institution = cert.institution;
        student = cert.student;
        timestamp = cert.issuedAt;
    }

    /// @notice Get all certificate hashes issued to a specific student
    /// @param _student The Ethereum address of the student
    /// @return An array of certificate hashes
    function getStudentCertificates(address _student) public view returns (bytes32[] memory) {
        return studentCertificates[_student];
    }

    /// @notice Get the number of certificates issued to a student
    /// @param _student The student address
    /// @return count Number of certificates
    function getStudentCertificateCount(address _student) public view returns (uint256 count) {
        return studentCertificates[_student].length;
    }

    /// @notice Get institution details
    /// @param _institution The institution address
    /// @return name Institution name
    /// @return approved Whether currently approved
    /// @return registeredAt Registration timestamp
    /// @return certificatesIssued Number of certs issued
    function getInstitutionDetails(address _institution)
        public
        view
        returns (
            string memory name,
            bool approved,
            uint256 registeredAt,
            uint256 certificatesIssued
        )
    {
        Institution memory inst = institutions[_institution];
        return (inst.name, inst.approved, inst.registeredAt, inst.certificatesIssued);
    }
}
