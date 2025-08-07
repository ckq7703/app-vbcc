import React, { useState, useEffect } from 'react';
// import Web3 from 'web3';
import ConnectWallet from './ConnectWallet';
import VBCC from '../cert.json';
import * as XLSX from 'xlsx';
import { generateCertificatePDF } from './CertificateGenerator';
import { create } from 'ipfs-http-client';
import CertificateGenerator from './CertificateGenerator';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const IPFS_BASE_URL = process.env.REACT_APP_IPFS_BASE_URL;
const CLIENT_BASE_URL = process.env.REACT_APP_CLIENT_BASE_URL;


// Hàm gọi API để lưu thông tin chứng chỉ vào database
const saveToDatabase = async (certificateData, pdfBlob) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No JWT token found. Please log in.');
    }

    const formData = new FormData();
    formData.append('studentAddress', certificateData.studentAddress);
    formData.append('studentName', certificateData.studentName);
    formData.append('studentId', certificateData.studentId);
    formData.append('university', certificateData.university);
    formData.append('issueDate', certificateData.issueDate);
    formData.append('courseName', certificateData.courseName || '');
    formData.append('instructor', certificateData.instructor || '');
    formData.append('ipfsHash', certificateData.ipfsHash);
    formData.append('pdfFile', pdfBlob, `${certificateData.ipfsHash}.pdf`); // Gửi file PDF

    const response = await fetch(`${API_BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData, // Gửi FormData thay vì JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Lỗi khi lưu vào database: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
};



const IssueCertificate = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [formData, setFormData] = useState({
    studentAddress: '',
    studentName: '',
    studentId: '',
    university: '',
    issueDate: '',
    courseName: '',
    instructor: ''
  });
  const [excelData, setExcelData] = useState([]);
  const [issuedData, setIssuedData] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null); // Lưu trữ Blob để tái sử dụng

  const ipfs = create({ url: `${IPFS_BASE_URL}/api/v0` });

  useEffect(() => {
    const loadContract = async () => {
      try {
        const contractAddress = VBCC.networks?.['1337']?.address;
        if (!contractAddress) {
          throw new Error('Không tìm thấy địa chỉ contract cho mạng 1337 trong VBCC.json');
        }
        if (web3) {
          const contractInstance = new web3.eth.Contract(VBCC.abi, contractAddress);
          setContract(contractInstance);
          setMessage({ type: 'success', text: 'Contract đã được tải thành công!' });
        }
      } catch (error) {
        console.error('Error loading contract:', error);
        setMessage({ type: 'danger', text: `Lỗi tải contract: ${error.message}` });
      }
    };
    loadContract();
  }, [web3]);

  const handleConnect = (web3Instance, connectedAccount) => {
    setWeb3(web3Instance);
    setAccount(connectedAccount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!web3 || !account || !contract) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask và đảm bảo contract đã được tải!' });
      return;
    }

    setLoadingSingle(true);
    setMessage(null);

    try {
      const { studentAddress, studentName, studentId, university, issueDate, courseName, instructor } = formData;
      const dataToIssue = { 
        studentAddress, 
        studentName, 
        studentId, 
        university, 
        issueDate: issueDate ? parseInt(issueDate) : Math.floor(Date.now() / 1000), 
        courseName, 
        instructor 
      };


// 1. Tạo metadata (nhưng chưa upload)
const metadata = {
  studentAddress,
  studentName,
  studentId,
  university,
  issueDate: dataToIssue.issueDate,
  courseName,
  instructor
};

// 2. Tạm tạo verifyUrl dummy (chưa cần ipfsHash)
const tempVerifyUrl = 'https://example.com/placeholder';

// 3. Tạo PDF trước (chưa cần ipfsHash thật, QR có thể là dummy)
const pdfBlob = await generateCertificatePDF({ ...metadata, verifyUrl: tempVerifyUrl }, false, false);

// 4. Upload chính PDF này lên IPFS (file PDF là tài liệu gốc!)
const pdfResult = await ipfs.add(pdfBlob);
const ipfsHash = pdfResult.cid.toString();
const verifyUrl = `${CLIENT_BASE_URL}/verify?ipfsHash=${encodeURIComponent(ipfsHash)}`;

// 5. Tạo lại PDF (với ipfsHash thật) hoặc update thông tin nếu cần
const finalPdfBlob = await generateCertificatePDF({ ...metadata, ipfsHash, verifyUrl }, false, false);

// 6. Ghi lên blockchain
await contract.methods
  .issueCertificate(
    metadata.studentAddress,
    metadata.studentName,
    metadata.studentId,
    metadata.university,
    metadata.issueDate,
    ipfsHash
  )
  .send({ from: account });

// 7. Lưu vào DB
// Lưu vào database, bao gồm file PDF
    await saveToDatabase({ ...metadata, ipfsHash }, finalPdfBlob);

setPdfBlob(finalPdfBlob);


      

      setMessage({ type: 'success', text: 'Chứng chỉ đã được phát hành và lưu trên blockchain!' });
      setIssuedData({ ...metadata, ipfsHash, verifyUrl });
      setFormData({
        studentAddress: '', studentName: '', studentId: '', university: '', issueDate: '', courseName: '', instructor: ''
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setMessage({ type: 'danger', text: `Lỗi phát hành chứng chỉ: ${error.message}` });
    } finally {
      setLoadingSingle(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const formattedData = jsonData.map(row => ({
        studentAddress: row.studentAddress || '',
        studentName: row.studentName || '',
        studentId: row.studentId || '',
        university: row.university || '',
        issueDate: row.issueDate ? Math.floor(new Date(row.issueDate).getTime() / 1000) : getCurrentTimestamp(),
        courseName: row.courseName || '',
        instructor: row.instructor || ''
      }));
      setExcelData(formattedData);
      setMessage({ type: 'success', text: `${formattedData.length} chứng chỉ đã được tải từ file Excel!` });
    };
    reader.onerror = () => {
      setMessage({ type: 'danger', text: 'Lỗi khi đọc file Excel!' });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkIssue = async () => {
    if (!web3 || !account || !contract || excelData.length === 0) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask, tải file Excel và đảm bảo contract đã được tải!' });
      return;
    }

    setLoadingBulk(true);
    setMessage(null);

    try {
      const ipfsHashes = [];
      const pdfBlobs = [];
      for (const data of excelData) {
        const file = await generateCertificatePDF(data, false, false); // Không tự động tải
        const added = await ipfs.add(file);
        const ipfsHash = added.cid.toString();
        ipfsHashes.push(ipfsHash);

        const verifyUrl = `https://yourdomain.com/verify?ipfsHash=${encodeURIComponent(ipfsHash)}`;
        const updatedPdfBlob = await generateCertificatePDF({ ...data, ipfsHash, verifyUrl }, false, false); // Tạo PDF và tải
        pdfBlobs.push(updatedPdfBlob);
      }

      await Promise.all(
        excelData.map((data, index) =>
          contract.methods
            .issueCertificate(data.studentAddress, data.studentName, data.studentId, data.university, data.issueDate, ipfsHashes[index])
            .send({ from: account })
        )
      );

      setMessage({ type: 'success', text: `${excelData.length} chứng chỉ đã được phát hành và lưu trên blockchain!` });
      setExcelData([]);
      setPdfBlob(pdfBlobs[pdfBlobs.length - 1]); // Lưu blob cuối để tái sử dụng
      setIssuedData({ ...excelData[excelData.length - 1], ipfsHash: ipfsHashes[ipfsHashes.length - 1] });
    } catch (error) {
      console.error('Error issuing bulk certificates:', error);
      setMessage({ type: 'danger', text: `Lỗi phát hành nhiều chứng chỉ: ${error.message}` });
    } finally {
      setLoadingBulk(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Phát hành chứng chỉ</h1>
        <p className="page-subtitle">Tạo chứng chỉ mới và lưu trữ trên blockchain</p>
      </div>

      <div className="modern-card">
        <h3 className="mb-3">Kết nối ví</h3>
        <ConnectWallet onConnect={handleConnect} />
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="modern-card">
        <h3 className="mb-3">Thông tin chứng chỉ</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="studentAddress" className="form-label">Địa chỉ ví sinh viên *</label>
            <input
              type="text"
              className="form-control"
              id="studentAddress"
              name="studentAddress"
              value={formData.studentAddress}
              onChange={handleChange}
              placeholder="0x..."
              required
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentName" className="form-label">Tên sinh viên *</label>
            <input
              type="text"
              className="form-control"
              id="studentName"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              placeholder="Nhập tên sinh viên"
              required
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentId" className="form-label">Mã sinh viên *</label>
            <input
              type="text"
              className="form-control"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Nhập mã sinh viên"
              required
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="university" className="form-label">Trường đại học *</label>
            <input
              type="text"
              className="form-control"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="Nhập tên trường đại học"
              required
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="courseName" className="form-label">Tên khóa học</label>
            <input
              type="text"
              className="form-control"
              id="courseName"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="Nhập tên khóa học"
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="instructor" className="form-label">Giảng viên</label>
            <input
              type="text"
              className="form-control"
              id="instructor"
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
              placeholder="Nhập tên giảng viên"
              disabled={loadingSingle}
            />
          </div>
          <div className="form-group">
            <label htmlFor="issueDate" className="form-label">Ngày phát hành (Unix timestamp) *</label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="issueDate"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                placeholder="Nhập timestamp"
                required
                disabled={loadingSingle}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFormData({ ...formData, issueDate: getCurrentTimestamp() })}
                disabled={loadingSingle}
              >
                Hiện tại
              </button>
            </div>
            <small className="form-text text-muted">Timestamp hiện tại: {getCurrentTimestamp()}</small>
          </div>
          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-success"
              disabled={loadingSingle || !web3 || !account || !contract}
            >
              {loadingSingle ? <span className="loading"></span> : null}
              {loadingSingle ? 'Đang phát hành...' : 'Phát hành chứng chỉ'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                setFormData({
                  studentAddress: '',
                  studentName: '',
                  studentId: '',
                  university: '',
                  issueDate: '',
                  courseName: '',
                  instructor: ''
                })
              }
              disabled={loadingSingle}
            >
              Xóa form
            </button>
          </div>
        </form>
        {message?.type === 'success' && !loadingSingle && issuedData && (
          <CertificateGenerator certificateData={issuedData} pdfBlob={pdfBlob} />
        )}
      </div>

      <div className="modern-card mt-4">
        <h3 className="mb-3">Import nhiều chứng chỉ từ Excel</h3>
        <div className="form-group">
          <label htmlFor="excelFile" className="form-label">Tải file Excel *</label>
          <input
            type="file"
            className="form-control"
            id="excelFile"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={loadingBulk}
          />
        </div>
        {excelData.length > 0 && (
          <div>
            <p>Số lượng chứng chỉ: {excelData.length}</p>
            <div className="table-responsive">
              <table className="table table-striped mt-3">
                <thead>
                  <tr>
                    <th>Địa chỉ ví</th>
                    <th>Tên sinh viên</th>
                    <th>Mã sinh viên</th>
                    <th>Trường đại học</th>
                    <th>Ngày phát hành</th>
                    <th>Tên khóa học</th>
                    <th>Giảng viên</th>
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.studentAddress}</td>
                      <td>{data.studentName}</td>
                      <td>{data.studentId}</td>
                      <td>{data.university}</td>
                      <td>{new Date(data.issueDate * 1000).toLocaleDateString()}</td>
                      <td>{data.courseName}</td>
                      <td>{data.instructor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-success mt-3"
              onClick={handleBulkIssue}
              disabled={loadingBulk || !web3 || !account || !contract}
            >
              {loadingBulk ? <span className="loading"></span> : null}
              {loadingBulk ? 'Đang phát hành...' : 'Phát hành tất cả'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueCertificate;