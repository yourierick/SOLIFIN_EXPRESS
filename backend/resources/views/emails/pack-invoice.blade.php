<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture SOLIFIN - Souscription au Pack</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .tagline {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .welcome {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .welcome h1 {
            color: #667eea;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .welcome p {
            color: #666;
            font-size: 16px;
        }
        
        .info-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        
        .info-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #333;
            font-size: 16px;
        }
        
        .cta-section {
            text-align: center;
            margin: 30px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .invoice-preview {
            background: #fff;
            border: 2px dashed #667eea;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        
        .invoice-icon {
            font-size: 48px;
            color: #667eea;
            margin-bottom: 15px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #eee;
        }
        
        .footer-info {
            color: #666;
            margin-bottom: 15px;
        }
        
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 15px;
        }
        
        .footer-links a {
            color: #667eea;
            text-decoration: none;
        }
        
        .footer-links a:hover {
            text-decoration: underline;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 15px;
        }
        
        .social-icon {
            width: 32px;
            height: 32px;
            background: #667eea;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 14px;
        }
        
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .footer-links {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">SOLIFIN</div>
            <div class="tagline">Solution Express Pour l'Indépendance Financière</div>
        </div>
        
        <div class="content">
            <div class="welcome">
                <h1>🎉 Merci pour votre achat!</h1>
                <p>Votre souscription au pack a été confirmée avec succès.</p>
            </div>
            
            <div class="info-card">
                <h3>📋 Détails de votre souscription</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Pack </span>
                        <span class="info-value">{{ $userPack->pack->name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Durée </span>
                        <span class="info-value">{{ $durationMonths }} mois</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Montant </span>
                        <span class="info-value">{{ number_format($amount, 2) }} {{ $currency }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Frais </span>
                        <span class="info-value">{{ number_format($fees, 2) }} {{ $currency }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date d'expiration </span>
                        <span class="info-value">{{ $userPack->expiry_date->format('d/m/Y') }}</span>
                    </div>
                </div>
            </div>
            
            <div class="invoice-preview">
                <div class="invoice-icon">📄</div>
                <h3>Votre facture est prête</h3>
                <p>Vous trouverez votre facture détaillée en pièce jointe de cet email.</p>
                <p><strong>Numéro de facture:</strong> INV-{{ str_pad($userPack->id, 6, '0', STR_PAD_LEFT) }}</p>
            </div>
            
            <div class="cta-section">
                <a href="{{ config('app.url') }}/login" class="cta-button">
                    Me connecter
                </a>
            </div>
            
            <div style="text-align: center; margin: 20px 0; padding: 20px; background: #e8f5e8; border-radius: 8px;">
                <h4 style="color: #2e7d32; margin-bottom: 10px;">✅ Paiement confirmé</h4>
                <p style="color: #2e7d32;">Votre paiement a été traité avec succès et votre pack est maintenant actif.</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-info">
                <strong>SOLIFIN</strong> - Solution Express Pour l'Indépendance Financière<br>
                123 Commune de la Gombe, Kinshasa, RD Congo<br>
                solifin2025@yahoo.com | +243 81 82 92 210
            </div>
            
            <div class="footer-links">
                <a href="{{ config('app.url') }}">Site web</a>
            </div>
            
            <div class="social-links">
                <a href="#" class="social-icon">f</a>
                <a href="#" class="social-icon">t</a>
                <a href="#" class="social-icon">in</a>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #999;">
                Cet email a été envoyé automatiquement. Merci de ne pas répondre à cet email.
            </div>
        </div>
    </div>
</body>
</html>
