import React, { useState, useEffect } from 'react';
import ConnectWallet from './ConnectWallet';
import VBCC from '../cert.json';
import { generateCertificatePDF } from './CertificateGenerator';
import { create } from 'ipfs-http-client';
import CertificateGenerator from './CertificateGenerator';
import { Dialog } from '@headlessui/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { User, Mail, Award, Calendar, Book, Users } from 'lucide-react'; // Thêm các icon

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const IPFS_BASE_URL = process.env.REACT_APP_IPFS_BASE_URL;
const CLIENT_BASE_URL = process.env.REACT_APP_CLIENT_BASE_URL;

// Hàm lưu thông tin chứng chỉ vào database
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

const IssueCertificate = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [formData, setFormData] = useState({
    studentAddress: '',
    studentName: '',
    studentId: '',
    university: '',
    issueDate: '',
    courseName: '',
    instructor: '',
  });
  const [issuedData, setIssuedData] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!web3 || !account || !contract) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask và đảm bảo contract đã được tải!' });
      setIsOpen(true);
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
        instructor,
      };

      const metadata = { ...dataToIssue };
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

      setPdfBlob(finalPdfBlob);
      setMessage({ type: 'success', text: 'Chứng chỉ đã được phát hành và lưu trên blockchain!' });
      setIsOpen(true);
      setIssuedData({ ...metadata, ipfsHash, verifyUrl });
      setFormData({
        studentAddress: '',
        studentName: '',
        studentId: '',
        university: '',
        issueDate: '',
        courseName: '',
        instructor: '',
      });
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setMessage({ type: 'danger', text: `Lỗi phát hành chứng chỉ: ${error.message}` });
      setIsOpen(true);
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
      color: ({ type }) => (type === 'success' ? 'green' : 'red'),
    },
  };

  return (
    <div className="container mt-4">
      <div className="page-header mb-4">
        <h3 className="page-title">Phát hành chứng chỉ</h3>
        <p className="page-subtitle">Tạo chứng chỉ mới và lưu trữ trên blockchain</p>
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
                <p style={{ ...dialogStyles.messageText, color: message.type === 'success' ? 'green' : 'red' }}>
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

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title mb-3">Thông tin chứng chỉ</h4>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="studentName" className="form-label d-flex align-items-center">
                    <User className="me-2" size={16} />Tên sinh viên *
                  </label>
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
                <div className="mb-3">
                  <label htmlFor="studentId" className="form-label d-flex align-items-center">
                    <Mail className="me-2" size={16} />Mã sinh viên *
                  </label>
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
                <div className="mb-3">
                  <label htmlFor="university" className="form-label d-flex align-items-center">
                    <Award className="me-2" size={16} />Trường đại học *
                  </label>
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
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="studentAddress" className="form-label d-flex align-items-center">
                    <User className="me-2" size={16} />Địa chỉ ví sinh viên *
                  </label>
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
                <div className="mb-3">
                  <label htmlFor="courseName" className="form-label d-flex align-items-center">
                    <Book className="me-2" size={16} />Tên khóa học
                  </label>
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
                <div className="mb-3">
                  <label htmlFor="instructor" className="form-label d-flex align-items-center">
                    <Users className="me-2" size={16} />Giảng viên
                  </label>
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
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label htmlFor="issueDate" className="form-label d-flex align-items-center">
                    <Calendar className="me-2" size={16} />Ngày phát hành (Unix timestamp) *
                  </label>
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
                      className="btn btn-outline-secondary"
                      onClick={() => setFormData({ ...formData, issueDate: getCurrentTimestamp() })}
                      disabled={loadingSingle}
                    >
                      Hiện tại
                    </button>
                  </div>
                  <small className="form-text text-muted">Timestamp hiện tại: {getCurrentTimestamp()}</small>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loadingSingle || !web3 || !account || !contract}
              >
                {loadingSingle ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {loadingSingle ? 'Đang phát hành...' : 'Phát hành chứng chỉ'}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setFormData({
                    studentAddress: '',
                    studentName: '',
                    studentId: '',
                    university: '',
                    issueDate: '',
                    courseName: '',
                    instructor: '',
                  })
                }
                disabled={loadingSingle}
              >
                Xóa form
              </button>
            </div>
          </form>
          {message?.type === 'success' && !loadingSingle && issuedData && (
            <div className="mt-3">
              <CertificateGenerator certificateData={issuedData} pdfBlob={pdfBlob} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default IssueCertificate;