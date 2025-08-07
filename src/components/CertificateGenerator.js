import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

export const generateCertificatePDF = async (certificateData, isBulk = false, autoDownload = false) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 210]
  });

  const CERT_WIDTH = 1122; // A4 Landscape at 96 DPI
  const CERT_HEIGHT = 794;

  const generateQRCode = (verifyUrl) => {
    return new Promise((resolve) => {
      QRCode.toDataURL(verifyUrl, { width: 80 }, (error, url) => {
        if (error) console.error(error);
        resolve(url);
      });
    });
  };

  const fillTemplate = async (data) => {
    const verifyUrl = data.verifyUrl || `https://yourdomain.com/verify?ipfsHash=${encodeURIComponent(data.ipfsHash || 'N/A')}`;
    const qrCodeDataUrl = await generateQRCode(verifyUrl);

    const element = document.createElement('div');
    element.style.width = `${CERT_WIDTH}px`;
    element.style.height = `${CERT_HEIGHT}px`;
    element.style.backgroundColor = '#ffffff';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';

    element.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        padding: 60px;
        box-sizing: border-box;
        border: 10px solid #f4a261;
        border-radius: 15px;
        font-family: 'Arial', sans-serif;
        position: relative;
      ">
        <h1 style="text-align: center; font-size: 48px; color: #2d3748; margin: 0 0 20px;">
          Chứng Nhận Hoàn Thành
        </h1>
        <h2 style="text-align: center; font-size: 36px; color: #e76f51; margin: 0 0 40px;">
          ${data.courseName || 'Tên Khóa Học'}
        </h2>
        <p style="text-align: center; font-size: 24px; color: #333;">Chứng nhận rằng</p>
        <p style="text-align: center; font-size: 32px; font-weight: bold; margin: 10px 0;">
          ${data.studentName || 'Học viên'}
        </p>
        <p style="text-align: center; font-size: 24px; color: #333;">
          đã hoàn thành xuất sắc khóa học
        </p>
        <div style="text-align: center; margin-top: 40px; font-size: 20px; color: #555;">
          Ngày cấp: ${new Date((data.issueDate || Math.floor(Date.now() / 1000)) * 1000).toLocaleDateString()}<br>
          Giảng viên: ${data.instructor || data.university || '...'}<br>
          Tổ chức: ${data.university || '...'}
        </div>
        <div style="
          position: absolute;
          bottom: 60px;
          left: 60px;
          font-size: 20px;
          font-weight: bold;
          color: #e76f51;
        ">
          Chữ ký của hiệu trưởng
        </div>
        <img src="${qrCodeDataUrl}" alt="QR Code" style="position: absolute; bottom: 60px; right: 60px; width: 80px; height: 80px;">
      </div>
    `;
    return element;
  };

  const renderAndAddToPDF = async (element, addNewPage = false) => {
    document.body.appendChild(element);
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    if (addNewPage) doc.addPage();
    doc.addImage(imgData, 'PNG', 0, 0, 297, 210);
    document.body.removeChild(element);
  };

  if (isBulk) {
    for (let i = 0; i < certificateData.length; i++) {
      const data = certificateData[i];
      const element = await fillTemplate(data);
      await renderAndAddToPDF(element, i > 0);
    }
  } else {
    const element = await fillTemplate(certificateData);
    await renderAndAddToPDF(element, false);
  }

  const pdfBlob = doc.output('blob');
  if (autoDownload) {
    const fileName = `certificate_${certificateData.studentName || 'bulk'}_${Date.now()}.pdf`;
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return pdfBlob;
};

const CertificateGenerator = ({ certificateData, pdfBlob }) => {
  const handleGeneratePDF = () => {
    if (pdfBlob) {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate_${certificateData.studentName}_${Date.now()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      console.error('No PDF blob available');
    }
  };

  return (
    <button onClick={handleGeneratePDF} className="btn btn-primary mt-3">
      Tải chứng chỉ dưới dạng PDF
    </button>
  );
};

export default CertificateGenerator;