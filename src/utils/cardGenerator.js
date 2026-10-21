import jsPDF from 'jspdf';

const LOGO_URL = "/logo.jpeg";

async function loadImageAsBase64(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    img.onerror = () => resolve(null);
    img.src = url + '?t=' + Date.now();
  });
}

export async function generateAthleteCard(athlete) {
  // Card dimensions in mm: 85.6 x 53.98 (standard PVC)
  const W = 85.6;
  const H = 54;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [W, H],
  });

  // Background gradient (burgundy)
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, W, H, 'F');

  // Gold border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.5);
  doc.rect(2, 2, W - 4, H - 4);

  // Inner lighter area
  doc.setFillColor(160, 10, 10);
  doc.roundedRect(4, 4, W - 8, H - 8, 1, 1, 'F');

  // Header bar
  doc.setFillColor(212, 175, 55);
  doc.rect(4, 4, W - 8, 10, 'F');

  // Header text
  doc.setTextColor(139, 0, 0);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('ESCOLINHA DE FUTEBOL ARCO IRIS', W / 2, 10, { align: 'center' });
  doc.text('NILO PEÇANHA - BA | Fundada em 13/08/2017', W / 2, 13.5, { align: 'center' });

  // Logo (small, top right)
  const logoBase64 = await loadImageAsBase64(LOGO_URL);
  if (logoBase64) {
    doc.addImage(logoBase64, 'JPEG', W - 18, 3.5, 12, 12, '', 'FAST');
  }

  // Athlete photo
  let photoBase64 = null;
  if (athlete.fotoUrl) {
    photoBase64 = await loadImageAsBase64(athlete.fotoUrl);
  }

  const photoX = 6;
  const photoY = 16;
  const photoW = 22;
  const photoH = 26;

  if (photoBase64) {
    doc.addImage(photoBase64, 'JPEG', photoX, photoY, photoW, photoH, '', 'FAST');
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoW, photoH);
  } else {
    doc.setFillColor(100, 0, 0);
    doc.rect(photoX, photoY, photoW, photoH, 'F');
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text('FOTO', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
  }

  // Athlete info area
  const infoX = 32;
  const infoY = 18;

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('NOME DO ATLETA', infoX, infoY);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const nomeLines = doc.splitTextToSize(athlete.nome || 'ATLETA', W - infoX - 6);
  doc.text(nomeLines.slice(0, 2), infoX, infoY + 4);

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('CATEGORIA', infoX, infoY + 13);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(athlete.categoria || '—', infoX, infoY + 17);

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('MATRÍCULA', infoX + 22, infoY + 13);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(athlete.numeroMatricula || '—', infoX + 22, infoY + 17);

  // Vigência
  const anoAtual = new Date().getFullYear();
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('VIGÊNCIA', infoX, infoY + 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(`${anoAtual}`, infoX, infoY + 26);

  // QR Code placeholder (simple box with text)
  const qrX = W - 22;
  const qrY = 16;
  const qrSize = 18;
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'normal');
  doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2 - 1, { align: 'center' });
  doc.text(athlete.id?.slice(0, 8) || 'ID', qrX + qrSize / 2, qrY + qrSize / 2 + 2, { align: 'center' });

  // Footer
  doc.setFillColor(0, 0, 0, 50);
  doc.setFillColor(100, 0, 0);
  doc.rect(4, H - 10, W - 8, 6, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'normal');
  doc.text('Plataforma desenvolvida por MzTecSoluções | www.mztecsolucoes.com.br', W / 2, H - 5.5, { align: 'center' });

  doc.save(`Carteirinha_${athlete.nome?.replace(/\s/g, '_')}_${athlete.numeroMatricula}.pdf`);
}