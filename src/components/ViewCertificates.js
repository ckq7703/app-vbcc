import React, { useState, useEffect } from 'react';
import ConnectWallet from './ConnectWallet';
import VBCC from '../cert.json';
import { getAddress } from 'ethers'; // Thêm thư viện ethers để chuẩn hóa địa chỉ

const ViewCertificates = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [certId, setCertId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [userCerts, setUserCerts] = useState([]);
  const [allCerts, setAllCerts] = useState([]);
  const [filteredCerts, setFilteredCerts] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    studentName: '',
    studentId: '',
    university: ''
  });

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
          setTimeout(() => setMessage(null), 5000);

          // Kiểm tra xem tài khoản có phải là admin không
          if (account) {
            const adminAddress = await contractInstance.methods.admin().call();
            console.log('Admin address (from contract):', adminAddress);
            console.log('Current account (from MetaMask):', account);
            const normalizedAccount = getAddress(account); // Chuẩn hóa địa chỉ
            const normalizedAdminAddress = getAddress(adminAddress); // Chuẩn hóa địa chỉ
            console.log('Normalized Admin address:', normalizedAdminAddress);
            console.log('Normalized Current account:', normalizedAccount);
            setIsAdmin(normalizedAccount === normalizedAdminAddress);
            loadUserCertificates(web3, account, contractInstance);
            if (normalizedAccount === normalizedAdminAddress) {
              if (typeof contractInstance.methods.getAllCertificates !== 'function') {
                throw new Error('Hàm getAllCertificates không tồn tại trong contract');
              }
              loadAllCertificates(contractInstance);
            } else {
              console.log('Warning: Tài khoản hiện tại không phải admin, không gọi getAllCertificates.');
            }
          }
        }
      } catch (error) {
        console.error('Error loading contract:', error);
        setMessage({ type: 'danger', text: `Lỗi tải contract: ${error.message}` });
      }
    };
    loadContract();
  }, [web3, account]);

  useEffect(() => {
    // Lọc chứng chỉ dựa trên input bộ lọc
    const certsToFilter = isAdmin ? allCerts : userCerts;
    const filtered = certsToFilter.filter(cert =>
      cert.studentName.toLowerCase().includes(filters.studentName.toLowerCase()) &&
      cert.studentId.toLowerCase().includes(filters.studentId.toLowerCase()) &&
      cert.university.toLowerCase().includes(filters.university.toLowerCase())
    );
    setFilteredCerts(filtered);
  }, [userCerts, allCerts, filters, isAdmin]);

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
        issuedBy: cert[6],
        ipfsHash: cert[7]
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

  const verifyCertificate = async (id) => {
    if (!web3 || !account || !contract) {
      setMessage({ type: 'danger', text: 'Vui lòng kết nối MetaMask trước và đảm bảo contract đã được tải!' });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      await contract.methods.verifyCertificate(id).send({ from: account });
      setMessage({ type: 'success', text: `Chứng chỉ ${id} đã được xác minh thành công!` });
      // Reload danh sách chứng chỉ sau khi xác minh
      if (isAdmin) {
        loadAllCertificates(contract);
      } else {
        loadUserCertificates(web3, account, contract);
      }
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
            issuedBy: cert[6],
            ipfsHash: cert[7]
          };
        })
      );
      setUserCerts(certs);
    } catch (error) {
      console.error('Error loading user certificates:', error);
      setMessage({ type: 'danger', text: `Lỗi tải danh sách chứng chỉ: ${error.message}` });
    }
  };

  const loadAllCertificates = async (contractInstance) => {
    if (!contractInstance) return;

    try {
      console.log('Calling getAllCertificates with account:', account);
      const certs = await contractInstance.methods.getAllCertificates().call({ from: account });
      console.log('All certificates fetched:', certs);
      const formattedCerts = certs
        .filter(cert => cert.id !== '0' && cert.studentAddress !== '0x0000000000000000000000000000000000000000')
        .map(cert => ({
          id: cert.id.toString(),
          studentName: cert.studentName,
          studentId: cert.studentId,
          university: cert.university,
          issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleDateString('vi-VN'),
          isVerified: cert.isVerified,
          issuedBy: cert.issuedBy,
          ipfsHash: cert.ipfsHash,
          studentAddress: cert.studentAddress // Đảm bảo bao gồm studentAddress
        }));
      setAllCerts(formattedCerts);
    } catch (error) {
      console.error('Error loading all certificates:', error);
      setMessage({ type: 'danger', text: `Lỗi tải danh sách tất cả chứng chỉ: ${error.message}` });
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

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    // Filtering is handled in useEffect, so just ensure state is updated
  };

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      backgroundColor: '#F8FAFC', minHeight: '100vh'
    }}>
      <div className="page-header">
        <h1 className="page-title">Xem và xác minh chứng chỉ</h1>
        <p className="page-subtitle">Tìm kiếm và xác minh chứng chỉ trên blockchain</p>
      </div>

      <div className="modern-card" style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '2px solid #1e3a8a', padding: '20px',
        marginBottom: '20px', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <h3 className="mb-3">Kết nối ví</h3>
        <ConnectWallet onConnect={handleConnect} />
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{
          padding: '20px', backgroundColor: message.type === 'success' ? '#D4EDDA' : '#F8D7DA',
          borderRadius: '12px', border: `2px solid ${message.type === 'success' ? '#28A745' : '#DC3545'}`,
          marginBottom: '20px', color: '#2C3E50'
        }}>
          {message.text}
        </div>
      )}

      {/* <div className="modern-card" style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '2px solid #1e3a8a', padding: '20px',
        marginBottom: '20px', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <h3 className="mb-3">Tìm kiếm chứng chỉ</h3> */}
        {/* Commented out search by ID form */}
        {/* <div className="input-group">
          <input
            type="number"
            className="form-control"
            placeholder="Nhập ID chứng chỉ"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            style={{
              width: '100%', padding: '10px', borderRadius: '6px',
              border: '1px solid #E1ECFF', fontSize: '14px',
              color: '#2C3E50', backgroundColor: '#FAFBFF'
            }}
          />
          <button
            className="btn btn-primary"
            onClick={loadCertificate}
            disabled={loading || !web3 || !contract}
            style={{
              padding: '10px 20px', backgroundColor: '#1e3a8a',
              color: 'white', border: 'none', borderRadius: '6px',
              cursor: (loading || !web3 || !contract) ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', marginLeft: '10px'
            }}
          >
            {loading ? <span className="loading"></span> : null}
            {loading ? 'Đang tải...' : 'Tìm kiếm'}
          </button>
        </div> */}

        {/* Filter Form */}
        {/* <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #E1ECFF', padding: '20px',
          marginTop: '20px'
        }}>
          <form onSubmit={handleFilterSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '500' }}>
                  Tên sinh viên
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={filters.studentName}
                  onChange={handleFilterChange}
                  placeholder="Nhập tên sinh viên"
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #E1ECFF', fontSize: '14px',
                    color: '#2C3E50', backgroundColor: '#FAFBFF'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '500' }}>
                  Mã sinh viên
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={filters.studentId}
                  onChange={handleFilterChange}
                  placeholder="Nhập mã sinh viên"
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #E1ECFF', fontSize: '14px',
                    color: '#2C3E50', backgroundColor: '#FAFBFF'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: '500' }}>
                  Trường đại học
                </label>
                <input
                  type="text"
                  name="university"
                  value={filters.university}
                  onChange={handleFilterChange}
                  placeholder="Nhập tên trường"
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #E1ECFF', fontSize: '14px',
                    color: '#2C3E50', backgroundColor: '#FAFBFF'
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px', backgroundColor: '#1e3a8a',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#2b4eb3';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#1e3a8a';
                }}
              >
                Lọc
              </button>
            </div>
          </form>
        </div>

        {certificate && (
          <div className="certificate-card mt-4" style={{
            padding: '20px', borderRadius: '8px', border: '1px solid #E1ECFF'
          }}>
            <div className="certificate-header d-flex justify-content-between align-items-center mb-3">
              <h4>Chứng chỉ #{certificate.id}</h4>
              <div className="d-flex align-items-center gap-2">
                <div className={`verification-badge ${certificate.isVerified ? 'verified' : 'unverified'}`} style={{
                  padding: '6px 12px', borderRadius: '6px',
                  backgroundColor: certificate.isVerified ? '#D4EDDA' : '#FFF3CD',
                  color: certificate.isVerified ? '#28A745' : '#856404',
                  fontSize: '14px', fontWeight: '500'
                }}>
                  {certificate.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                </div>
                <button
                  className="btn btn-success ml-2"
                  onClick={() => viewCertificate(certificate.ipfsHash)}
                  disabled={!certificate.ipfsHash}
                  style={{
                    padding: '8px 16px', backgroundColor: '#1e3a8a',
                    color: 'white', borderRadius: '6px', fontSize: '14px',
                    fontWeight: '500', border: 'none'
                  }}
                >
                  Xem chứng chỉ
                </button>
              </div>
            </div>
            
            <div className="certificate-info">
              <div className="info-item" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Tên sinh viên</span>
                <span className="info-value" style={{ color: '#2C3E50' }}>{certificate.studentName}</span>
              </div>
              <div className="info-item" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Mã sinh viên</span>
                <span className="info-value" style={{ color: '#4A90E2', fontWeight: '600' }}>{certificate.studentId}</span>
              </div>
              <div className="info-item" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Trường đại học</span>
                <span className="info-value" style={{ color: '#2C3E50' }}>{certificate.university}</span>
              </div>
              <div className="info-item" style={{ marginBottom: '10px' }}>
                <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Ngày phát hành</span>
                <span className="info-value" style={{ color: '#2C3E50' }}>{certificate.issueDate}</span>
              </div>
            </div>
            
            {!certificate.isVerified && (
              <div className="mt-3">
                <button
                  className="btn btn-success"
                  onClick={verifyCertificate}
                  disabled={verifying || !account || !isAdmin}
                  style={{
                    padding: '10px 20px', backgroundColor: '#28A745',
                    color: 'white', borderRadius: '6px', fontSize: '14px',
                    fontWeight: '500', border: 'none'
                  }}
                >
                  {verifying ? <span className="loading"></span> : null}
                  {verifying ? 'Đang xác minh...' : 'Xác minh chứng chỉ'}
                </button>
              </div>
            )}
          </div>
        )} */}
      {/* </div> */}

      <div className="modern-card" style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '2px solid #1e3a8a', padding: '20px',
        marginBottom: '20px', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0 }}>{isAdmin ? 'Danh sách tất cả chứng chỉ' : 'Danh sách chứng chỉ của bạn'}</h3>
          {/* Filter Form */}
          <div style={{
            backgroundColor: 'white', borderRadius: '12px',
            padding: '15px', width: '65%'
          }}>
            <form onSubmit={handleFilterSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: '10px',
                alignItems: 'center'
              }}>
                <div>
                  <input
                    type="text"
                    name="studentName"
                    value={filters.studentName}
                    onChange={handleFilterChange}
                    placeholder="Nhập tên sinh viên"
                    style={{
                      width: '90%', padding: '8px', borderRadius: '6px',
                      border: '1px solid #E1ECFF', fontSize: '14px',
                      color: '#2C3E50', backgroundColor: '#FAFBFF'
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="studentId"
                    value={filters.studentId}
                    onChange={handleFilterChange}
                    placeholder="Nhập mã sinh viên"
                    style={{
                      width: '90%', padding: '8px', borderRadius: '6px',
                      border: '1px solid #E1ECFF', fontSize: '14px',
                      color: '#2C3E50', backgroundColor: '#FAFBFF'
                    }}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="university"
                    value={filters.university}
                    onChange={handleFilterChange}
                    placeholder="Nhập tên trường"
                    style={{
                      width: '90%', padding: '8px', borderRadius: '6px',
                      border: '1px solid #E1ECFF', fontSize: '14px',
                      color: '#2C3E50', backgroundColor: '#FAFBFF'
                    }}
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px', backgroundColor: '#1e3a8a',
                      color: 'white', border: 'none', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = '#2b4eb3'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = '#1e3a8a'; }}
                  >
                    Lọc
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {filteredCerts.length === 0 ? (
          <div className="text-center" style={{
            padding: '40px', textAlign: 'center',
            borderRadius: '12px', border: '2px solid #1e3a8a',
            backgroundColor: 'white'
          }}>
            <p className="text-muted" style={{ margin: '0', color: '#7A8B9A', fontSize: '16px' }}>
              Chưa có chứng chỉ nào được tìm thấy.
            </p>
            {!account && (
              <p className="text-muted" style={{ margin: '10px 0 0', color: '#7A8B9A', fontSize: '16px' }}>
                Vui lòng kết nối ví để xem chứng chỉ của bạn.
              </p>
            )}
          </div>
        ) : (
          <div className="certificate-list">
            {filteredCerts.map((cert) => (
              <div key={cert.id} className="certificate-item" style={{
                padding: '20px', borderRadius: '8px', border: '1px solid #E1ECFF',
                marginBottom: '15px', backgroundColor: 'white'
              }}>
                <div className="certificate-header d-flex justify-content-between align-items-center">
                  <div className="certificate-id" style={{ fontWeight: '600', color: '#2C3E50' }}>
                    Chứng chỉ #{cert.id}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <div className={`verification-badge ${cert.isVerified ? 'verified' : 'unverified'}`} style={{
                      padding: '6px 12px', borderRadius: '6px',
                      backgroundColor: cert.isVerified ? '#D4EDDA' : '#FFF3CD',
                      color: cert.isVerified ? '#28A745' : '#856404',
                      fontSize: '14px', fontWeight: '500'
                    }}>
                      {cert.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </div>
                    <button
                      className="btn btn-success ml-2"
                      onClick={() => viewCertificate(cert.ipfsHash)}
                      disabled={!cert.ipfsHash}
                      style={{
                        padding: '8px 16px', backgroundColor: '#1e3a8a',
                        color: 'white', borderRadius: '6px', fontSize: '14px',
                        fontWeight: '500', border: 'none'
                      }}
                    >
                      Xem chứng chỉ
                    </button>
                    {!cert.isVerified && isAdmin && (
                      <button
                        className="btn btn-success ml-2"
                        onClick={() => verifyCertificate(cert.id)}
                        disabled={verifying || !account}
                        style={{
                          padding: '8px 16px', backgroundColor: '#28A745',
                          color: 'white', borderRadius: '6px', fontSize: '14px',
                          fontWeight: '500', border: 'none'
                        }}
                      >
                        {verifying ? <span className="loading"></span> : null}
                        {verifying ? 'Đang xác minh...' : 'Xác minh'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="certificate-details">
                  <div className="info-item" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Tên sinh viên</span>
                    <span className="info-value" style={{ color: '#2C3E50' }}>{cert.studentName}</span>
                  </div>
                  <div className="info-item" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Mã sinh viên</span>
                    <span className="info-value" style={{ color: '#4A90E2', fontWeight: '600' }}>{cert.studentId}</span>
                  </div>
                  <div className="info-item" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Trường đại học</span>
                    <span className="info-value" style={{ color: '#2C3E50' }}>{cert.university}</span>
                  </div>
                  <div className="info-item" style={{ marginBottom: '10px' }}>
                    <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Ngày phát hành</span>
                    <span className="info-value" style={{ color: '#2C3E50' }}>{cert.issueDate}</span>
                  </div>
                  {isAdmin && (
                    <div className="info-item" style={{ marginBottom: '10px' }}>
                      <span className="info-label" style={{ fontWeight: '600', color: '#2C3E50' }}>Địa chỉ sinh viên</span>
                      <span className="info-value" style={{ color: '#2C3E50' }}>{cert.studentAddress}</span>
                    </div>
                  )}
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