import jsPDF from 'jspdf';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function generateAttendanceReport({ category, month, students }) {
  const [year, monthNumber] = month.split('-').map(Number);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const tableWidth = pageWidth - margin * 2;
  const columns = [0, 70, 99, 123, 145, tableWidth];
  let y = 42;

  const drawPageTitle = () => {
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, pageWidth, 29, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('RELATÓRIO DE FREQUÊNCIA', margin, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${category} | ${MONTH_NAMES[monthNumber - 1]} de ${year}`, margin, 21);
  };

  const drawTableHeader = () => {
    doc.setTextColor(35, 35, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ATLETA', margin + 2, y);
    doc.text('PRESENTE', margin + columns[1] + 2, y);
    doc.text('FALTA', margin + columns[2] + 2, y);
    doc.text('%', margin + columns[3] + 2, y);
    doc.text('SITUAÇÃO', margin + columns[4] + 2, y);
    y += 3;
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  drawPageTitle();
  drawTableHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  students.forEach((student) => {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 18;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }

    const status = student.total === 0
      ? 'Sem chamada'
      : student.percentage >= 75 ? 'Frequente' : 'Faltante';
    const nameLines = doc.splitTextToSize(student.nome || '—', columns[1] - 4);
    doc.text(nameLines, margin + 2, y);
    doc.text(String(student.presentes), margin + columns[1] + 2, y);
    doc.text(String(student.faltas), margin + columns[2] + 2, y);
    doc.text(student.total ? `${student.percentage}%` : '—', margin + columns[3] + 2, y);
    doc.text(status, margin + columns[4] + 2, y);
    const rowHeight = Math.max(9, nameLines.length * 4 + 4);
    y += rowHeight;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Frequente: presença igual ou superior a 75% das chamadas registradas no mês.', margin, pageHeight - 9);
  doc.save(`Relatorio_Frequencia_${category}_${month}.pdf`);
}
