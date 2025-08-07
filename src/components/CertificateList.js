import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No JWT token found. Please log in.');

        const response = await fetch(`${API_BASE_URL}/api/certificates`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Lỗi khi lấy danh sách: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        setCertificates(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      fontSize: '16px',
      color: '#4A90E2'
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '2px solid #4A90E2',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.1)'
      }}>
        Đang tải danh sách chứng chỉ...
      </div>
    </div>
  );

  if (error) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px'
    }}>
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '2px solid #E74C3C',
        borderRadius: '10px',
        color: '#E74C3C',
        boxShadow: '0 4px 12px rgba(231, 76, 60, 0.1)'
      }}>
        {error}
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '30px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#F8FAFC',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '25px',
        marginBottom: '30px',
        borderRadius: '12px',
        //border: '2px solid #4A90E2',
        boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <h2 style={{
          textAlign: 'center',
          margin: '0',
          color: '#2C3E50',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Danh sách Chứng chỉ
        </h2>
      </div>

      {/* Table Container */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #1e3a8a',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#EBF4FF',
                borderBottom: '2px solid #1e3a8a'
              }}>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px',
                  borderRight: '1px solid #E1ECFF'
                }}>
                  Tên sinh viên
                </th>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px',
                  borderRight: '1px solid #E1ECFF'
                }}>
                  Mã sinh viên
                </th>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px',
                  borderRight: '1px solid #E1ECFF'
                }}>
                  Khóa học
                </th>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px',
                  borderRight: '1px solid #E1ECFF'
                }}>
                  Trường đại học
                </th>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px',
                  borderRight: '1px solid #E1ECFF'
                }}>
                  Ngày phát hành
                </th>
                <th style={{
                  padding: '18px 16px',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#2C3E50',
                  fontSize: '15px'
                }}>
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert, index) => (
                <tr
                  key={cert.id}
                  style={{
                    borderBottom: '1px solid #E1ECFF',
                    transition: 'all 0.3s ease',
                    backgroundColor: index % 2 === 0 ? 'white' : '#FAFBFF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F0F7FF';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(74, 144, 226, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#FAFBFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: '#2C3E50',
                    fontWeight: '500',
                    borderRight: '1px solid #F1F5F9'
                  }}>
                    {cert.studentName}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: '#4A90E2',
                    fontWeight: '600',
                    borderRight: '1px solid #F1F5F9'
                  }}>
                    {cert.studentId}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>
                    {cert.courseName}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>
                    {cert.university}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>
                    {new Date(cert.issueDate * 1000).toLocaleDateString()}
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <a
                      href={`${API_BASE_URL}${cert.certpath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontWeight: '500',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        border: '2px solid #1e3a8a'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.color = '#1e3a8a';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#1e3a8a';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Xem
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {certificates.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          textAlign: 'center',
          borderRadius: '12px',
          border: '2px solid #1e3a8a',
          marginTop: '30px',
          boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
        }}>
          <p style={{
            margin: '0',
            color: '#7A8B9A',
            fontSize: '16px'
          }}>
            Không có chứng chỉ nào.
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificateList;