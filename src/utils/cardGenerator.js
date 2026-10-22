import jsPDF from 'jspdf';
import { loadImageAsPng } from './pdfImage';

const LOGO_URL = '/logo.png';

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function addImage(doc, data, format, x, y, width, height) {
  doc.addImage(data, format, x, y, width, height, undefined, 'FAST');
}

export async function generateAthleteCard(athlete) {
  const W = 85.6;
  const H = 54;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [W, H],
  });

  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, W, H, 'F');

  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.5);
  doc.rect(2, 2, W - 4, H - 4);

  doc.setFillColor(160, 10, 10);
  doc.roundedRect(4, 4, W - 8, H - 8, 1, 1, 'F');

  doc.setFillColor(212, 175, 55);
  doc.rect(4, 4, W - 8, 10, 'F');

  doc.setTextColor(139, 0, 0);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ESCOLINHA DE FUTEBOL ARCO IRIS', 38, 8.5, { align: 'center' });
  doc.text('NILO PEÇANHA - BA | Fundada em 13/08/2017', 38, 12, { align: 'center' });

  const logo = await loadImageAsPng(LOGO_URL, { removeBlackBackground: true });
  addImage(doc, logo, 'PNG', W - 16, 2.5, 10, 10);

  if (!athlete.fotoUrl) throw new Error('O atleta não possui foto cadastrada.');
  const photo = await loadImageAsPng(athlete.fotoUrl);

  const photoX = 6;
  const photoY = 16;
  const photoW = 22;
  const photoH = 26;

  addImage(doc, photo, 'PNG', photoX, photoY, photoW, photoH);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.rect(photoX, photoY, photoW, photoH);

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

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.text('VÁLIDA ATÉ', infoX, infoY + 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(formatDate(expiresAt), infoX, infoY + 26);

  doc.setFillColor(100, 0, 0);
  doc.rect(4, H - 10, W - 8, 6, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Esta carteirinha tem validade de 1 ano. Data de emissão: ${formatDate(issuedAt)}`,
    W / 2,
    H - 6.2,
    { align: 'center' },
  );

  doc.addPage([W, H], 'landscape');
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(1.5);
  doc.rect(2, 2, W - 4, H - 4);
  doc.setFillColor(160, 10, 10);
  doc.roundedRect(4, 4, W - 8, H - 8, 1, 1, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(4, 4, W - 8, 10, 'F');
  doc.setTextColor(139, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('CONTATO DE EMERGÊNCIA', W / 2, 10, { align: 'center' });
  addImage(doc, logo, 'PNG', W - 17, 3, 9, 9);

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('RESPONSÁVEL', 8, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(athlete.nomeResponsavel || '—', 48).slice(0, 2), 8, 27);

  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('TELEFONE DE EMERGÊNCIA', 8, 37);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(athlete.telefoneResponsavel || '—', 8, 42);

  doc.setFillColor(212, 175, 55);
  doc.roundedRect(W - 30, 20, 20, 20, 2, 2, 'F');
  doc.setTextColor(139, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('TIPO SANGUÍNEO', W - 20, 27, { align: 'center' });
  doc.setFontSize(12);
  doc.text(athlete.tipoSanguineo || '—', W - 20, 35, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  doc.text(`MATRÍCULA ${athlete.numeroMatricula || '—'}`, W / 2, H - 7, { align: 'center' });

  doc.save(`Carteirinha_${athlete.nome?.replace(/\s/g, '_')}_${athlete.numeroMatricula}.pdf`);
}