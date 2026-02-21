<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture SOLIFIN - {{ $invoiceNumber }}</title>
    <style>
        @page {
            margin: 20mm;
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
            background: #667eea;
            color: white;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .company-info {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .company-tagline {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .invoice-details {
            text-align: right;
        }
        
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .invoice-date {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .content {
            padding: 0 10px;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #667eea;
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
            margin: 15px 0;
        }
        
        .items-table th {
            background: #f8f9fa;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            color: #667eea;
            border: 1px solid #ddd;
        }
        
        .items-table td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .totals-section {
            background: #f8f9fa;
            padding: 15px;
            border: 1px solid #ddd;
            margin-top: 15px;
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
            color: #667eea;
        }
        
        .grand-total {
            border-top: 2px solid #667eea;
            padding-top: 10px;
            margin-top: 5px;
            font-size: 14px;
        }
        
        .subscription-info {
            background: #f093fb;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .subscription-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .payment-info {
            background: #e8f5e8;
            border: 1px solid #4caf50;
            padding: 15px;
            border-radius: 5px;
            margin-top: 15px;
        }
        
        .payment-status {
            color: #2e7d32;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
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
            <div>
                <div class="company-name">SOLIFIN</div>
                <div class="company-tagline">Solution Express Pour l'Indépendance Financière</div>
            </div>
            <div class="invoice-details">
                <div class="invoice-number">Facture {{ $invoiceNumber }}</div>
                <div class="invoice-date">Date: {{ $invoiceDate }}</div>
            </div>
        </div>
    </div>
    
    <div class="content">
        <div class="two-columns">
            <div class="column">
                <div class="section">
                    <div class="section-title">Informations Client</div>
                    <div class="info-grid">
                        <div class="info-label">Nom:</div>
                        <div class="info-value">{{ $customer['name'] }}</div>
                        <div class="info-label">Email:</div>
                        <div class="info-value">{{ $customer['email'] }}</div>
                        <div class="info-label">Téléphone:</div>
                        <div class="info-value">{{ $customer['phone'] }}</div>
                    </div>
                </div>
            </div>
            
            <div class="column">
                <div class="section">
                    <div class="section-title">Informations Entreprise</div>
                    <div class="info-grid">
                        <div class="info-label">Nom:</div>
                        <div class="info-value">{{ $company['name'] }}</div>
                        <div class="info-label">Adresse:</div>
                        <div class="info-value">{{ $company['address'] }}</div>
                        <div class="info-label">Email:</div>
                        <div class="info-value">{{ $company['email'] }}</div>
                        <div class="info-label">Téléphone:</div>
                        <div class="info-value">{{ $company['phone'] }}</div>
                        <div class="info-label">RCCM:</div>
                        <div class="info-value">{{ $company['rccm'] }}</div>
                        <div class="info-label">IDNAT:</div>
                        <div class="info-value">{{ $company['idnat'] }}</div>
                    </div>
                </div>
            </div>
        </div>
        
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
            <div class="subscription-title">📅 Informations d'Abonnement</div>
            <div>
                <strong>Début:</strong> {{ $subscription['start_date'] }}<br>
                <strong>Fin:</strong> {{ $subscription['end_date'] }}<br>
                <strong>Durée:</strong> {{ $subscription['duration'] }}
            </div>
        </div>
        
        <div class="payment-info">
            <div class="payment-status">
                ✅ {{ $payment['status'] }} - {{ $payment['method'] }}
            </div>
            <div>Date de paiement: {{ $payment['date'] }} GMT</div>
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
