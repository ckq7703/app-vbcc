// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract cert {
    // Cấu trúc dữ liệu cho chứng chỉ
    struct Certificate {
        uint256 id;
        address studentAddress;
        string studentName;
        string studentId;
        string university;
        uint256 issueDate;
        bool isVerified;
        address issuedBy;
        string ipfsHash;
    }

    // Mapping để lưu chứng chỉ theo ID
    mapping(uint256 => Certificate) public certificates;

    // Mapping để lưu danh sách ID chứng chỉ của từng sinh viên
    mapping(address => uint256[]) public userCertificates;

    // Mapping để ánh xạ ipfsHash đến certificateId
    mapping(string => uint256) public ipfsToId;

    // Biến đếm ID chứng chỉ
    uint256 private certificateIdCounter;

    // Sự kiện phát hành chứng chỉ
    event CertificateIssued(uint256 indexed certificateId, address indexed studentAddress, uint256 issueDate, string ipfsHash);

    // Sự kiện xác minh chứng chỉ
    event CertificateVerified(uint256 indexed certificateId, bool status);

    // Địa chỉ quản trị (trường học)
    address public admin;

    // Constructor để thiết lập admin
    constructor() {
        admin = msg.sender;
        certificateIdCounter = 0; // Khởi tạo counter
    }

    // Chỉ admin hoặc Issuer được phép gọi
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    // Phát hành chứng chỉ
    function issueCertificate(
        address _studentAddress,
        string memory _studentName,
        string memory _studentId,
        string memory _university,
        uint256 _issueDate,
        string memory _ipfsHash
    ) public onlyAdmin {
        require(_studentAddress != address(0), "Invalid student address");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        certificateIdCounter++;
        uint256 newCertificateId = certificateIdCounter;

        certificates[newCertificateId] = Certificate(
            newCertificateId,
            _studentAddress,
            _studentName,
            _studentId,
            _university,
            _issueDate,
            false, // isVerified mặc định là false
            msg.sender,
            _ipfsHash
        );

        // Gán ipfsHash đến certificateId
        ipfsToId[_ipfsHash] = newCertificateId;

        // Thêm certificateId vào danh sách của sinh viên
        userCertificates[_studentAddress].push(newCertificateId);

        emit CertificateIssued(newCertificateId, _studentAddress, _issueDate, _ipfsHash);
    }

    // Kiểm tra tính hợp lệ của chứng chỉ và trả về thông tin
    function isCertificateValid(string memory _ipfsHash) public view returns (
        bool isValid,
        uint256 id,
        string memory studentName,
        string memory studentId,
        string memory university,
        uint256 issueDate,
        address issuedBy,
        string memory ipfsHash
    ) {
        uint256 certificateId = ipfsToId[_ipfsHash];
        if (certificateId == 0 || certificates[certificateId].id == 0) {
            return (false, 0, "", "", "", 0, address(0), "");
        }
        Certificate memory certData = certificates[certificateId];
        return (true, certData.id, certData.studentName, certData.studentId, certData.university, certData.issueDate, certData.issuedBy, certData.ipfsHash);
    }

    // Xác minh chứng chỉ
    function verifyCertificate(uint256 _certificateId) public onlyAdmin {
        Certificate storage certData = certificates[_certificateId];
        require(certData.id != 0, "Certificate does not exist");
        require(!certData.isVerified, "Certificate already verified");
        certData.isVerified = true;
        emit CertificateVerified(_certificateId, true);
    }

    // Lấy thông tin chứng chỉ
    function getCertificate(uint256 _certificateId) public view returns (
        uint256 id,
        string memory studentName,
        string memory studentId,
        string memory university,
        uint256 issueDate,
        bool isVerified,
        address issuedBy,
        string memory ipfsHash
    ) {
        Certificate memory certData = certificates[_certificateId];
        require(certData.id != 0, "Certificate does not exist");
        return (
            certData.id,
            certData.studentName,
            certData.studentId,
            certData.university,
            certData.issueDate,
            certData.isVerified,
            certData.issuedBy,
            certData.ipfsHash

        );
    }

    // Lấy danh sách ID chứng chỉ của sinh viên
    function getUserCertificates(address _student) public view returns (uint256[] memory) {
        return userCertificates[_student];
    }

    // Chuyển quyền admin (nếu cần)
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}