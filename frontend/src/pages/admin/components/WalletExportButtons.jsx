import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  FilterList as FilteredIcon,
  Description as CurrentPageIcon,
  Download as AllDataIcon,
  GridOn as ExcelIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const WalletExportButtons = ({ 
  data, 
  filteredData, 
  currentPageData, 
  fileName, 
  isLoading = false,
  sheetName = 'Transactions',
  buttonColor = 'primary',
  onExportFiltered,
  onExportCurrentPage,
  onExportAll
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [exporting, setExporting] = useState(null);

  // Extraire le type d'onglet du fileName pour l'affichage
  const getTabDisplayName = (fileName) => {
    if (fileName.includes('admin')) return 'Admin';
    if (fileName.includes('system')) return 'Système';
    return '';
  };

  const tabDisplayName = getTabDisplayName(fileName);

  // Définir les couleurs selon le type de bouton
  const getColorConfig = (colorType) => {
    switch (colorType) {
      case 'secondary':
        return {
          main: theme.palette.secondary.main,
          hover: theme.palette.secondary.dark,
          light: theme.palette.secondary.light,
        };
      default:
        return {
          main: theme.palette.primary.main,
          hover: theme.palette.primary.dark,
          light: theme.palette.primary.light,
        };
    }
  };

  const colors = getColorConfig(buttonColor);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportToExcel = (exportData, exportFileName, exportType) => {
    if (!exportData || exportData.length === 0) {
      console.warn('Aucune donnée à exporter');
      return;
    }

    setExporting(exportType);
    
    try {
      // Préparer les données pour l'export
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Ajuster la largeur des colonnes
      const columnsWidth = [
        { wch: 10 }, // ID
        { wch: 20 }, // Type
        { wch: 15 }, // Référence
        { wch: 15 }, // Montant
        { wch: 15 }, // Statut
        { wch: 50 }, // Détails
        { wch: 15 }, // Date
      ];
      worksheet["!cols"] = columnsWidth;
      
      // Générer le fichier Excel
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      // Générer le nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const finalFileName = `${exportFileName}_${timestamp}.xlsx`;
      
      // Télécharger le fichier
      saveAs(data, finalFileName);
    } catch (error) {
      console.error(`Erreur lors de l'export ${exportType}:`, error);
    } finally {
      setExporting(null);
      handleClose();
    }
  };

  const handleExportFiltered = async () => {
    if (onExportFiltered) {
      try {
        const data = await onExportFiltered();
        exportToExcel(data, `${fileName}_filtre`, 'filtered');
      } catch (error) {
        console.error('Erreur lors de l\'export filtré:', error);
      }
    } else {
      exportToExcel(filteredData, `${fileName}_filtre`, 'filtered');
    }
  };

  const handleExportCurrentPage = () => {
    if (onExportCurrentPage) {
      const data = onExportCurrentPage();
      exportToExcel(data, `${fileName}_page_actuelle`, 'currentPage');
    } else {
      exportToExcel(currentPageData, `${fileName}_page_actuelle`, 'currentPage');
    }
  };

  const handleExportAll = async () => {
    if (onExportAll) {
      try {
        const data = await onExportAll();
        exportToExcel(data, `${fileName}_toutes_donnees`, 'all');
      } catch (error) {
        console.error('Erreur lors de l\'export complet:', error);
      }
    } else {
      exportToExcel(data, `${fileName}_toutes_donnees`, 'all');
    }
  };

  const menuItems = [
    {
      key: 'filtered',
      label: 'Exporter les données filtrées',
      description: 'Toutes les données avec les filtres actuels',
      icon: <FilteredIcon sx={{ color: 'primary.main' }} />,
      action: handleExportFiltered,
      disabled: !filteredData || filteredData.length === 0,
    },
    {
      key: 'currentPage',
      label: 'Exporter la page actuelle',
      description: 'Uniquement les données de cette page',
      icon: <CurrentPageIcon sx={{ color: 'info.main' }} />,
      action: handleExportCurrentPage,
      disabled: !currentPageData || currentPageData.length === 0,
    },
    {
      key: 'all',
      label: 'Exporter toutes les données',
      description: 'L\'ensemble des données sans filtre',
      icon: <AllDataIcon sx={{ color: 'success.main' }} />,
      action: handleExportAll,
      disabled: !data || data.length === 0,
    },
  ];

  return (
    <Box>
      <Tooltip title={`Options d'exportation - ${tabDisplayName}`}>
        <Button
          variant="outlined"
          startIcon={isLoading ? <CircularProgress size={16} /> : <ExportIcon />}
          onClick={handleClick}
          disabled={isLoading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            borderColor: colors.main,
            color: colors.main,
            '&:hover': {
              backgroundColor: colors.main,
              color: 'white',
              borderColor: colors.main,
            },
          }}
        >
          {isLoading ? 'Chargement...' : `Exporter ${tabDisplayName}`}
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 280,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.key}
            onClick={item.action}
            disabled={item.disabled || exporting !== null}
            sx={{
              py: 1.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon>
              {exporting === item.key ? (
                <CircularProgress size={20} />
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {item.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default WalletExportButtons;
