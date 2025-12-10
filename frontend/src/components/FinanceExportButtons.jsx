import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  FilterList as FilterListIcon,
  TableRows as TableRowsIcon,
  Publish as AllDataIcon
} from '@mui/icons-material';

const FinanceExportButtons = ({
  onExportCurrentPage,
  onExportFiltered,
  onExportAll,
  loading = false,
  disabled = false,
  currentPageCount = 0,
  filteredCount = 0,
  totalCount = 0
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportCurrentPage = () => {
    handleClose();
    onExportCurrentPage();
  };

  const handleExportFiltered = () => {
    handleClose();
    onExportFiltered();
  };

  const handleExportAll = () => {
    handleClose();
    onExportAll();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={16} /> : <FileDownloadIcon />}
        onClick={handleClick}
        disabled={disabled || loading}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          borderColor: disabled ? 'grey.300' : '#3b82f6',
          color: disabled ? 'grey.500' : '#3b82f6',
          '&:hover': {
            backgroundColor: disabled ? 'transparent' : '#3b82f6',
            color: disabled ? 'grey.500' : 'white',
            borderColor: disabled ? 'grey.300' : '#3b82f6',
          },
        }}
      >
        {loading ? 'Exportation...' : 'Exporter'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 280,
            borderRadius: 2,
            mt: 1,
          }
        }}
      >
        <MenuItem 
          onClick={handleExportCurrentPage}
          disabled={currentPageCount === 0}
        >
          <ListItemIcon>
            <TableRowsIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight="medium">
              Page actuelle
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentPageCount} transaction{currentPageCount > 1 ? 's' : ''}
            </Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={handleExportFiltered}
          disabled={filteredCount === 0}
        >
          <ListItemIcon>
            <FilterListIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight="medium">
              Données filtrées
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredCount} transaction{filteredCount > 1 ? 's' : ''}
            </Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={handleExportAll}
          disabled={totalCount === 0}
        >
          <ListItemIcon>
            <AllDataIcon fontSize="small" color="action" />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight="medium">
              Toutes les données
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalCount} transaction{totalCount > 1 ? 's' : ''}
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default FinanceExportButtons;
