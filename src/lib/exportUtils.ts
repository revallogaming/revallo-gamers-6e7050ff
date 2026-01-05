import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: (string | number)[][];
      startY?: number;
      theme?: string;
      headStyles?: Record<string, unknown>;
      styles?: Record<string, unknown>;
    }) => jsPDF;
  }
}

interface Transaction {
  id: string;
  nickname?: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Tournament {
  id: string;
  title: string;
  game: string;
  status: string;
  organizer_nickname?: string;
  current_participants: number;
  max_participants: number;
  start_date: string;
}

const getTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    'pix_purchase': 'Compra PIX',
    'admin_add': 'Admin +',
    'admin_remove': 'Admin -',
    'admin_set': 'Admin Set',
    'mini_tournament_entry': 'Entrada Mini',
    'prize_win': 'Prêmio'
  };
  return types[type] || type;
};

const getStatusLabel = (status: string): string => {
  const statuses: Record<string, string> = {
    'upcoming': 'Próximo',
    'open': 'Aberto',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'draft': 'Rascunho',
    'pending_deposit': 'Aguardando Depósito',
    'awaiting_result': 'Aguardando Resultado'
  };
  return statuses[status] || status;
};

const getGameLabel = (game: string): string => {
  const games: Record<string, string> = {
    'freefire': 'Free Fire',
    'fortnite': 'Fortnite',
    'cod': 'Call of Duty',
    'league_of_legends': 'League of Legends',
    'valorant': 'Valorant',
    'blood_strike': 'Blood Strike'
  };
  return games[game] || game;
};

// Export Transactions
export const exportTransactionsToPDF = (transactions: Transaction[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Relatório de Transações', 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30);

  const tableData = transactions.map(t => [
    t.nickname || 'Desconhecido',
    getTypeLabel(t.type),
    t.amount > 0 ? `+${t.amount}` : `${t.amount}`,
    t.description || '-',
    format(new Date(t.created_at), "dd/MM/yy HH:mm", { locale: ptBR })
  ]);

  doc.autoTable({
    head: [['Usuário', 'Tipo', 'Valor', 'Descrição', 'Data']],
    body: tableData,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 }
  });

  doc.save(`transacoes_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportTransactionsToExcel = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    'Usuário': t.nickname || 'Desconhecido',
    'Tipo': getTypeLabel(t.type),
    'Valor': t.amount,
    'Descrição': t.description || '-',
    'Data': format(new Date(t.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
  XLSX.writeFile(workbook, `transacoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export Tournaments
export const exportTournamentsToPDF = (tournaments: Tournament[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Relatório de Torneios', 14, 22);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 30);

  const tableData = tournaments.map(t => [
    t.title,
    t.organizer_nickname || 'Desconhecido',
    getGameLabel(t.game),
    getStatusLabel(t.status),
    `${t.current_participants}/${t.max_participants}`,
    format(new Date(t.start_date), "dd/MM/yy", { locale: ptBR })
  ]);

  doc.autoTable({
    head: [['Torneio', 'Organizador', 'Jogo', 'Status', 'Participantes', 'Data']],
    body: tableData,
    startY: 35,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 }
  });

  doc.save(`torneios_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportTournamentsToExcel = (tournaments: Tournament[]) => {
  const data = tournaments.map(t => ({
    'Torneio': t.title,
    'Organizador': t.organizer_nickname || 'Desconhecido',
    'Jogo': getGameLabel(t.game),
    'Status': getStatusLabel(t.status),
    'Participantes': `${t.current_participants}/${t.max_participants}`,
    'Data Início': format(new Date(t.start_date), "dd/MM/yyyy", { locale: ptBR })
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Torneios');
  XLSX.writeFile(workbook, `torneios_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
