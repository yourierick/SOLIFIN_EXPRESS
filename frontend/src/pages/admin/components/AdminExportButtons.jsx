import React, { useState } from "react";
import { 
  Menu, 
  MenuItem, 
  IconButton, 
  Box,
  CircularProgress,
  Typography
} from "@mui/material";
import { 
  FaFileExcel, 
  FaDownload,
  FaFilter,
  FaList
} from "react-icons/fa";

const AdminExportButtons = ({ 
  onExportCurrentPage, 
  onExportFiltered, 
  onExportAll,
  exportLoading = false 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportCurrentPage = () => {
    onExportCurrentPage();
    handleClose();
  };

  const handleExportFiltered = () => {
    onExportFiltered();
    handleClose();
  };

  const handleExportAll = () => {
    onExportAll();
    handleClose();
  };

  return (
    <Box>
      {/* Bouton principal d'exportation */}
      <IconButton
        onClick={handleClick}
        disabled={exportLoading}
        sx={{
          bgcolor: 'success.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'success.dark',
          },
          '&:disabled': {
            bgcolor: 'grey.300',
            color: 'grey.500',
          },
          width: 40,
          height: 40,
          borderRadius: 2,
        }}
        size="small"
      >
        {exportLoading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <FaFileExcel size={18} />
        )}
      </IconButton>

      {/* Menu d'options d'exportation */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            borderRadius: 2,
            mt: 1,
          },
        }}
      >
        <MenuItem 
          onClick={handleExportCurrentPage}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'success.light', color: 'white' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaDownload />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Page actuelle
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter les données affichées
              </Typography>
            </Box>
          </Box>
        </MenuItem>

        <MenuItem 
          onClick={handleExportFiltered}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'success.light', color: 'white' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaFilter />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Données filtrées
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter avec les filtres actifs
              </Typography>
            </Box>
          </Box>
        </MenuItem>

        <MenuItem 
          onClick={handleExportAll}
          sx={{ 
            py: 1.5,
            '&:hover': { bgcolor: 'success.light', color: 'white' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaList />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Toutes les données
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Exporter toutes les transactions
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminExportButtons;
