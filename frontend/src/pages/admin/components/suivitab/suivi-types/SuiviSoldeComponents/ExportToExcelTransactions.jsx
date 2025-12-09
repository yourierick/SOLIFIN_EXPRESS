import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TableChart as TableIcon,
  FilterList as FilterIcon,
  Pageview as PageIcon,
  DataObject as AllDataIcon,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ExportToExcelTransactions = ({ period, filters, currentPage, rowsPerPage, total, currency }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState('');
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Fonction pour formater les données pour Excel
  const formatDataForExcel = (data) => {
    return data.map((item, index) => ({
      '#': index + 1,
      'Utilisateur': item.wallet?.user?.name || '-',
      'Email': item.wallet?.user?.email || '-',
      'Référence': item.reference || '-',
      'Type': formatType(item.type),
      'Mouvement': item.movement || '-',
      'Montant': item.amount || 0,
      'Devise': item.currency || '-',
      'Statut': item.status || '-',
      'Date': formatDateForExcel(item.created_at),
      'Description': item.description || '-',
    }));
  };

  // Fonction pour formater le type de transaction
  const formatType = (type) => {
    const typeTranslations = {
      'deposit': 'Dépôt',
      'withdrawal': 'Retrait',
      'transfer': 'Transfert',
      'payment': 'Paiement',
      'refund': 'Remboursement',
      'commission': 'Commission',
      'bonus': 'Bonus',
      'penalty': 'Pénalité',
      'adjustment': 'Ajustement',
      'conversion': 'Conversion',
      'fee': 'Frais',
      'cashback': 'Cashback',
      'reward': 'Récompense',
      'interest': 'Intérêt',
      'dividend': 'Dividende',
      'subscription': 'Abonnement',
      'renewal': 'Renouvellement',
      'cancellation': 'Annulation',
      'refund_request': 'Demande de remboursement',
      'chargeback': 'Contestation',
      'dispute': 'Litige',
      'hold': 'Blocage',
      'release': 'Déblocage',
      'freeze': 'Gel',
      'unfreeze': 'Dégel',
      'limit_adjustment': 'Ajustement de limite',
      'upgrade': 'Mise à niveau',
      'downgrade': 'Rétrogradation',
    };
    
    return typeTranslations[type] || type;
  };

  // Fonction pour formater la date pour Excel
  const formatDateForExcel = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction pour générer et télécharger le fichier Excel
  const generateExcel = (data, filename) => {
    const formattedData = formatDataForExcel(data);
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 8 },  // #
      { wch: 25 }, // Utilisateur
      { wch: 30 }, // Email
      { wch: 20 }, // Référence
      { wch: 20 }, // Type
      { wch: 12 }, // Mouvement
      { wch: 12 }, // Montant
      { wch: 10 }, // Devise
      { wch: 12 }, // Statut
      { wch: 18 }, // Date
      { wch: 30 }, // Description
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `${filename}.xlsx`);
  };

  // Exporter le tableau filtré
  const exportFilteredData = async () => {
    setLoading('filtered');
    try {
      // Préparer les filtres avec formatage des dates
      const formattedFilters = { ...filters };
      
      // Formater les dates pour l'API
      if (filters.date_start) {
        formattedFilters.date_start = filters.date_start instanceof Date 
          ? filters.date_start.toISOString().split('T')[0]
          : filters.date_start;
      }
      if (filters.date_end) {
        formattedFilters.date_end = filters.date_end instanceof Date 
          ? filters.date_end.toISOString().split('T')[0]
          : filters.date_end;
      }
      
      const params = {
        period: period,
        currency: currency,
        ...formattedFilters,
        export: 'all', // Exporter toutes les données filtrées
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/wallet-transactions', { params });
      const data = response.data.data || [];
      
      const filename = `transactions_filtrees_${currency}_${new Date().toISOString().split('T')[0]}`;
      generateExcel(data, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export des données filtrées:', error);
    } finally {
      setLoading('');
      handleClose();
    }
  };

  // Exporter la page courante
  const exportCurrentPage = async () => {
    setLoading('current');
    try {
      // Préparer les filtres avec formatage des dates
      const formattedFilters = { ...filters };
      
      // Formater les dates pour l'API
      if (filters.date_start) {
        formattedFilters.date_start = filters.date_start instanceof Date 
          ? filters.date_start.toISOString().split('T')[0]
          : filters.date_start;
      }
      if (filters.date_end) {
        formattedFilters.date_end = filters.date_end instanceof Date 
          ? filters.date_end.toISOString().split('T')[0]
          : filters.date_end;
      }
      
      const params = {
        page: currentPage + 1,
        per_page: rowsPerPage,
        period: period,
        currency: currency,
        ...formattedFilters,
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/wallet-transactions', { params });
      const data = response.data.data || [];
      
      const filename = `transactions_page_${currentPage + 1}_${currency}_${new Date().toISOString().split('T')[0]}`;
      generateExcel(data, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export de la page courante:', error);
    } finally {
      setLoading('');
      handleClose();
    }
  };

  // Exporter toutes les données
  const exportAllData = async () => {
    setLoading('all');
    try {
      const params = {
        period: period,
        currency: currency,
        export: 'all', // Exporter toutes les données sans filtres
      };
      
      const response = await axios.get('/api/admin/tableau-de-suivi/wallet-transactions', { params });
      const data = response.data.data || [];
      
      const filename = `transactions_toutes_donnees_${currency}_${new Date().toISOString().split('T')[0]}`;
      generateExcel(data, filename);
    } catch (error) {
      console.error('Erreur lors de l\'export de toutes les données:', error);
    } finally {
      setLoading('');
      handleClose();
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={!!loading}
        size={isMobile ? 'small' : 'medium'}
        sx={{
          borderColor: isDarkMode ? '#374151' : '#d1d5db',
          color: isDarkMode ? '#e5e7eb' : '#374151',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)',
          },
        }}
      >
        {isMobile ? 'Export' : 'Exporter Excel'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 2,
            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
            bgcolor: isDarkMode ? '#1f2937' : '#ffffff',
          },
        }}
      >
        <MenuItem onClick={exportFilteredData} disabled={!!loading}>
          <ListItemIcon>
            {loading === 'filtered' ? (
              <CircularProgress size={20} />
            ) : (
              <FilterIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
            )}
          </ListItemIcon>
          <ListItemText 
            primary="Tableau filtré" 
            secondary="Exporter les données avec filtres"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>

        <MenuItem onClick={exportCurrentPage} disabled={!!loading}>
          <ListItemIcon>
            {loading === 'current' ? (
              <CircularProgress size={20} />
            ) : (
              <PageIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
            )}
          </ListItemIcon>
          <ListItemText 
            primary="Page courante" 
            secondary={`Exporter ${rowsPerPage} lignes`}
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>

        <MenuItem onClick={exportAllData} disabled={!!loading}>
          <ListItemIcon>
            {loading === 'all' ? (
              <CircularProgress size={20} />
            ) : (
              <AllDataIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
            )}
          </ListItemIcon>
          <ListItemText 
            primary="Toutes les données" 
            secondary={`Exporter ${total} transactions`}
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
            secondaryTypographyProps={{ fontSize: '0.75rem' }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ExportToExcelTransactions;
