<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * AuditLogsExport - Export des logs d'audit au format Excel
 * Rôle: Générer un fichier Excel lisible avec les données formatées
 */
class AuditLogsExport implements FromCollection, WithHeadings, WithColumnWidths, WithStyles, ShouldAutoSize
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data);
    }

    public function headings(): array
    {
        return [
            'ID',
            'Type d\'audit',
            'Entité',
            'Invariant',
            'Sévérité',
            'Valeur attendue',
            'Valeur réelle',
            'Écart',
            'Statut',
            'Date de création',
            'Date de résolution',
            'Métadonnées'
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,  // ID
            'B' => 15, // Type d'audit
            'C' => 20, // Entité
            'D' => 25, // Invariant
            'E' => 12, // Sévérité
            'F' => 15, // Valeur attendue
            'G' => 15, // Valeur réelle
            'H' => 12, // Écart
            'I' => 15, // Statut
            'J' => 20, // Date de création
            'K' => 20, // Date de résolution
            'L' => 30, // Métadonnées
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style pour l'en-tête
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                    'color' => ['rgb' => 'FFFFFF']
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5']
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
                ]
            ],
            
            // Style pour les données
            'A2:L1000' => [
                'alignment' => [
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                        'color' => ['rgb' => 'E5E7EB']
                    ]
                ]
            ],

            // Style pour les colonnes de date
            'J' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER
                ]
            ],
            'K' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER
                ]
            ],

            // Style pour les montants
            'F' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
                ]
            ],
            'G' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
                ]
            ],
            'H' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT
                ]
            ],

            // Style pour la sévérité
            'E' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER
                ]
            ],
            'I' => [
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER
                ]
            ]
        ];
    }

    private function formatAmount($amount): string
    {
        return number_format($amount, 2, '.', ',') . ' $';
    }

    private function formatDateTime($dateTime): string
    {
        return $dateTime ? $dateTime->format('d/m/Y H:i:s') : '';
    }

    private function formatMetadata($metadata): string
    {
        if (empty($metadata)) {
            return '';
        }

        // Formater les métadonnées en JSON lisible
        $formatted = [];
        foreach ($metadata as $key => $value) {
            if (is_array($value)) {
                $formatted[] = "{$key}: " . json_encode($value, JSON_UNESCAPED_UNICODE);
            } else {
                $formatted[] = "{$key}: {$value}";
            }
        }

        return implode(' | ', $formatted);
    }
}
