import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CertificateList = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5; // số bản ghi mỗi trang

  // State for filters
  const [filters, setFilters] = useState({
    studentName: '',
    studentId: '',
    courseName: '',
    university: ''
  });

  const fetchCertificates = async (page, filterParams = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No JWT token found. Please log in.');

      // Build query string with filters
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filterParams
      }).toString();

      const response = await fetch(
        `${API_BASE_URL}/api/certificates?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Lỗi khi lấy danh sách: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      setCertificates(data.items || []);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates(currentPage, filters);
  }, [currentPage, filters]);

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle filter form submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchCertificates(1, filters);
  };

  if (loading)
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '200px', fontSize: '16px', color: '#4A90E2'
      }}>
        <div style={{
          padding: '20px', backgroundColor: 'white', border: '2px solid #4A90E2',
          borderRadius: '10px', boxShadow: '0 4px 12px rgba(74, 144, 226, 0.1)'
        }}>
          Đang tải danh sách chứng chỉ...
        </div>
      </div>
    );

  if (error)
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{
          padding: '20px', backgroundColor: 'white', border: '2px solid #E74C3C',
          borderRadius: '10px', color: '#E74C3C',
          boxShadow: '0 4px 12px rgba(231, 76, 60, 0.1)'
        }}>
          {error}
        </div>
      </div>
    );

  return (
    <div style={{
      padding: '30px', maxWidth: '1400px', margin: '0 auto',
      backgroundColor: '#F8FAFC', minHeight: '100vh'
    }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Danh sách chứng chỉ</h1>
        <p className="page-subtitle">Danh sách chứng chỉ đã được cấp và lưu trữ trên blockchain</p>
      </div>

      {/* Filter Form */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
         padding: '20px',
        marginBottom: '20px', boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
<form onSubmit={handleFilterSubmit}>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    alignItems: 'center'   // căn giữa nút với input theo chiều dọc
  }}>
    <div>
      <input
        type="text"
        name="studentName"
        value={filters.studentName}
        onChange={handleFilterChange}
        placeholder="Nhập tên sinh viên"
        style={{
          width: '90%', padding: '10px', borderRadius: '6px',
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
          width: '90%', padding: '10px', borderRadius: '6px',
          border: '1px solid #E1ECFF', fontSize: '14px',
          color: '#2C3E50', backgroundColor: '#FAFBFF'
        }}
      />
    </div>
    <div>
      <input
        type="text"
        name="courseName"
        value={filters.courseName}
        onChange={handleFilterChange}
        placeholder="Nhập tên khóa học"
        style={{
          width: '90%', padding: '10px', borderRadius: '6px',
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
          width: '90%', padding: '10px', borderRadius: '6px',
          border: '1px solid #E1ECFF', fontSize: '14px',
          color: '#2C3E50', backgroundColor: '#FAFBFF'
        }}
      />
    </div>

    {/* Nút lọc trong grid */}
    <div style={{ textAlign: 'right' }}>
      <button
        type="submit"
        style={{
          padding: '10px 20px', backgroundColor: '#1e3a8a',
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

      {/* Table Container */}
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        border: '2px solid #1e3a8a', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{
                backgroundColor: '#EBF4FF', borderBottom: '2px solid #1e3a8a'
              }}>
                {['Tên sinh viên', 'Mã sinh viên', 'Khóa học', 'Trường đại học', 'Ngày phát hành', 'View']
                  .map((title, i) => (
                    <th key={i} style={{
                      padding: '18px 16px', textAlign: 'center', fontWeight: '600',
                      color: '#2C3E50', fontSize: '15px',
                      borderRight: i < 5 ? '1px solid #E1ECFF' : 'none'
                    }}>
                      {title}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {certificates.map((cert, index) => (
                <tr
                  key={cert.id}
                  style={{
                    borderBottom: '1px solid #E1ECFF', transition: 'all 0.3s ease',
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
                    padding: '16px', textAlign: 'center', color: '#2C3E50',
                    fontWeight: '500', borderRight: '1px solid #F1F5F9'
                  }}>{cert.studentName}</td>
                  <td style={{
                    padding: '16px', textAlign: 'center', color: '#4A90E2',
                    fontWeight: '600', borderRight: '1px solid #F1F5F9'
                  }}>{cert.studentId}</td>
                  <td style={{
                    padding: '16px', textAlign: 'center', color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>{cert.courseName}</td>
                  <td style={{
                    padding: '16px', textAlign: 'center', color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>{cert.university}</td>
                  <td style={{
                    padding: '16px', textAlign: 'center', color: '#2C3E50',
                    borderRight: '1px solid #F1F5F9'
                  }}>{new Date(cert.issueDate * 1000).toLocaleDateString()}</td>
                  <td style={{
                    padding: '16px', textAlign: 'center'
                  }}>
                    <a
                      href={`${API_BASE_URL}${cert.certpath}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', padding: '8px 16px', backgroundColor: '#1e3a8a',
                        color: 'white', textDecoration: 'none', borderRadius: '6px',
                        fontWeight: '500', fontSize: '14px', transition: 'all 0.3s ease',
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
          backgroundColor: 'white', padding: '40px', textAlign: 'center',
          borderRadius: '12px', border: '2px solid #1e3a8a', marginTop: '30px',
          boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)'
        }}>
          <p style={{ margin: '0', color: '#7A8B9A', fontSize: '16px' }}>
            Không có chứng chỉ nào.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginTop: '20px', gap: '10px'
      }}>
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 14px', backgroundColor: currentPage === 1 ? '#ccc' : '#1e3a8a',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ◀ Trang trước
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 14px', backgroundColor: currentPage === totalPages ? '#ccc' : '#1e3a8a',
            color: 'white', border: 'none', borderRadius: '6px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Trang sau ▶
        </button>
      </div>
    </div>
  );
};

export default CertificateList;