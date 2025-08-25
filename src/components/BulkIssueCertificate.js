import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { create } from 'ipfs-http-client';
import { Dialog } from '@headlessui/react';
import { CheckCircle, XCircle } from 'lucide-react';
import ConnectWallet from './ConnectWallet';
import VBCC from '../cert.json';
import { generateCertificatePDF } from './CertificateGenerator';

// Các biến môi trường
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const IPFS_BASE_URL = process.env.REACT_APP_IPFS_BASE_URL;
const CLIENT_BASE_URL = process.env.REACT_APP_CLIENT_BASE_URL;

// Hàm lưu thông tin chứng chỉ vào database - Tái sử dụng từ component cũ
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
    formData.append('issueDate', certificateData.issueDate.toString());
    formData.append('courseName', certificateData.courseName || '');
    formData.append('instructor', certificateData.instructor || '');
    formData.append('ipfsHash', certificateData.ipfsHash);
    formData.append('pdfFile', pdfBlob, `${certificateData.ipfsHash}.pdf`);

    const response = await fetch(`${API_BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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

const BulkIssueCertificates = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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

  const getCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setMessage({ type: 'danger', text: 'Vui lòng chọn file Excel!' });
      setIsOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        const formattedData = rows.map((row) => {
          const certificate = {};
          headers.forEach((header, index) => {
            if (row[index] !== undefined) {
              certificate[header] = row[index].toString();
            }
          });
          return {
            studentAddress: certificate.studentAddress || '',
            studentName: certificate.studentName || '',
            studentId: certificate.studentId || '',
            university: certificate.university || '',
            issueDate: certificate.issueDate
              ? Math.floor(new Date(certificate.issueDate).getTime() / 1000)
              : getCurrentTimestamp(),
            courseName: certificate.courseName || '',
            instructor: certificate.instructor || '',
          };
        });

        setExcelData(formattedData);
        setMessage({ type: 'success', text: `${formattedData.length} chứng chỉ đã được tải từ file Excel!` });
        setIsOpen(true);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setMessage({ type: 'danger', text: `Lỗi khi đọc file Excel: ${error.message}` });
        setIsOpen(true);
      }
    };
    reader.onerror = () => {
      setMessage({ type: 'danger', text: 'Lỗi khi đọc file Excel!' });
      setIsOpen(true);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkIssue = async () => {
    if (!web3 || !account || !contract || excelData.length === 0) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask, tải file Excel và đảm bảo contract đã được tải!' });
      setIsOpen(true);
      return;
    }

    setLoadingBulk(true);
    setMessage(null);

    try {
      for (const data of excelData) {
        const metadata = {
          studentAddress: data.studentAddress,
          studentName: data.studentName,
          studentId: data.studentId,
          university: data.university,
          issueDate: data.issueDate,
          courseName: data.courseName,
          instructor: data.instructor,
        };

        const tempVerifyUrl = 'https://example.com/placeholder';
        const pdfBlob = await generateCertificatePDF({ ...metadata, verifyUrl: tempVerifyUrl }, false, false);
        const pdfResult = await ipfs.add(pdfBlob);
        const ipfsHash = pdfResult.cid.toString();
        const verifyUrl = `${CLIENT_BASE_URL}/verify?ipfsHash=${encodeURIComponent(ipfsHash)}`;
        const finalPdfBlob = await generateCertificatePDF({ ...metadata, ipfsHash, verifyUrl }, false, false);

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

        await saveToDatabase({ ...metadata, ipfsHash }, finalPdfBlob);
      }

      setMessage({ type: 'success', text: `${excelData.length} chứng chỉ đã được phát hành và lưu trên blockchain!` });
      setIsOpen(true);
      setExcelData([]);
    } catch (error) {
      console.error('Error issuing bulk certificates:', error);
      setMessage({ type: 'danger', text: `Lỗi phát hành nhiều chứng chỉ: ${error.message}` });
      setIsOpen(true);
    } finally {
      setLoadingBulk(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="page-header mb-4">
        <h3 className="page-title">Phát hành chứng chỉ hàng loạt</h3>
        <p className="page-subtitle">Sử dụng file Excel để phát hành nhiều chứng chỉ cùng lúc</p>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title mb-3">Kết nối ví</h4>
          <ConnectWallet onConnect={handleConnect} />
        </div>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50 overflow-y-auto">
        <div style={dialogStyles.overlay} />
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Panel style={dialogStyles.panel}>
            {message && (
              <>
                {message.type === 'success' ? (
                  <CheckCircle size={40} color="green" style={dialogStyles.icon} />
                ) : (
                  <XCircle size={40} color="red" style={dialogStyles.icon} />
                )}
                <p style={dialogStyles.messageText} style={{ color: message.type === 'success' ? 'green' : 'red' }}>
                  {message.text}
                </p>
              </>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Đóng
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="card">
        <div className="card-body">
          <h4 className="card-title mb-3">Import file Excel</h4>
          <div className="mb-3">
            <label htmlFor="excelFile" className="form-label">Tải file Excel *</label>
            <input
              type="file"
              className="form-control"
              id="excelFile"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loadingBulk}
            />
          </div>
          {excelData.length > 0 && (
            <div>
              <div style={tableStyles.container}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyles.table}>
                    <thead>
                      <tr style={tableStyles.headerRow}>
                        {['Tên sinh viên', 'Mã sinh viên', 'Khóa học', 'Trường đại học', 'Ngày phát hành']
                          .map((title, i) => (
                            <th key={i} style={tableStyles.headerCell}>
                              {title}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {excelData.map((cert, index) => (
                        <tr
                          key={index}
                          style={tableStyles.row}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0F7FF'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#FAFBFF'}
                        >
                          <td style={tableStyles.cell}>{cert.studentName}</td>
                          <td style={tableStyles.cell}>{cert.studentId}</td>
                          <td style={tableStyles.cell}>{cert.courseName}</td>
                          <td style={tableStyles.cell}>{cert.university}</td>
                          <td style={tableStyles.cell}>{new Date(cert.issueDate * 1000).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary mt-3"
                onClick={handleBulkIssue}
                disabled={loadingBulk || !web3 || !account || !contract}
              >
                {loadingBulk ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {loadingBulk ? 'Đang phát hành...' : 'Phát hành tất cả'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// CSS styles
const dialogStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  panel: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1001,
    minWidth: '300px',
    textAlign: 'center',
  },
  icon: {
    marginBottom: '1rem',
  },
  messageText: {
    margin: 0,
    fontSize: '1.1rem',
  },
};

const tableStyles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #1e3a8a',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)',
    marginTop: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white'
  },
  headerRow: {
    backgroundColor: '#EBF4FF',
    borderBottom: '2px solid #1e3a8a'
  },
  headerCell: {
    padding: '18px 16px',
    textAlign: 'center',
    fontWeight: '600',
    color: '#2C3E50',
    fontSize: '15px',
    borderRight: '1px solid #E1ECFF'
  },
  row: {
    borderBottom: '1px solid #E1ECFF',
    transition: 'all 0.3s ease',
  },
  cell: {
    padding: '16px',
    textAlign: 'center',
    color: '#2C3E50',
    fontWeight: '500',
    borderRight: '1px solid #F1F5F9'
  }
};

export default BulkIssueCertificates;