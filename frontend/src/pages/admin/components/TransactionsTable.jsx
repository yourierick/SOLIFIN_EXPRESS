import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Alert,
} from '@mui/material';
import {
  BanknotesIcon,
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { FaExchangeAlt } from 'react-icons/fa';

const TransactionsTable = ({
  transactions,
  totalTransactions,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  isDarkMode,
  loading,
  onTransactionClick,
  activeTab,
  getTransactionStatusColor,
  formatDate,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {transactions.length > 0 ? (
        <Paper
          sx={{
            width: "100%",
            overflow: "hidden",
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            boxShadow: isDarkMode
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead
                sx={{
                  backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                }}
              >
                <TableRow>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    Référence
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    Montant
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    onClick={() => onTransactionClick(transaction)}
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                      },
                      borderBottom: `1px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#ffffff" : "#111827",
                        py: 2,
                      }}
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "withdrawal"
                              ? "bg-red-100 dark:bg-red-900"
                              : transaction.type === "reception"
                              ? "bg-green-100 dark:bg-green-900"
                              : transaction.type === "transfer"
                              ? "bg-blue-100 dark:bg-blue-900"
                              : transaction.type === "remboursement"
                              ? "bg-orange-100 dark:bg-orange-900"
                              : transaction.type === "commission de retrait"
                              ? "bg-yellow-100 dark:bg-yellow-900"
                              : transaction.type === "commission de transfert"
                              ? "bg-yellow-100 dark:bg-yellow-900"
                              : transaction.type ===
                                "commission de parrainage"
                              ? "bg-yellow-100 dark:bg-yellow-900"
                              : transaction.type === "digital_product_sale"
                              ? "bg-green-100 dark:bg-green-800"
                              : transaction.type === "pack_sale"
                              ? "bg-green-100 dark:bg-green-800"
                              : transaction.type === "boost_sale"
                              ? "bg-green-100 dark:bg-green-800"
                              : transaction.type === "renew_pack_sale"
                              ? "bg-green-100 dark:bg-green-800"
                              : transaction.type === "virtual_sale"
                              ? "bg-green-100 dark:bg-green-800"
                              : "bg-gray-100 dark:bg-gray-700"
                          }`}
                        >
                          {transaction.type === "withdrawal" ? (
                            <ArrowDownTrayIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : transaction.type === "reception" ? (
                            <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : transaction.type === "transfer" ? (
                            <FaExchangeAlt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {transaction.type === "withdrawal"
                              ? "Retrait"
                              : transaction.type === "transfer"
                              ? "Transfert des fonds"
                              : transaction.type === "reception"
                              ? "Dépot des fonds"
                              : transaction.type ===
                                "commission de parrainage"
                              ? "Commission de parrainage"
                              : transaction.type === "commission de retrait"
                              ? "Commission de retrait"
                              : transaction.type === "commission de transfert"
                              ? "Commission de transfert"
                              : transaction.type === "pack_sale"
                              ? "Vente de pack"
                              : transaction.type === "renew_pack_sale"
                              ? "Rénouvellement de pack"
                              : transaction.type === "boost_sale"
                              ? "Boost de publication"
                              : transaction.type === "virtual_sale"
                              ? "Vente de virtuel"
                              : transaction.type === "digital_product_sale"
                              ? "Vente de produit numérique"
                              : transaction.type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#d1d5db" : "#6b7280",
                        py: 2,
                      }}
                    >
                      {transaction.reference}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color:
                          transaction.mouvment === "out"
                            ? isDarkMode ? "#f87171" : "#dc2626"
                            : isDarkMode ? "#34d399" : "#16a34a",
                        py: 2,
                        fontWeight: 500,
                      }}
                    >
                      {transaction.mouvment === "out" ? "-" : "+"}
                      {transaction.amount}{" "}
                      {transaction.currency === "USD" ? "$" : "FC"}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        py: 2,
                      }}
                    >
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status === "completed"
                          ? "complété"
                          : transaction.status === "pending"
                          ? "en attente"
                          : transaction.status === "failed"
                          ? "échoué"
                          : transaction.status}
                      </span>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#d1d5db" : "#6b7280",
                        py: 2,
                      }}
                    >
                      {formatDate(transaction.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination Material-UI */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalTransactions}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
            }
            sx={{
              backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
              borderTop: `1px solid ${
                isDarkMode ? "#4b5563" : "#e5e7eb"
              }`,
              "& .MuiTablePagination-toolbar": {
                color: isDarkMode ? "#d1d5db" : "#374151",
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                {
                  color: isDarkMode ? "#d1d5db" : "#374151",
                },
              "& .MuiIconButton-root": {
                color: isDarkMode ? "#d1d5db" : "#374151",
              },
            }}
          />
        </Paper>
      ) : (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
            color: isDarkMode ? "#d1d5db" : "#374151",
            "& .MuiAlert-icon": {
              color: isDarkMode ? "#60a5fa" : "#3b82f6",
            },
          }}
        >
          {transactions.length === 0
            ? "Aucune transaction n'a été trouvée"
            : "Aucune transaction ne correspond aux filtres sélectionnés"}
        </Alert>
      )}
    </div>
  );
};

export default TransactionsTable;
