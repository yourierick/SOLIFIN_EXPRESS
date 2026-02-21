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
import { getOperationType } from "../../../components/OperationTypeFormatter";
import { getTransactionColor } from "../../../components/TransactionColorFormatter";
import { TransferWithinAStationSharp } from '@mui/icons-material';

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
                    Direction
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
                    Balance avant
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
                    Balance après
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
                    Effectué par
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
                          transaction.direction === "out" || transaction.direction === "freeze"
                            ? isDarkMode ? "#f87171" : "#dc2626"
                            : isDarkMode ? "#34d399" : "#16a34a",
                        py: 2,
                        fontWeight: 500,
                      }}
                    >
                      {transaction.direction === "out" ? "Sortie" : transaction.direction === "in" ? "Entrée" : transaction.direction === "freeze" ? 'Blocage' : 'Déblocage'}
                    </TableCell>
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
                            getTransactionColor(transaction.type)
                          }`}
                        >
                          {transaction.type === "funds_withdrawal" ? (
                            <ArrowDownTrayIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : transaction.type === "funds_receipt" ? (
                            <BanknotesIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : transaction.type === "funds_transfer" ? (
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
                            {getOperationType(transaction.type)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color:
                          transaction.direction === "out" || transaction.direction === "freeze"
                            ? isDarkMode ? "#f87171" : "#dc2626"
                            : isDarkMode ? "#34d399" : "#16a34a",
                        py: 2,
                        fontWeight: 500,
                      }}
                    >
                      {transaction.amount + ' $'}
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
                          : transaction.status === "processing"
                          ? "en cours de traitement"
                          : transaction.status === "reversed"
                          ? "Annulé"
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
                      {transaction.balance_before}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#d1d5db" : "#6b7280",
                        py: 2,
                      }}
                    >
                      {transaction.balance_after}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: "0.875rem",
                        color: isDarkMode ? "#d1d5db" : "#6b7280",
                        py: 2,
                      }}
                    >
                      {transaction.processed_by}
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
