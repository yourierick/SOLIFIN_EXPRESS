import React, { useState } from "react";
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";

const TransactionsTable = ({
  transactions = [],
  loading = false,
  error = null,
  totalTransactions = 0,
  currentPage = 0,
  rowsPerPage = 25,
  onPageChange,
  onRowsPerPageChange,
  onTransactionClick,
  selectedCurrency = "USD",
  isDarkMode = false,
  formatDate,
  getTransactionStatusColor,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  // Injecter les styles CSS pour les animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading || internalLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <div className="mt-4">
      {transactions.length > 0 ? (
        <TableContainer
          sx={{
            boxShadow: isDarkMode
              ? "none"
              : "0 2px 10px rgba(0, 0, 0, 0.05)",
            borderRadius: { xs: 1.5, sm: 2 },
            overflow: "auto",
            maxWidth: "100%",
            "&::-webkit-scrollbar": {
              height: { xs: 4, sm: 6 },
              width: { xs: 4, sm: 6 },
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: isDarkMode
                ? "rgba(55, 65, 81, 0.4)"
                : "rgba(0, 0, 0, 0.06)",
              borderRadius: { xs: 2, sm: 3 },
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDarkMode
                ? "rgba(156, 163, 175, 0.6)"
                : "rgba(156, 163, 175, 0.4)",
              borderRadius: { xs: 2, sm: 3 },
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(156, 163, 175, 0.8)"
                  : "rgba(156, 163, 175, 0.6)",
              },
            },
          }}
        >
          <Table 
            size="small" 
            sx={{ 
              minWidth: { xs: "800px", sm: "900px" },
              tableLayout: "fixed"
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: isDarkMode ? "#111827" : "#f0f4f8",
                  "& th": {
                    fontWeight: "bold",
                    color: isDarkMode ? "#fff" : "#334155",
                    fontSize: { xs: "0.75rem", sm: "0.85rem" },
                    padding: { xs: "8px 10px", sm: "12px 16px" },
                    borderBottom: isDarkMode
                      ? "1px solid #374151"
                      : "2px solid #e2e8f0",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  },
                }}
              >
                <TableCell sx={{ width: { xs: "150px", sm: "180px" } }}>Type</TableCell>
                <TableCell sx={{ width: { xs: "150px", sm: "180px" } }}>Référence</TableCell>
                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Montant</TableCell>
                <TableCell sx={{ width: { xs: "100px", sm: "120px" } }}>Statut</TableCell>
                <TableCell sx={{ width: { xs: "120px", sm: "140px" } }}>Date</TableCell>
                <TableCell sx={{ width: { xs: "150px", sm: "180px" } }}>Méthode de paiement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.id}
                  sx={{
                    "&:hover": {
                      bgcolor: isDarkMode ? "#374151" : "#f8fafc",
                      transform: "scale(1.005)",
                      transition: "all 0.2s ease-in-out",
                    },
                    borderBottom: `1px solid ${
                      isDarkMode ? "#374151" : "#e2e8f0"
                    }`,
                    "& td": {
                      padding: { xs: "6px 10px", sm: "10px 16px" },
                      color: isDarkMode ? "#fff" : "#475569",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                    },
                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                  }}
                  onClick={() => onTransactionClick && onTransactionClick(transaction)}
                >
                  <TableCell>
                    {transaction.mouvment === "withdrawal"
                      ? "Retrait"
                      : transaction.type === "purchase"
                      ? "Achat"
                      : transaction.type === "virtual_purchase"
                      ? "Virtuels"
                      : transaction.type === "reception"
                      ? "Réception des fonds"
                      : transaction.type === "transfer"
                      ? "Transfert des fonds"
                      : transaction.type === "remboursement"
                      ? "Remboursement"
                      : transaction.type === "digital_product_sale"
                      ? "Vente de produit numérique"
                      : transaction.type === "commission de parrainage"
                      ? "Commission de parrainage"
                      : transaction.type === "commission de transfert"
                      ? "Commission de transfert"
                      : transaction.type === "commission de retrait"
                      ? "Commission de retrait"
                      : transaction.type}
                  </TableCell>
                  <TableCell>
                    {transaction.reference}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium" 
                    style={{
                      color: transaction.mouvment === "in" ? "black" : "red"
                    }}>
                      {transaction.mouvment === "in" ? "+" : "-"}{selectedCurrency === "USD"
                        ? `${parseFloat(transaction.amount).toFixed(2)} $`
                        : `${parseFloat(transaction.amount).toFixed(2)} FC`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status === "pending"
                        ? "en attente"
                        : transaction.status === "completed"
                        ? "completé"
                        : transaction.status === "failed"
                        ? "failed"
                        : transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell>
                    {transaction.metadata?.["Méthode de paiement"] || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          {transactions.length === 0
            ? `Aucune transaction ${selectedCurrency} n'a été trouvée`
            : "Aucune transaction ne correspond aux filtres sélectionnés"}
        </Alert>
      )}

      {/* Pagination Material-UI */}
      <TablePagination
        component="div"
        count={totalTransactions}
        page={currentPage}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
        }
        sx={{
          color: isDarkMode ? "#fff" : "#475569",
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
          "& .MuiTablePagination-toolbar": {
            minHeight: { xs: "40px", sm: "52px" },
            padding: { xs: "8px", sm: "16px" },
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
          "& .MuiTablePagination-select": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
          "& .MuiIconButton-root": {
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          },
        }}
      />
    </div>
  );
};

export default TransactionsTable;
