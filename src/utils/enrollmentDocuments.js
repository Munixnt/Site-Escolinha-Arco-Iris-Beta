import jsPDF from 'jspdf';
import { loadImageAsPng } from './pdfImage';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 17;
const LOGO_URL = '/logo.png';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
}

function addHeading(doc, title, subtitle, logo) {
  doc.setFillColor(139, 0, 0);
  doc.rect(0, 0, PAGE_WIDTH, 32, 'F');
  doc.addImage(logo, 'PNG', MARGIN, 4, 22, 22, undefined, 'FAST');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 44, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 44, 24);
  doc.setTextColor(35, 35, 35);
}

function addField(doc, label, value, x, y, width) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 0, 0);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(35, 35, 35);
  const lines = doc.splitTextToSize(String(value || '—'), width);
  doc.text(lines, x, y + 5);
  return y + 7 + (lines.length - 1) * 4.5;
}

function addSignature(doc, y, label) {
  doc.setDrawColor(120, 120, 120);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(label, PAGE_WIDTH / 2, y + 5, { align: 'center' });
}

function addResponsibleDetails(doc, athlete, y) {
  const paragraph = `Responsável legal: ${athlete.nomeResponsavel || '________________________________________'}  |  Atleta: ${athlete.nome || '________________________________________'}  |  Matrícula: ${athlete.numeroMatricula || '________________'}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(35, 35, 35);
  const lines = doc.splitTextToSize(paragraph, PAGE_WIDTH - MARGIN * 2);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 5;
}

export async function generateEnrollmentDocuments(athlete) {
  if (!athlete.fotoUrl) throw new Error('O atleta não possui foto cadastrada.');
  const photo = await loadImageAsPng(athlete.fotoUrl);
  const logo = await loadImageAsPng(LOGO_URL, { removeBlackBackground: true });
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addHeading(doc, 'FICHA DE MATRÍCULA', 'Escolinha de Futebol Arco Iris | Nilo Peçanha - BA', logo);
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.rect(MARGIN, 39, PAGE_WIDTH - MARGIN * 2, 1);
  doc.addImage(photo, 'PNG', PAGE_WIDTH - MARGIN - 38, 47, 38, 46, undefined, 'FAST');
  doc.setDrawColor(212, 175, 55);
  doc.rect(PAGE_WIDTH - MARGIN - 38, 47, 38, 46);

  let y = 50;
  const fieldWidth = PAGE_WIDTH - MARGIN * 2 - 48;
  y = addField(doc, 'Nome do atleta', athlete.nome, MARGIN, y, fieldWidth);
  y = addField(doc, 'Número de matrícula', athlete.numeroMatricula, MARGIN, y + 2, fieldWidth);
  y = addField(doc, 'Data de nascimento', formatDate(athlete.dataNascimento), MARGIN, y + 2, fieldWidth);
  y = addField(doc, 'Categoria', athlete.categoria, MARGIN, y + 2, fieldWidth);
  y = addField(doc, 'Tipo sanguíneo', athlete.tipoSanguineo, MARGIN, y + 2, fieldWidth);

  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, 105, PAGE_WIDTH - MARGIN, 105);
  let detailsY = addField(doc, 'Responsável legal', athlete.nomeResponsavel, MARGIN, 114, PAGE_WIDTH - MARGIN * 2);
  detailsY = addField(doc, 'Telefone do responsável', athlete.telefoneResponsavel, MARGIN, detailsY + 3, PAGE_WIDTH - MARGIN * 2);
  detailsY = addField(doc, 'Endereço', `${athlete.rua || '—'}, ${athlete.numero || '—'} - ${athlete.bairro || '—'}`, MARGIN, detailsY + 3, PAGE_WIDTH - MARGIN * 2);
  detailsY = addField(doc, 'Cidade / UF / CEP', `${athlete.cidade || '—'}/${athlete.estado || '—'} - CEP ${athlete.cep || '—'}`, MARGIN, detailsY + 3, PAGE_WIDTH - MARGIN * 2);
  detailsY = addField(doc, 'Alergias ou restrições médicas', athlete.alergiasRestricoes, MARGIN, detailsY + 3, PAGE_WIDTH - MARGIN * 2);
  const atestadoStatus = {
    anexado: 'Anexado nesta matrícula',
    entrega_posterior: 'Será entregue posteriormente',
    nao_possui: 'Não possui',
  }[athlete.statusAtestado] || (athlete.atestadoUrl ? 'Documento anexado' : 'Não informado');
  addField(doc, 'Status do atestado médico', atestadoStatus, MARGIN, detailsY + 3, PAGE_WIDTH - MARGIN * 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Os dados pessoais e de saúde desta ficha serão utilizados somente para matrícula, segurança e gestão esportiva do projeto, conforme a LGPD.',
    MARGIN,
    PAGE_HEIGHT - 20,
    { maxWidth: PAGE_WIDTH - MARGIN * 2 },
  );
  doc.text(`Ficha gerada em ${formatDate(new Date().toISOString())}.`, MARGIN, PAGE_HEIGHT - 11);

  doc.addPage();
  addHeading(doc, 'TERMO DE EXCLUSIVIDADE', 'Compromisso durante o período de inscrição na Escolinha', logo);
  let termY = addResponsibleDetails(doc, athlete, 48) + 12;
  const exclusivity = `Enquanto estiver inscrito na Escolinha de Futebol Arco Iris, o atleta não poderá participar de outra escolinha nem de peneiras promovidas por outra escolinha sem autorização prévia do instrutor. O descumprimento desta condição poderá resultar no desligamento do atleta dos projetos da Escolinha.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  const exclusivityLines = doc.splitTextToSize(exclusivity, PAGE_WIDTH - MARGIN * 2);
  doc.text(exclusivityLines, MARGIN, termY, { lineHeightFactor: 1.6 });
  termY += exclusivityLines.length * 7 + 18;
  doc.text('Declaro que li, compreendi e concordo com o compromisso acima durante o período de inscrição do atleta.', MARGIN, termY, {
    maxWidth: PAGE_WIDTH - MARGIN * 2,
  });
  addSignature(doc, PAGE_HEIGHT - 58, 'Assinatura do responsável legal');
  doc.setFontSize(9);
  doc.text('Nome: __________________________________________     CPF: __________________________', MARGIN, PAGE_HEIGHT - 42);
  doc.text('Local e data: ______________________________________________________________________', MARGIN, PAGE_HEIGHT - 29);

  doc.addPage();
  addHeading(doc, 'AUTORIZAÇÃO DE USO DE IMAGEM', 'Atleta menor de idade | Assinatura do responsável legal', logo);
  let authorizationY = addResponsibleDetails(doc, athlete, 48) + 12;
  const authorization = `Eu, responsável legal identificado(a) neste termo, autorizo a captação e o uso da imagem e da voz do atleta durante as atividades da Escolinha de Futebol Arco Iris, exclusivamente para divulgação institucional do projeto em seus canais oficiais e materiais informativos. Esta autorização não abrange usos comerciais alheios às atividades do projeto. O responsável poderá revogar esta autorização a qualquer momento, mediante solicitação por escrito à Escolinha.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(35, 35, 35);
  const authorizationLines = doc.splitTextToSize(authorization, PAGE_WIDTH - MARGIN * 2);
  doc.text(authorizationLines, MARGIN, authorizationY, { lineHeightFactor: 1.6 });
  authorizationY += authorizationLines.length * 7 + 16;
  doc.setFont('helvetica', 'bold');
  doc.text('Declaração do responsável:', MARGIN, authorizationY);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro que li e autorizo o uso de imagem e voz nos termos acima.', MARGIN, authorizationY + 8);
  doc.setFontSize(9);
  doc.text('A assinatura deste termo é solicitada para concluir a matrícula.', MARGIN, authorizationY + 17);
  addSignature(doc, PAGE_HEIGHT - 58, 'Assinatura do responsável legal');
  doc.setFontSize(9);
  doc.text('Nome: __________________________________________     CPF: __________________________', MARGIN, PAGE_HEIGHT - 42);
  doc.text('Local e data: ______________________________________________________________________', MARGIN, PAGE_HEIGHT - 29);

  const filename = (athlete.nome || 'atleta').trim().replace(/[^\p{L}\p{N}_-]+/gu, '_');
  doc.save(`Ficha_e_Termos_${filename}_${athlete.numeroMatricula || athlete.id}.pdf`);
}
