const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OfficialReceiptService {
    constructor() {
        this.receiptsDir = path.join(__dirname, '../generated-receipts');
        this.ensureReceiptsDirectory();
    }

    ensureReceiptsDirectory() {
        if (!fs.existsSync(this.receiptsDir)) {
            fs.mkdirSync(this.receiptsDir, { recursive: true });
        }
    }

    async getBarangayConfig() {
        try {
            const { data, error } = await supabase
                .from('barangay_officials')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching officials config:', error);
                return this.getDefaultConfig();
            }

            return {
                headerInfo: {
                    country: 'Republic of the Philippines',
                    province: 'Province of Bulacan',
                    municipality: 'Municipality of Calumpit',
                    barangayName: "BARANGAY IBA O' ESTE"
                },
                contactInfo: {
                    address: "Iba O' Este, Calumpit, Bulacan",
                    telephone: '(044) 913-1234',
                    email: 'ibaeste.calumpit@gmail.com',
                    contactPerson: 'Barangay Secretary'
                },
                treasurer: data?.treasurer || 'MARIA ELENA C. SANTOS',
                chairman: data?.chairman || 'ALEXANDER C. MANIO'
            };
        } catch (error) {
            console.error('Error in getBarangayConfig:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            headerInfo: {
                country: 'Republic of the Philippines',
                province: 'Province of Bulacan',
                municipality: 'Municipality of Calumpit',
                barangayName: "BARANGAY IBA O' ESTE"
            },
            contactInfo: {
                address: "Iba O' Este, Calumpit, Bulacan",
                telephone: '(044) 913-1234',
                email: 'ibaeste.calumpit@gmail.com',
                contactPerson: 'Barangay Secretary'
            },
            treasurer: 'MARIA ELENA C. SANTOS',
            chairman: 'ALEXANDER C. MANIO'
        };
    }

    async generateOfficialReceipt(requestId, paymentAmount = 100, options = {}) {
        try {
            console.log(`Generating Official Receipt for request ID: ${requestId}`);

            // Get request details
            const { data: request, error: requestError } = await supabase
                .from('certificate_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (requestError) {
                throw new Error(`Request not found: ${requestError.message}`);
            }

            // Get barangay configuration
            const config = await this.getBarangayConfig();

            // Generate OR number (or use assigned number from treasurer / preparation)
            const orNumber =
                options.orNumber && String(options.orNumber).trim()
                    ? String(options.orNumber).trim()
                    : await this.generateORNumber();

            // Generate the HTML content
            const htmlContent = await this.generateORContent(request, config, orNumber, paymentAmount);

            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `OR_${orNumber}_${timestamp}.html`;
            const filePath = path.join(this.receiptsDir, filename);

            // Write the HTML file
            fs.writeFileSync(filePath, htmlContent);

            console.log(`Official Receipt generated successfully: ${filename}`);

            return {
                success: true,
                filePath: filename, // Return just the filename for URL construction
                filename: filename,
                orNumber: orNumber
            };

        } catch (error) {
            console.error('Error generating Official Receipt:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateORNumber() {
        try {
            // Get the current year
            const year = new Date().getFullYear();
            const yearSuffix = year.toString().slice(-2); // Last 2 digits of year

            // Get the latest OR number for this year
            const { data: receipts, error } = await supabase
                .from('official_receipts')
                .select('or_number')
                .like('or_number', `${yearSuffix}-%`)
                .order('created_at', { ascending: false })
                .limit(1);

            let nextNumber = 1;
            if (receipts && receipts.length > 0) {
                const lastOR = receipts[0].or_number;
                const lastNumber = parseInt(lastOR.split('-')[1]);
                nextNumber = lastNumber + 1;
            }

            return `${yearSuffix}-${String(nextNumber).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating OR number:', error);
            // Fallback to timestamp-based number
            const timestamp = Date.now().toString().slice(-6);
            return `26-${timestamp}`;
        }
    }

    async generateORContent(request, config, orNumber, amount) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Parse business details
        let businessDetails = {};
        try {
            if (typeof request.details === 'string') {
                businessDetails = JSON.parse(request.details);
            } else if (typeof request.details === 'object') {
                businessDetails = request.details || {};
            }
        } catch (e) {
            console.error('Error parsing business details:', e);
        }

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Receipt - ${orNumber}</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 40px;
                    background: #f8fafc;
                    color: #0f172a;
                    line-height: 1.5;
                }
                .receipt-container {
                    max-width: 650px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                    padding: 40px;
                    position: relative;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px dashed #cbd5e1;
                    padding-bottom: 25px;
                    margin-bottom: 30px;
                }
                .header p { margin: 0 0 5px 0; font-size: 13px; font-weight: normal; color: #475569; }
                .header h1 { margin: 5px 0; font-size: 20px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; }
                .header h2 { margin: 0; font-size: 13px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;}
                .title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .title-row h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 900;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: -0.5px;
                }
                .or-badge {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .info-item {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .info-item.full {
                    grid-column: 1 / -1;
                }
                .label {
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    font-weight: 800;
                    color: #64748b;
                    margin-bottom: 4px;
                    letter-spacing: 0.5px;
                }
                .value {
                    display: block;
                    font-size: 14px;
                    font-weight: 800;
                    color: #0f172a;
                    word-break: break-word;
                }
                .amount-box {
                    background: linear-gradient(to right, #f8fafc, #f1f5f9);
                    border: 1px solid #cbd5e1;
                    border-left: 5px solid #10b981;
                    padding: 25px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .amount-title {
                    font-size: 12px;
                    font-weight: 800;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .amount-value {
                    font-size: 32px;
                    font-weight: 900;
                    color: #0f172a;
                    letter-spacing: -1px;
                }
                .amount-words {
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    max-width: 60%;
                    text-align: right;
                }
                .signature-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                }
                .sig-box {
                    width: 45%;
                    text-align: center;
                }
                .sig-line {
                    height: 1px;
                    background: #cbd5e1;
                    margin: 30px 0 10px 0;
                }
                .sig-name {
                    font-weight: 900;
                    font-size: 14px;
                    color: #0f172a;
                    margin: 0 0 2px 0;
                    text-transform: uppercase;
                }
                .sig-title {
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748b;
                    margin: 0;
                    text-transform: uppercase;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    font-weight: 600;
                }
                @media print {
                    body { background: white; padding: 0; }
                    .receipt-container { padding: 25px; box-shadow: none; border: 2px solid #000; border-radius: 0; }
                    .amount-box { border: 1px solid #000 !important; border-left: 5px solid #000 !important; }
                    .info-item { border: 1px solid #000; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <p>${config.headerInfo.country}<br>${config.headerInfo.province}<br>${config.headerInfo.municipality}</p>
                    <h1>${config.headerInfo.barangayName}</h1>
                    <h2>OFFICE OF THE BARANGAY TREASURER</h2>
                </div>

                <div class="title-row">
                    <h2>Official Receipt</h2>
                    <div class="or-badge">OR No: ${orNumber}</div>
                </div>

                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Date & Time</span>
                        <span class="value">${currentDate} @ ${currentTime}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Reference No.</span>
                        <span class="value">${request.reference_number}</span>
                    </div>
                    <div class="info-item full">
                        <span class="label">Received From</span>
                        <span class="value">${(request.full_name || request.applicant_name || '').toUpperCase()}</span>
                    </div>
                    <div class="info-item full">
                        <span class="label">Address</span>
                        <span class="value">${(request.address || '').toUpperCase()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Business Name</span>
                        <span class="value">${(businessDetails.businessName || 'NA').toUpperCase()}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Nature of Business</span>
                        <span class="value">${(businessDetails.natureOfBusiness || 'NA').toUpperCase()}</span>
                    </div>
                </div>

                <div class="amount-box">
                    <div>
                        <div class="amount-title">Amount Received</div>
                        <div class="amount-value">₱ ${parseFloat(amount || 0).toFixed(2)}</div>
                    </div>
                    <div class="amount-words">
                        (${this.numberToWords(Math.floor(parseFloat(amount || 0)))} PESOS ONLY)
                    </div>
                </div>

                <div class="info-grid" style="margin-bottom: 0;">
                    <div class="info-item">
                        <span class="label">Payment For</span>
                        <span class="value">BUSINESS PERMIT PROCESSING FEE</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Payment Method</span>
                        <span class="value">CASH</span>
                    </div>
                </div>

                <div class="signature-section">
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <p class="sig-name">PAYOR'S SIGNATURE</p>
                    </div>
                    <div class="sig-box">
                        <div class="sig-line"></div>
                        <p class="sig-name">${config.treasurer}</p>
                        <p class="sig-title">Barangay Treasurer</p>
                    </div>
                </div>

                <div class="footer">
                    <p>This receipt is valid only when properly signed and dated.</p>
                    <p>Contact: ${config.contactInfo.telephone} | ${config.contactInfo.email}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    numberToWords(num) {
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
        const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
        const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

        if (num === 0) return 'ZERO';

        function convertHundreds(n) {
            let result = '';
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' HUNDRED ';
                n %= 100;
            }
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
                return result;
            }
            if (n > 0) {
                result += ones[n] + ' ';
            }
            return result;
        }

        let result = '';
        let thousandCounter = 0;

        while (num > 0) {
            if (num % 1000 !== 0) {
                result = convertHundreds(num % 1000) + thousands[thousandCounter] + ' ' + result;
            }
            num = Math.floor(num / 1000);
            thousandCounter++;
        }

        return result.trim();
    }
}

module.exports = new OfficialReceiptService();