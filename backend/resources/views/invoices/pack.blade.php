<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture SOLIFIN - {{ $invoiceNumber }}</title>
    <style>
        @page {
            margin: 15mm;
            size: A4;
        }
        
        /* Règles de sauts de page appliquées en permanence pour PDF et impression */
        .header {
            page-break-inside: avoid !important;
        }
        
        .section {
            page-break-inside: avoid !important;
        }
        
        .items-table {
            page-break-inside: auto;
        }
        
        .items-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto;
        }
        
        .totals-section {
            page-break-inside: avoid !important;
            page-break-before: auto;
        }
        
        .subscription-info {
            page-break-inside: avoid !important;
        }
        
        .payment-info {
            page-break-inside: avoid !important;
            page-break-before: auto;
        }
        
        .footer {
            page-break-inside: avoid !important;
        }
        
        .company-info {
            page-break-inside: avoid !important;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            font-size: 12px;
        }
        
        .header {
            background: #385622;
            color: white;
            padding: 30px;
            margin-bottom: 15px;
            border-radius: 8px;
        }
        
        .company-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            width: 100%;
        }
        
        .header-left {
            flex: 1;
        }
        
        .header-right {
            flex: 1;
            text-align: right;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 2px;
        }
        
        .company-tagline {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .header-section {
            margin-bottom: 15px;
        }
        
        .header-label {
            font-size: 12px;
            opacity: 0.8;
            margin-bottom: 3px;
        }
        
        .header-value {
            font-size: 16px;
            font-weight: bold;
        }
        
        
        .content {
            padding: 0 10px;
        }
        
        .section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #3fc37b;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #3fc37b;
        }
        
        .two-columns {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .column {
            flex: 1;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 5px;
        }
        
        .info-label {
            font-weight: bold;
            color: #666;
        }
        
        .info-value {
            color: #333;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .items-table tr {
            /* Géré par les règles globales */
        }
        
        .items-table th {
            color: #3fc37b;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #e0e0e0;
        }
        
        .items-table td {
            padding: 12px;
            border: 1px solid #e0e0e0;
            background: white;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border: 1px solid #ddd;
            margin-top: 15px;
            border-radius: 8px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .total-label {
            font-weight: bold;
        }
        
        .total-value {
            font-weight: bold;
            color: #2c7a2c;
        }
        
        .grand-total {
            border-top: 2px solid #2c7a2c;
            padding-top: 15px;
            margin-top: 10px;
            font-size: 16px;
            color: #2c7a2c;
        }
        
        .subscription-info {
            background: #a2c988;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 5px solid #385622;
            box-shadow: 0 2px 4px rgba(162, 201, 136, 0.2);
        }
        
        .subscription-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .payment-info {
            background: #d4edda;
            border: 2px solid #28a745;
            padding: 20px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .payment-status {
            color: #155724;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        
        .footer-note {
            font-size: 10px;
            color: #999;
            font-style: italic;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <div class="header-left">
                <div class="company-name">SOLIFIN</div>
                <div class="company-tagline">Solution Express Pour l'Indépendance Financière</div>
                <div class="company-tagline">Mail: solifin2025@yahoo.com</div>
                <div class="company-tagline">Web: solifinexpress.com</div>
            </div>
            <div class="header-right">
                <div class="header-section">
                    <div class="header-label">N° FACTURE {{ $invoiceNumber }}</div>
                    <div class="header-value">DATE: {{ $invoiceDate }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="company-info" style="margin-top: 10px; padding: 10px;">
        <div class="header-left">
            <div class="header-section">
                <div class="section-title">Informations du Client</div>
                <div class="header-value">Nom : {{ $customer['name'] }}</div>
                <div class="header-value" style="font-size: 14px; font-weight: normal;">Email : {{ $customer['email'] }}</div>
                <div class="header-value" style="font-size: 14px; font-weight: normal;">Téléphone : {{ $customer['phone'] }}</div>
            </div>
        </div>
    </div>
    
    <div class="content">
        <div class="section">
            <div class="section-title">Détails de la Facture</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-center">Quantité</th>
                        <th class="text-right">Prix Unitaire</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                    <tr>
                        <td>{{ $item['description'] }}</td>
                        <td class="text-center">{{ $item['quantity'] }}</td>
                        <td class="text-right">{{ number_format($item['unit_price'], 2) }} {{ $item['currency'] }}</td>
                        <td class="text-right">{{ number_format($item['total'], 2) }} {{ $item['currency'] }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            
            <div class="totals-section">
                <div class="total-row">
                    <span class="total-label">Sous-total:</span>
                    <span class="total-value">{{ number_format($totals['subtotal'], 2) }} {{ $totals['currency'] }}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">Frais:</span>
                    <span class="total-value">{{ number_format($totals['tax'], 2) }} {{ $totals['currency'] }}</span>
                </div>
                <div class="total-row grand-total">
                    <span class="total-label">Total:</span>
                    <span class="total-value">{{ number_format($totals['total'], 2) }} {{ $totals['currency'] }}</span>
                </div>
            </div>
        </div>
        
        <div class="subscription-info">
            <div class="subscription-title">
                <span>INFORMATIONS D'ABONNEMENT</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px;">
                <div>
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">DÉBUT</div>
                    <div style="font-weight: bold;">{{ $subscription['start_date'] }}</div>
                </div>
                <div>
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">FIN</div>
                    <div style="font-weight: bold;">{{ $subscription['end_date'] }}</div>
                </div>
                <div>
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 3px;">DURÉE</div>
                    <div style="font-weight: bold;">{{ $subscription['duration'] }}</div>
                </div>
            </div>
        </div>
        
        <div class="payment-info">
            <div class="payment-status">
                <span style="font-size: 20px; margin-right: 8px;">{{ $payment['status'] === 'Payé' ? 'Payé - ' : 'En attente - ' }}</span>
                <span style="font-size: 14px; font-weight: normal;">{{ $payment['method'] }}</span>
            </div>
            <div style="margin-top: 8px; font-size: 14px;">
                <strong>Date:</strong> {{ $payment['date'] }} GMT
            </div>
        </div>
    </div>
    
    <div class="footer">
        <div>
            <strong>{{ $company['name'] }}</strong> | {{ $company['address'] }}<br>
            {{ $company['email'] }} | {{ $company['phone'] }} | {{ $company['website'] }}
        </div>
        <div class="footer-note">
            Merci pour votre confiance! Cette facture est générée automatiquement et est valide sans signature.
        </div>
    </div>
</body>
</html>
