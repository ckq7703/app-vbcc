import React, { useState, useEffect } from 'react';
// import Web3 from 'web3';
import ConnectWallet from './ConnectWallet';
import VBCC from '../cert.json';

const ViewCertificates = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [certId, setCertId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [userCerts, setUserCerts] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
          if (account) loadUserCertificates(web3, account, contractInstance);
        }
      } catch (error) {
        console.error('Error loading contract:', error);
        setMessage({ type: 'danger', text: `Lỗi tải contract: ${error.message}` });
      }
    };
    loadContract();
  }, [web3, account]);

  const handleConnect = (web3Instance, connectedAccount) => {
    console.log('Connected:', { web3Instance, connectedAccount });
    setWeb3(web3Instance);
    setAccount(connectedAccount);
  };

  const loadCertificate = async () => {
    if (!web3 || !contract) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask và đảm bảo contract đã được tải!' });
      return;
    }

    if (!certId) {
      setMessage({ type: 'danger', text: 'Vui lòng nhập ID chứng chỉ!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const cert = await contract.methods.getCertificate(certId).call();
      setCertificate({
        id: cert[0].toString(),
        studentName: cert[1],
        studentId: cert[2],
        university: cert[3],
        issueDate: new Date(Number(cert[4]) * 1000).toLocaleDateString('vi-VN'),
        isVerified: cert[5],
        issuedBy: cert[6], // Lấy issuedBy ở vị trí 6
        ipfsHash: cert[7]  // Lấy ipfsHash ở vị trí 7

      });
      setMessage({ type: 'success', text: 'Tải chứng chỉ thành công!' });
    } catch (error) {
      console.error('Error loading certificate:', error);
      setMessage({ type: 'danger', text: `Lỗi tải chứng chỉ: ${error.message}` });
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  const verifyCertificate = async () => {
    if (!web3 || !account || !contract) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask trước và đảm bảo contract đã được tải!' });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      await contract.methods.verifyCertificate(certId).send({ from: account });
      setMessage({ type: 'success', text: `Chứng chỉ ${certId} đã được xác minh thành công!` });
      loadCertificate();
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setMessage({ type: 'danger', text: `Lỗi xác minh chứng chỉ: ${error.message}` });
    } finally {
      setVerifying(false);
    }
  };

  const loadUserCertificates = async (web3Instance, connectedAccount, contractInstance) => {
    if (!web3Instance || !connectedAccount || !contractInstance) return;

    try {
      const certIds = await contractInstance.methods.getUserCertificates(connectedAccount).call();
      const certs = await Promise.all(
        certIds.map(async (id) => {
          const cert = await contractInstance.methods.getCertificate(id).call();
          return {
            id: cert[0].toString(),
            studentName: cert[1],
            studentId: cert[2],
            university: cert[3],
            issueDate: new Date(Number(cert[4]) * 1000).toLocaleDateString('vi-VN'),
            isVerified: cert[5],
            issuedBy: cert[6], // Lấy issuedBy ở vị trí 6
            ipfsHash: cert[7]  // Lấy ipfsHash ở vị trí 7

          };
        })
      );
      setUserCerts(certs);
    } catch (error) {
      console.error('Error loading user certificates:', error);
      setMessage({ type: 'danger', text: `Lỗi tải danh sách chứng chỉ: ${error.message}` });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadCertificate();
    }
  };
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const viewCertificate = (ipfsHash) => {
    if (ipfsHash) {
      const ipfsUrl = `${API_BASE_URL}/upload/cert/${ipfsHash}.pdf`;
      window.open(ipfsUrl, '_blank');
    } else {
      setMessage({ type: 'danger', text: 'Không tìm thấy IPFS Hash để xem chứng chỉ!' });
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Xem và xác minh chứng chỉ</h1>
        <p className="page-subtitle">Tìm kiếm và xác minh chứng chỉ trên blockchain</p>
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
        <h3 className="mb-3">Tìm kiếm chứng chỉ</h3>
        <div className="input-group">
          <input
            type="number"
            className="form-control"
            placeholder="Nhập ID chứng chỉ"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={loadCertificate}
            disabled={loading || !web3 || !contract}
          >
            {loading ? <span className="loading"></span> : null}
            {loading ? 'Đang tải...' : 'Tìm kiếm'}
          </button>
        </div>
        
        {certificate && (
          <div className="certificate-card mt-4">
            <div className="certificate-header d-flex justify-content-between align-items-center mb-3">
              <h4>Chứng chỉ #{certificate.id}</h4>
              <div className="d-flex align-items-center">
                <div className={`verification-badge ${certificate.isVerified ? 'verified' : 'unverified'}`}>
                  {certificate.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </div>
                <button
                  className="btn btn-success ml-2"
                  onClick={() => viewCertificate(certificate.ipfsHash)}
                  disabled={!certificate.ipfsHash}
                >
                  Xem chứng chỉ
                </button>
              </div>
            </div>
            
            <div className="certificate-info">
              <div className="info-item">
                <span className="info-label">Tên sinh viên</span>
                <span className="info-value">{certificate.studentName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Mã sinh viên</span>
                <span className="info-value">{certificate.studentId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Trường đại học</span>
                <span className="info-value">{certificate.university}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày phát hành</span>
                <span className="info-value">{certificate.issueDate}</span>
              </div>
            </div>
            
            {!certificate.isVerified && (
              <div className="mt-3">
                <button
                  className="btn btn-success"
                  onClick={verifyCertificate}
                  disabled={verifying || !account}
                >
                  {verifying ? <span className="loading"></span> : null}
                  {verifying ? 'Đang xác minh...' : 'Xác minh chứng chỉ'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="modern-card">
        <h3 className="mb-3">Danh sách chứng chỉ của bạn</h3>
        
        {userCerts.length === 0 ? (
          <div className="text-center">
            <p className="text-muted">Chưa có chứng chỉ nào được tìm thấy.</p>
            {!account && (
              <p className="text-muted">Vui lòng kết nối ví để xem chứng chỉ của bạn.</p>
            )}
          </div>
        ) : (
          <div className="certificate-list">
            {userCerts.map((cert) => (
              <div key={cert.id} className="certificate-item">
                <div className="certificate-header d-flex justify-content-between align-items-center">
                  <div className="certificate-id">#{cert.id}</div>
                  <div className="d-flex align-items-center">
                    <div className={`verification-badge ${cert.isVerified ? 'verified' : 'unverified'}`}>
                      {cert.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </div>
                    <button
                      className="btn btn-success ml-2"
                      onClick={() => viewCertificate(cert.ipfsHash)}
                      disabled={!cert.ipfsHash}
                    >
                      Xem chứng chỉ
                    </button>
                  </div>
                </div>
                
                <div className="certificate-details">
                  <div className="info-item">
                    <span className="info-label">Tên sinh viên</span>
                    <span className="info-value">{cert.studentName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mã sinh viên</span>
                    <span className="info-value">{cert.studentId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trường đại học</span>
                    <span className="info-value">{cert.university}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Ngày phát hành</span>
                    <span className="info-value">{cert.issueDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCertificates;