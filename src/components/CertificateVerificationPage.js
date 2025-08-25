import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Dialog } from '@headlessui/react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CertificateVerificationPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isValid, setIsValid] = useState(null); // true | false
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // trạng thái loading
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const ipfsHash = searchParams.get('ipfsHash');

  useEffect(() => {
    let timer;
    const verifyCertificate = async () => {
      if (!ipfsHash) return;

      setIsVerifying(true); // bắt đầu loading
      try {
        const response = await axios.get(
          `${API_BASE_URL}/verify?ipfsHash=${encodeURIComponent(ipfsHash)}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { success } = response.data;
        setIsValid(success);
      } catch (err) {
        setIsValid(false);
      } finally {
        setIsVerifying(false);
        setIsOpen(true);
      }
    };

    if (pdfLoaded) {
      // Đợi 5 giây sau khi PDF load xong mới gọi API
      timer = setTimeout(() => {
        verifyCertificate();
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [ipfsHash, pdfLoaded]);

  if (!ipfsHash) {
    return <p style={styles.error}>Không tìm thấy ipfsHash trong URL</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Xác Minh Chứng Chỉ</h2>

      {/* PDF iframe */}
      <embed
        src={`${API_BASE_URL}/upload/cert/${ipfsHash}.pdf`}
        type="application/pdf"
        style={styles.iframe}
        onLoad={() => setPdfLoaded(true)}
      />

      {/* Loading Spinner */}
      {isVerifying && (
        <div style={styles.loadingBox}>
          <Loader2 className="animate-spin" size={48} color="#2563eb" />
          <p style={styles.loadingText}>Đang xác thực chứng chỉ...</p>
        </div>
      )}

      {/* Modal kết quả */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div style={styles.dialogOverlay} aria-hidden="true" />
        <div style={styles.dialogPanel}>
          <Dialog.Panel style={styles.dialogBox}>
            {isValid === true ? (
              <>
                <CheckCircle size={48} color="green" style={{ marginBottom: '1rem' }} />
                <p style={styles.validText}>Chứng chỉ hợp lệ</p>
              </>
            ) : (
              <>
                <XCircle size={48} color="red" style={{ marginBottom: '1rem' }} />
                <p style={styles.invalidText}>Chứng chỉ không hợp lệ</p>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

// =====================
// Inline CSS Styles
// =====================
const styles = {
  container: {
    margin: '0 auto',
    padding: '1rem',
    maxWidth: '800px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  iframe: {
    width: '100%',
    height: '80vh',
    border: '1px solid #ccc',
    borderRadius: '6px',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: '2rem',
  },
    loadingBox: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: 1002,
  },
  loadingText: {
    fontSize: '16px',
    color: '#2563eb',
    fontWeight: '500',
  },
  dialogOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  dialogPanel: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  dialogBox: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    width: '300px',
  },
  iconValid: {
    fontSize: '48px',
    color: 'green',
    marginBottom: '1rem',
  },
  validText: {
    fontSize: '18px',
    color: 'green',
    fontWeight: 'bold',
  },
  iconInvalid: {
    fontSize: '48px',
    color: 'red',
    marginBottom: '1rem',
  },
  invalidText: {
    fontSize: '18px',
    color: 'red',
    fontWeight: 'bold',
  },
};

export default CertificateVerificationPage;
