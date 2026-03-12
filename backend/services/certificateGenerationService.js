const fs = require('fs');
const path = require('path');
const { supabase } = require('./supabaseClient');

class CertificateGenerationService {
    constructor() {
        this.certificatesDir = path.join(__dirname, '../generated-certificates');
        this.ensureCertificatesDirectory();
    }

    ensureCertificatesDirectory() {
        if (!fs.existsSync(this.certificatesDir)) {
            fs.mkdirSync(this.certificatesDir, { recursive: true });
        }
    }

    // Helper to fetch and map configuration
    async getBarangayConfig() {
        // 1. Fetch Officials
        const { data: officialsRows } = await supabase
            .from('barangay_officials')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        // 2. Fetch Settings
        const { data: settingsRow } = await supabase
            .from('barangay_settings')
            .select('value')
            .eq('key', 'certificate_settings')
            .single();

        const settings = settingsRow?.value || {}; // Contains headerInfo, logos, styles etc.

        // Map officials to simple keys
        const officials = {
            chairman: 'ALEXANDER C. MANIO', // Fallback
            secretary: 'ROYCE ANN C. GALVEZ',
            treasurer: 'MA. LUZ S. REYES',
            skChairman: 'JOHN RUZZEL C. SANTOS',
            councilors: [],
            administrator: 'ROBERT D. SANTOS',
            assistantSecretary: 'PERLITA C. DE JESUS',
            assistantAdministrator: 'KHINZ JANZL V. BARROGA',
            recordKeeper: 'EMIL D. ROBLES',
            clerk: 'CIELITO B. DE LEON',
        };

        if (officialsRows) {
            const kagawads = [];
            officialsRows.forEach(o => {
                const pos = o.position_type?.toLowerCase();
                const name = o.name;

                if (pos === 'captain' || pos === 'chairman' || pos === 'punong_barangay') officials.chairman = name;
                else if (pos === 'secretary') officials.secretary = name;
                else if (pos === 'treasurer') officials.treasurer = name;
                else if (pos === 'sk_chairman') officials.skChairman = name;
                else if (pos === 'kagawad' || pos === 'councilor') kagawads.push(name);
                else if (pos === 'administrator') officials.administrator = name;
                else if (pos === 'assistant_secretary') officials.assistantSecretary = name;
                else if (pos === 'assistant_administrator') officials.assistantAdministrator = name;
                else if (pos === 'record_keeper') officials.recordKeeper = name;
                else if (pos === 'clerk') officials.clerk = name;
            });
            if (kagawads.length > 0) officials.councilors = kagawads;
            else officials.councilors = ['JOELITO C. MANIO', 'ENGELBERT M. INDUCTIVO', 'NORMANDO T. SANTOS', 'JOPHET M. TURLA', 'JOHN BRYAN C. CRUZ', 'ARNEL D. BERNARDINO', 'LORENA G. LOPEZ'];
        }

        return {
            officials,
            ...settings, // headerInfo, logos, styles (headerStyle, countryStyle, etc)
            // Ensure defaults if settings are empty
            headerInfo: settings.headerInfo || {
                country: 'Republic of the Philippines',
                province: 'Province of Bulacan',
                municipality: 'Municipality of Calumpit',
                barangayName: "BARANGAY IBA O' ESTE",
                officeName: 'Office of the Punong Barangay'
            },
            styles: {
                headerStyle: settings.headerStyle || { borderColor: '#1e40af', bgColor: '#ffffff' },
                countryStyle: settings.countryStyle || { color: '#666', size: 14 },
                provinceStyle: settings.provinceStyle || { color: '#666', size: 14 },
                municipalityStyle: settings.municipalityStyle || { color: '#666', size: 14 },
                barangayNameStyle: settings.barangayNameStyle || { color: '#1e40af', size: 24, fontWeight: 'bold' },
                officeNameStyle: settings.officeNameStyle || { color: '#888', size: 12 },
                bodyStyle: settings.bodyStyle || { textColor: '#000000', titleColor: '#16a34a' },
                footerStyle: settings.footerStyle || { textColor: '#666666', borderColor: '#ddd' }
            },
            logos: settings.logos || { logoSize: 80 }
        };
    }

    async generateCertificate(requestId, previewOnly = false, templateType = null) {
        try {
            console.log(`Generating certificate for request ID: ${requestId} (Preview only: ${previewOnly}, Template: ${templateType})`);

            // Get certificate request details
            const { data: request, error: requestError } = await supabase
                .from('certificate_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (requestError) throw requestError;
            if (!request) throw new Error('Certificate request not found');

            // Get dynamic configuration
            console.log(`[CERT-GEN] Fetching brgy config for ID: ${requestId}`);
            const config = await this.getBarangayConfig();
            console.log(`[CERT-GEN] Config fetched for ID: ${requestId}`);

            // Fetch approval history to get employee code
            const { data: history } = await supabase
                .from('workflow_history')
                .select('*, users:performed_by (first_name, last_name, employee_code)')
                .eq('request_id', requestId)
                .order('created_at', { ascending: false });

            // Find the timestamp of the last "return" or "reject" event to reset codes
            const returnEvents = (history || []).filter(h => h.action === 'return' || h.action === 'reject');
            const lastReturnTime = returnEvents.length > 0 ? Math.max(...returnEvents.map(h => new Date(h.created_at).getTime())) : 0;

            // Collect all unique employee codes from previous processors in chronological order, AFTER the most recent return
            const previousProcessors = (history || [])
                .filter(h => ['create', 'approve', 'forward', 'physical_inspection'].includes(h.action) && h.users?.employee_code)
                .filter(h => new Date(h.created_at).getTime() > lastReturnTime)
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map(h => h.users.employee_code);
                
            const uniqueProcessorCodes = [...new Set(previousProcessors)].join(' / ');
            
            // Pass a unified object to maintain compatibility with existing template logic
            const captainApproval = uniqueProcessorCodes ? { users: { employee_code: uniqueProcessorCodes } } : null;

            // Generate certificate content based on type
            let certificateContent;
            switch (request.certificate_type) {
                case 'barangay_clearance':
                    certificateContent = await this.generateBarangayClearanceContent(request, config, captainApproval);
                    break;
                case 'certificate_of_indigency':
                    certificateContent = this.generateIndigencyContent(request, config, captainApproval);
                    break;
                case 'barangay_residency':
                    certificateContent = this.generateResidencyContent(request, config, captainApproval);
                    break;
                case 'certification_same_person':
                    certificateContent = this.generateSamePersonContent(request, config, captainApproval);
                    break;
                case 'barangay_guardianship':
                    certificateContent = this.generateGuardianshipContent(request, config, captainApproval);
                    break;
                case 'barangay_cohabitation':
                    certificateContent = this.generateCohabitationContent(request, config, captainApproval);
                    break;
                case 'natural_death':
                    certificateContent = this.generateNaturalDeathContent(request, config, captainApproval);
                    break;
                case 'certification_medico_legal':
                    certificateContent = this.generateMedicoLegalContent(request, config, captainApproval);
                    break;
                case 'business_permit':
                    // Choose template for business permit
                    if (templateType === 'new') {
                        // Explicitly requested new template
                        certificateContent = await this.generateBusinessClearanceContent(request, config, captainApproval);
                    } else {
                        // Default to the old Business Permit template (satisfies 'revert' request)
                        certificateContent = await this.generateBusinessPermitContent(request, config, captainApproval);
                    }
                    break;
                default:
                    if (String(request.certificate_type || '').toLowerCase().includes('medico') || 
                        String(request.reference_number || '').toUpperCase().startsWith('CDL')) {
                        certificateContent = this.generateMedicoLegalContent(request, config, captainApproval);
                    } else {
                        throw new Error(`Unknown certificate type: ${request.certificate_type}`);
                    }
            }

            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${request.reference_number}_${timestamp}.html`;
            const filePath = path.join(this.certificatesDir, filename);

            // Save certificate to file
            fs.writeFileSync(filePath, certificateContent);

            // Only update database status if NOT preview mode
            // We strictly check for true to be safe, but also handle other truthy values if intended as preview
            const isPreview = previewOnly === true || previewOnly === 'true';
            console.log(`[CERT-GEN] requestId: ${requestId}, previewOnly: ${previewOnly}, isPreview: ${isPreview}`);

            if (!isPreview) {
                const { error: updateError } = await supabase
                    .from('certificate_requests')
                    .update({
                        certificate_file_path: filePath,
                        certificate_generated_at: new Date().toISOString(),
                        status: 'ready'
                    })
                    .eq('id', requestId);

                if (updateError) throw updateError;
                console.log(`Certificate generated and status updated to 'ready': ${filename}`);
            } else {
                console.log(`Certificate preview generated (status not changed): ${filename}`);
            }

            return {
                success: true,
                filePath,
                filename,
                referenceNumber: request.reference_number
            };

        } catch (error) {
            console.error('Error generating certificate:', error);
            throw error;
        }
    }

    // Common Header Generator
    generateHeader(config) {
        const { headerInfo, logos, styles } = config;
        const leftLogoSrc = logos.leftLogo || '';
        const rightLogoSrc = logos.rightLogo || '';
        const size = logos.logoSize || 80;

        const getFontClass = (font) => {
            const fonts = { 'serif': 'font-family: serif;', 'sans': 'font-family: sans-serif;', 'mono': 'font-family: monospace;' };
            return fonts[font] || '';
        };

        return `
        <div class="header" style="display: flex; align-items: center; justify-content: space-between; padding: 15px 40px; border-bottom: 3px solid #0369a1; background-color: #ffffff; ${getFontClass(styles.headerStyle.fontFamily)}">
            <div style="width: ${size}px; height: ${size}px; flex-shrink: 0;">
                ${leftLogoSrc ? `<img src="${leftLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
            </div>
            <div style="text-align: center; flex: 1; padding: 0 20px;">
                <p style="margin: 0; color: #4b5563; font-size: 11px; font-weight: normal; line-height: 1.2; ${getFontClass(styles.countryStyle.fontFamily)}">${headerInfo.country || 'Republic of the Philippines'}</p>
                <p style="margin: 0; color: #4b5563; font-size: 11px; font-weight: normal; line-height: 1.2; ${getFontClass(styles.provinceStyle.fontFamily)}">${headerInfo.province || 'Province of Bulacan'}</p>
                <p style="margin: 0; color: #4b5563; font-size: 11px; font-weight: normal; line-height: 1.2; ${getFontClass(styles.municipalityStyle.fontFamily)}">${headerInfo.municipality || 'Municipality of Calumpit'}</p>
                <p style="margin: 4px 0 0; color: #1e40af; font-size: 18px; font-weight: bold; line-height: 1.2; ${getFontClass(styles.barangayNameStyle.fontFamily)}">${headerInfo.barangayName || "BARANGAY IBA O' ESTE"}</p>
                <p style="margin: 0; color: #dc2626; font-size: 11px; font-weight: bold; line-height: 1.2; ${getFontClass(styles.officeNameStyle.fontFamily)}">${headerInfo.officeName || 'OFFICE OF THE BARANGAY CHAIRMAN'}</p>
            </div>
            <div style="width: ${size}px; height: ${size}px; flex-shrink: 0;">
                ${rightLogoSrc ? `<img src="${rightLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
            </div>
        </div>
      `;
    }

    generateSidebar(config) {
        const { officials, styles, logos } = config;
        const s = styles.sidebarStyle || {};

        const getFontClass = (font) => {
            const fonts = { 'serif': 'font-family: serif;', 'sans': 'font-family: sans-serif;', 'mono': 'font-family: monospace;' };
            return fonts[font] || '';
        };

        return `
        <div class="sidebar" style="width: 220px; flex-shrink: 0; padding: 20px; color: ${s.textColor || '#ffffff'}; background: linear-gradient(to bottom, ${s.bgColor || '#1e40af'}, ${s.gradientEnd || '#1e3a8a'}); text-align: center; ${getFontClass(s.fontFamily)}">
            <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold; font-size: ${(s.titleSize || 16) + 4}px;">BARANGAY</p>
                <p style="margin: 0; font-weight: bold; font-size: ${(s.titleSize || 16) + 4}px;">IBA O' ESTE</p>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.2); pt-3;">
                <p style="font-weight: bold; margin: 15px 0 10px; color: ${s.labelColor || '#fde047'}; font-size: ${(s.titleSize || 13) + 2}px;">BARANGAY COUNCIL</p>
                
                <div style="margin-bottom: 15px;">
                    <div style="width: 120px; height: 160px; margin: 0 auto 10px; background-color: rgba(0,0,0,0.1); border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); overflow: hidden;">
                        ${logos.captainImage ? `<img src="${logos.captainImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Punong Barangay</p>
                    <p style="margin: 0; font-weight: bold; font-size: ${(s.textSize || 11) + 1}px;">${officials.chairman}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p style="margin: 0 0 5px; font-size: ${s.textSize || 11}px; opacity: 0.8;">Kagawad</p>
                    ${officials.councilors.map(c => `<p style="margin: 0; font-size: ${s.textSize || 11}px; line-height: 1.4;">${c}</p>`).join('')}
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">SK Chairman</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.skChairman}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 8px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Barangay Secretary</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.secretary}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 8px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Barangay Treasurer</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.treasurer}</p>
                </div>
            </div>
        </div>
        `;
    }

    generateFooter(request, config) {
        const { styles, contactInfo } = config;
        return `
        <div class="footer" style="padding: 15px 40px; font-size: 10px; color: ${styles.footerStyle.textColor || '#374151'}; border-top: 2px solid ${styles.footerStyle.borderColor || '#d1d5db'}; background-color: ${styles.footerStyle.bgColor || '#f9fafb'};">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <p style="margin: 0;"><strong>Address:</strong> ${contactInfo?.address || ''}</p>
                    <p style="margin: 0;"><strong>Contact:</strong> ${contactInfo?.contactPerson || ''} (${contactInfo?.telephone || ''}) email: ${contactInfo?.email || ''}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0;">Reference No: <strong>${request.reference_number}</strong></p>
                    <p style="margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
      `;
    }

    async generateBarangayClearanceContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        // Check if this clearance has physical inspection data
        const inspectionData = await this.getPhysicalInspectionData(request.id);
        const hasInspectionData = inspectionData && Object.keys(inspectionData.areas).some(area =>
            inspectionData.areas[area].findings || inspectionData.areas[area].date || inspectionData.areas[area].remarks
        );

        let bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>`;

        // Add physical inspection section if data exists
        if (hasInspectionData) {
            bodyHtml += `
                <div style="margin: 30px 0; border: 1px solid #ccc; padding: 15px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Physical Inspection Report</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Areas</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 40%;">Findings and Recommendations</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Date of Inspection</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateInspectionRows(inspectionData.areas)}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; font-size: 11px;">
                        <strong>Date and Time of Visit:</strong> ${inspectionData.visitDateTime ? new Date(inspectionData.visitDateTime).toLocaleString() : 'N/A'}<br>
                        <strong>Name of Owner / Representative:</strong> ${inspectionData.ownerRepresentative || 'N/A'}
                    </div>

                    <div style="margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">Recommending Approval</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead>
                                <tr style="background: #f0f0f0;">
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 30%;">Committee</th>
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 50%;">Name of Signatory</th>
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateCommitteeRows(inspectionData.recommendations)}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }

        bodyHtml += `
                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line" style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 20px 0 5px 0;">
                            <p style="font-size: 12px; margin: 0; padding-top: 45px;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('BARANGAY CLEARANCE CERTIFICATE', bodyHtml, request, config);
    }

    generateIndigencyContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident and their family belongs to the "Indigent Families" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>

                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line" style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 20px 0 5px 0;">
                            <p style="font-size: 12px; margin: 0; padding-top: 45px;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('CERTIFICATE OF INDIGENCY', bodyHtml, request, config);
    }

    generateResidencyContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident of this barangay as of the date mentioned below:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>

                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line" style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 20px 0 5px 0;">
                            <p style="font-size: 12px; margin: 0; padding-top: 45px;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('BARANGAY RESIDENCY CERTIFICATE', bodyHtml, request, config);
    }

    generateSamePersonContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};
        
        // Parse details if it's a JSON string
        let details = {};
        if (request.details) {
            try {
                details = typeof request.details === 'string' ? JSON.parse(request.details) : request.details;
            } catch (e) {
                console.error('Error parsing details:', e);
            }
        }

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below names belongs to one and the same person, bona fide resident of this barangay as described herein:
                </p>

                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">Name (1)</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${details.name1 || request.full_name || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Name (2)</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${details.name2 || details.aliasName || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Residential Address</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${request.address || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Age</span>
                        <span class="info-colon">:</span>
                        <span class="info-value">${request.age || '-'}</span>
                    </div>
                </div>

                <div style="margin: 15px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>

                <p style="margin-bottom: 10px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line" style="border-bottom: 1px solid #000; width: 300px; height: 40px; margin: 20px auto 5px auto;">
                            <p style="font-size: 12px; margin: 0; padding-top: 45px;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 10px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        // Create title without individual word underlines
        const titleHtml = `
            <div style="text-align: center; margin: 20px 0;">
                <div style="display: inline-block; white-space: nowrap;">
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">BARANGAY</span>
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">CERTIFICATION</span>
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">BEING</span>
                </div>
                <div style="display: inline-block; white-space: nowrap; margin-top: 5px;">
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">THE</span>
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">SAME</span>
                    <span style="display: inline-block; padding: 0 4px; font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: 1px;">PERSON</span>
                </div>
            </div>
        `;

        return this.generateDocumentWithCustomTitle(titleHtml, bodyHtml, request, config);
    }

    generateDocumentWithCustomTitle(titleHtml, bodyHtml, request, config) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Same Person Certificate - ${request.reference_number}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .certificate-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: 200px 20px 1fr;
                    gap: 10px 0;
                    margin: 20px 0;
                }
                .detail-label {
                    font-weight: bold;
                }
                .detail-value {
                    font-weight: bold;
                }
                .info-grid {
                    margin: 25px 0;
                }
                .info-row {
                    display: flex;
                    margin: 12px 0;
                    font-size: 14px;
                }
                .info-label {
                    font-weight: bold;
                    min-width: 200px;
                }
                .info-colon {
                    margin: 0 10px;
                }
                .info-value {
                    font-weight: bold;
                    flex: 1;
                    text-decoration: underline;
                }
                .signature-section {
                    margin-top: 44px;
                }
                .sig-block {
                    text-align: center;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    width: 300px;
                    height: 40px;
                    margin: 20px auto 5px auto;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .certificate-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                ${this.generateHeader(config)}
                
                ${titleHtml}
                
                ${bodyHtml}
                
                ${this.generateFooter(request, config)}
            </div>
        </body>
        </html>
        `;
    }

    generateDocument(title, bodyHtml, request, config) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} - ${request.reference_number}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .certificate-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 20px 0; 
                    text-align: center;
                    text-transform: uppercase;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    gap: 8px 15px;
                    margin: 20px 0;
                    align-items: baseline;
                }
                .detail-label {
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .detail-value {
                    font-weight: bold;
                    text-decoration: underline;
                }
                .signature-section {
                    margin-top: 60px;
                }
                .sig-block {
                    margin: 20px 0;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    width: 300px;
                    height: 40px;
                    margin: 20px 0 5px 0;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .certificate-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                ${this.generateHeader(config)}
                
                <div class="title">${title}</div>
                
                ${bodyHtml}
                
                ${this.generateFooter(request, config)}
            </div>
        </body>
        </html>
        `;
    }
    async generateBusinessPermitContent(request, config, captainApproval = null) {
        try {
            console.log(`[CERT-GEN] Generating Business Permit Content for: ${request.reference_number}`);
            // Get physical inspection data from the new tables
            const inspectionData = await this.getPhysicalInspectionData(request.id);
            const leftLogoSrc = config.logos?.leftLogo || '';
            const qrCodeSVG = this.generateQRCodeSVG(`${config.baseUrl}/verify/${request.reference_number}`);
            console.log(`[CERT-GEN] Inspection data and QR generated`);

            return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Business Permit - ${request.reference_number}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .certificate-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                .logo { 
                    width: 80px; 
                    height: 80px; 
                    margin: 0 auto 10px; 
                }
                .title { 
                    font-size: 16px; 
                    font-weight: 900; 
                    margin: 20px 0 10px; 
                    text-transform: uppercase;
                    color: #991b1b;
                    text-align: center;
                }
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 500px;
                    height: 500px;
                    opacity: 0.1;
                    z-index: -1;
                    pointer-events: none;
                }
                .content { 
                    margin: 20px 0; 
                }
                .section { 
                    margin: 20px 0; 
                    border: 1px solid #000;
                    padding: 15px;
                }
                .section-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-transform: uppercase;
                    background: #f0f0f0;
                    padding: 5px;
                    margin: -15px -15px 10px -15px;
                }
                .info-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0;
                }
                .info-table td { 
                    padding: 5px; 
                    border: 1px solid #000; 
                    vertical-align: top;
                }
                .info-table .label { 
                    font-weight: bold; 
                    background: #f9f9f9; 
                    width: 30%;
                }
                .inspection-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0;
                    font-size: 10px;
                }
                .inspection-table th, .inspection-table td { 
                    padding: 4px; 
                    border: 1px solid #000; 
                    text-align: left;
                }
                .inspection-table th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .signatures { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: 40px; 
                }
                .signature-block { 
                    text-align: center; 
                    width: 45%; 
                }
                .signature-line { 
                    border-bottom: 1px solid #000; 
                    margin: 30px 0 5px 0; 
                    height: 1px; 
                }
                .qr-code { 
                    position: absolute; 
                    top: 20px; 
                    right: 20px; 
                    width: 80px; 
                    height: 80px; 
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .certificate-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <div class="qr-code">${qrCodeSVG}</div>
                
                <div class="watermark">
                  ${leftLogoSrc ? `<img src="${leftLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
                </div>

                ${this.generateHeader(config)}
                
                <div class="title" style="margin-top: 15px; font-size: 14px;">BARANGAY BUSINESS CLEARANCE APPLICATION FORM</div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 2px; font-size: 10px;">
                  <tr>
                    <td style="border: 1.5px solid #000; padding: 5px; font-weight: 800; text-transform: uppercase; width: 33%;">DATE OF APPLICATION AND NO.</td>
                    <td style="border: 1.5px solid #000; padding: 5px; width: 33%; font-weight: 800;">${new Date(request.created_at || Date.now()).toLocaleDateString()}</td>
                    <td style="border: 1.5px solid #000; padding: 5px; width: 33%; color: #dc2626; font-weight: 900; text-align: center; font-size: 11px;">${request.reference_number}</td>
                  </tr>
                </table>

                <div class="content" style="margin: 0;">
                    <div class="section" style="border: 1.5px solid #000; padding: 0; margin-bottom: 10px;">
                        <div class="section-title" style="background: #ffffff; border-bottom: 1.5px solid #000; margin: 0; padding: 4px; font-weight: 800;">OWNER'S DETAILS</div>
                        <table class="info-table" style="margin: 0; border: none; font-size: 10px;">
                            <tr style="height: 25px;">
                                <td class="label" style="border-right: 1.5px solid #000; border-top: none; border-left: none; width: 33%; padding: 4px;">FULL NAME</td>
                                <td style="border-top: none; border-right: none; font-weight: 800; text-transform: uppercase; padding: 4px;">${request.full_name || request.applicant_name || 'N/A'}</td>
                            </tr>
                            <tr style="height: 25px;">
                                <td class="label" style="border-top: 1.5px solid #000; border-right: 1.5px solid #000; border-left: none; padding: 4px;">COMPLETE ADDRESS</td>
                                <td style="border-top: 1.5px solid #000; border-right: none; padding: 4px;">${request.address || 'N/A'}</td>
                            </tr>
                            <tr style="height: 25px;">
                                <td class="label" style="border-top: 1.5px solid #000; border-right: 1.5px solid #000; border-left: none; padding: 4px;">BUSINESS NAME</td>
                                <td style="border-top: 1.5px solid #000; border-right: none; font-weight: 800; text-transform: uppercase; padding: 4px;">${this.getBusinessDetail(request, 'businessName') || 'N/A'}</td>
                            </tr>
                            <tr style="height: 25px;">
                                <td class="label" style="border-top: 1.5px solid #000; border-right: 1.5px solid #000; border-left: none; padding: 4px;">NATURE OF BUSINESS</td>
                                <td style="border-top: 1.5px solid #000; border-right: none; padding: 4px;">${this.getBusinessDetail(request, 'natureOfBusiness') || 'N/A'}</td>
                            </tr>
                            <tr style="height: 25px;">
                                <td class="label" style="border-top: 1.5px solid #000; border-right: 1.5px solid #000; border-left: none; padding: 4px;">BUSINESS COMPLETE ADDRESS</td>
                                <td style="border-top: 1.5px solid #000; border-right: none; padding: 4px;">${this.getBusinessDetail(request, 'businessAddress') || request.address || 'N/A'}</td>
                            </tr>
                            <tr style="height: 25px;">
                                <td class="label" style="border-top: 1.5px solid #000; border-right: 1.5px solid #000; border-left: none; border-bottom: none; padding: 4px;">CONTACT PERSON / NUMBER</td>
                                <td style="border-top: 1.5px solid #000; border-right: none; border-bottom: none; padding: 4px;">${this.getBusinessDetail(request, 'contactPerson') || request.contact_number || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="section" style="border: 1.5px solid #000; padding: 0; margin-top: 5px;">
                        <div class="section-title" style="background: #ffffff; border-bottom: 1.5px solid #000; margin: 0; padding: 4px; font-weight: 800;">A. ACTIONS TAKEN BY INSPECTION COMMITTEE:</div>
                        <table class="inspection-table" style="margin: 0; border: none; font-size: 8px; text-align: center;">
                            <thead>
                                <tr style="height: 20px;">
                                    <th style="width: 25%; border-left: none; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">AREAS</th>
                                    <th style="width: 35%; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">FINDINGS AND RECOMMENDATIONS</th>
                                    <th style="width: 20%; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">DATE OF INSPECTION</th>
                                    <th style="width: 20%; border-right: none; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${['HEALTH AND SAFETY', 'SANITATION', 'HEALTH HAZARD', 'BUILDING PERMIT', 'FIRE EXIT / HAZARD', 'ENVIRONMENT', 'WASTE MANAGEMENT', 'HAZARDOUS WASTE', 'OTHERS', 'COMPLAINTS, ETC.'].map(area => `
                                  <tr style="height: 18px;">
                                    <td style="border-left: none; text-align: left; padding-left: 5px; font-weight: 800;">${area}</td>
                                    <td>${inspectionData.areas?.[area]?.findings || ''}</td>
                                    <td>${inspectionData.areas?.[area]?.date || ''}</td>
                                    <td style="border-right: none;">${inspectionData.areas?.[area]?.remarks || ''}</td>
                                  </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 10px; padding: 5px; font-size: 9px;">
                            <strong>DATE AND TIME OF VISIT:</strong> ${inspectionData.visitDateTime ? new Date(inspectionData.visitDateTime).toLocaleString() : '____________________'}<br>
                            <strong style="margin-top: 4px; display: block;">NAME OF OWNER / REPRESENTATIVE AND SIGNATURE:</strong> ${inspectionData.ownerRepresentative || '____________________'}
                        </div>
                    </div>

                    <div class="section" style="border: 1.5px solid #000; padding: 0; margin-top: 5px;">
                        <div class="section-title" style="background: #ffffff; border-bottom: 1.5px solid #000; margin: 0; padding: 4px; font-weight: 800;">B. RECOMMENDING APPROVAL</div>
                        <table class="inspection-table" style="margin: 0; border: none; font-size: 8px; text-align: center;">
                            <thead>
                                <tr style="height: 20px;">
                                    <th style="width: 30%; border-left: none; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">NAME</th>
                                    <th style="width: 30%; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">COMMITTEE</th>
                                    <th style="width: 15%; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">DATE</th>
                                    <th style="width: 25%; border-right: none; border-top: none; background: #fff; text-align: center; border-bottom: 1.2px solid #000; padding: 2px;">SIGNATURE</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${['HEALTH', 'ENVIRONMENT', 'INFRASTRUCTURE', 'PEACE & ORDER'].map(comm => `
                                  <tr style="height: 22px;">
                                    <td style="border-left: none; text-align: left; padding-left: 5px;">${inspectionData.recommendations?.[comm]?.name || ''}</td>
                                    <td style="font-weight: 800;">${comm}</td>
                                    <td>${inspectionData.recommendations?.[comm]?.date || ''}</td>
                                    <td style="border-right: none;"></td>
                                  </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 15px; padding-left: 5px;">
                      <p style="font-weight: 800; font-size: 10px; margin-bottom: 20px;">C. APPROVAL</p>
                      <div style="margin-left: 40px;">
                        <p style="font-weight: 900; font-size: 13px; margin: 0; text-transform: uppercase;">${config.officials.chairman}</p>
                        <p style="font-weight: 800; font-size: 11px; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                      </div>
                    </div>
                </div>

                <div style="text-align: right; font-size: 9px; margin-top: 10px; font-weight: 800;">
                  Reference No: ${request.reference_number}
                </div>

                <div style="border-top: 1px solid #777; margin-top: 15px; padding-top: 5px; font-size: 8px; color: #444; line-height: 1.2;">
                  <p style="margin: 0;"><strong>Address:</strong> Purok 2 (Iba Este), Barangay Iba O' Este, Calumpit, Bulacan</p>
                  <p style="margin: 0;"><strong>Contact:</strong> Brgy. Chairperson Alexander C. Manio | <strong>Mobile No.:</strong> 0917 831 91 58 | <strong>Email:</strong> ibaesteofficial@gmail.com</p>
                </div>
            </div>
        </body>
        </html>
        `;
        } catch (error) {
            console.error('[CERT-GEN] Error in generateBusinessPermitContent:', error);
            throw error;
        }
    }

    getBusinessDetail(request, field) {
        try {
            const details = typeof request.details === 'string' ? JSON.parse(request.details || '{}') : (request.details || {});
            return details[field] || '';
        } catch (e) {
            return '';
        }
    }

    generateInspectionRows(areas) {
        if (!areas || typeof areas !== 'object') {
            return '<tr><td colspan="4" style="text-align: center; font-style: italic;">No inspection data available</td></tr>';
        }

        return Object.entries(areas).map(([areaName, areaData]) => `
            <tr>
                <td style="font-weight: bold;">${areaName}</td>
                <td>${areaData.findings || ''}</td>
                <td>${areaData.date || ''}</td>
                <td>${areaData.remarks || ''}</td>
            </tr>
        `).join('');
    }

    generateCommitteeRows(recommendations) {
        if (!recommendations || typeof recommendations !== 'object') {
            return '<tr><td colspan="3" style="text-align: center; font-style: italic;">No committee recommendations available</td></tr>';
        }

        return Object.entries(recommendations).map(([committeeName, committeeData]) => `
            <tr>
                <td style="font-weight: bold;">${committeeName}</td>
                <td>${committeeData.name || ''}</td>
                <td>${committeeData.date || ''}</td>
            </tr>
        `).join('');
    }

    async getPhysicalInspectionData(requestId) {
        try {
            // Get the main inspection report
            const { data: report, error: reportError } = await supabase
                .from('physical_inspection_reports')
                .select('*')
                .eq('request_id', requestId)
                .single();

            if (reportError && reportError.code !== 'PGRST116') {
                console.error('Error fetching inspection report:', reportError);
                return this.getDefaultInspectionData();
            }

            if (!report) {
                return this.getDefaultInspectionData();
            }

            // Get area findings
            const { data: areaFindings, error: areaError } = await supabase
                .from('inspection_area_findings')
                .select('*')
                .eq('inspection_report_id', report.id);

            if (areaError) {
                console.error('Error fetching area findings:', areaError);
                return this.getDefaultInspectionData();
            }

            // Get committee recommendations
            const { data: committeeRecs, error: committeeError } = await supabase
                .from('committee_recommendations')
                .select('*')
                .eq('inspection_report_id', report.id);

            if (committeeError) {
                console.error('Error fetching committee recommendations:', committeeError);
                return this.getDefaultInspectionData();
            }

            // Format the data
            const inspectionData = {
                areas: {},
                visitDateTime: report.visit_datetime,
                ownerRepresentative: report.owner_representative,
                recommendations: {}
            };

            // Format area findings
            areaFindings.forEach(area => {
                inspectionData.areas[area.area_name] = {
                    findings: area.findings || '',
                    date: area.inspection_date || '',
                    remarks: area.remarks || ''
                };
            });

            // Format committee recommendations
            committeeRecs.forEach(committee => {
                inspectionData.recommendations[committee.committee_name] = {
                    name: committee.signatory_name || '',
                    date: committee.recommendation_date || ''
                };
            });

            return inspectionData;

        } catch (error) {
            console.error('Error getting physical inspection data:', error);
            return this.getDefaultInspectionData();
        }
    }

    getDefaultInspectionData() {
        return {
            areas: {
                'HEALTH AND SAFETY': { findings: '', date: '', remarks: '' },
                'SANITATION': { findings: '', date: '', remarks: '' },
                'HEALTH HAZARD': { findings: '', date: '', remarks: '' },
                'BUILDING PERMIT': { findings: '', date: '', remarks: '' },
                'FIRE EXIT / HAZARD': { findings: '', date: '', remarks: '' },
                'ENVIRONMENT': { findings: '', date: '', remarks: '' },
                'WASTE MANAGEMENT': { findings: '', date: '', remarks: '' },
                'HAZARDOUS WASTE': { findings: '', date: '', remarks: '' },
                'OTHERS': { findings: '', date: '', remarks: '' },
                'COMPLAINTS, ETC.': { findings: '', date: '', remarks: '' }
            },
            visitDateTime: '',
            ownerRepresentative: '',
            recommendations: {
                'HEALTH': { name: '', date: '' },
                'ENVIRONMENT': { name: '', date: '' },
                'INFRASTRUCTURE': { name: '', date: '' },
                'PEACE & ORDER': { name: '', date: '' }
            }
        };
    }

    async generateBusinessClearanceContent(request, config, captainApproval = null) {
        // Get physical inspection data
        const inspectionData = await this.getPhysicalInspectionData(request.id);

        // Get OR details if available
        const { data: orData } = await supabase
            .from('official_receipts')
            .select('or_number, amount_paid, control_number')
            .eq('request_id', request.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const businessDetails = request.business_details || {};
        const isRenewal = businessDetails.clearanceType === 'renewal';

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Barangay Business Clearance - ${request.reference_number}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: 'Arial', sans-serif; 
                    background: #f3f4f6;
                    padding: 2.5cm;
                    line-height: 1.6;
                }
                
                .certificate-container { 
                    max-width: 210mm; 
                    margin: 0 auto; 
                    background: #ffffff;
                    border: 4px double #0369a1;
                    padding: 1.5cm;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    position: relative;
                }
                
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 120px;
                    color: rgba(3, 105, 161, 0.05);
                    font-weight: bold;
                    z-index: 0;
                    pointer-events: none;
                }
                
                .content-wrapper {
                    position: relative;
                    z-index: 1;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 30px;
                    border-radius: 10px;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px;
                    border-bottom: 3px solid #0369a1;
                }
                
                .title { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #0369a1;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin: 20px 0;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }
                
                .to-whom { 
                    font-size: 16px; 
                    margin: 20px 0;
                    font-weight: 600;
                    color: #333;
                }
                
                .intro-text {
                    font-size: 14px;
                    margin: 20px 0;
                    text-align: justify;
                    color: #444;
                }
                
                .checkbox-section {
                    display: flex;
                    gap: 40px;
                    justify-content: center;
                    margin: 25px 0;
                }
                
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .checkbox {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #0369a1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: #0369a1;
                }
                
                .info-grid {
                    margin: 25px 0;
                }
                
                .info-row {
                    display: flex;
                    margin: 12px 0;
                    font-size: 14px;
                }
                
                .info-label {
                    font-weight: bold;
                    min-width: 200px;
                    color: #333;
                }
                
                .info-value {
                    flex: 1;
                    color: #0369a1;
                    font-weight: 600;
                    border-bottom: 1px solid #0369a1;
                    padding-bottom: 2px;
                }
                
                .compliance-text {
                    font-size: 13px;
                    text-align: justify;
                    margin: 25px 0;
                    padding: 15px;
                    background: rgba(3, 105, 161, 0.05);
                    border-left: 4px solid #0369a1;
                    line-height: 1.8;
                    color: #444;
                }
                
                .issuance-text {
                    font-size: 13px;
                    margin: 20px 0;
                    color: #444;
                }
                
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .payment-details {
                    text-align: left;
                    flex: 1;
                }
                
                .payment-title {
                    font-weight: bold;
                    font-size: 14px;
                    text-decoration: underline;
                    margin-bottom: 10px;
                    color: #0369a1;
                }
                
                .payment-row {
                    font-size: 13px;
                    margin: 5px 0;
                    color: #444;
                }
                
                .signature-block {
                    text-align: center;
                    flex: 1;
                }
                
                .truly-yours {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 50px;
                    color: #333;
                }
                
                .signature-name {
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-top: 2px solid #000;
                    padding-top: 5px;
                    color: #0369a1;
                }
                
                .signature-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #666;
                }
                
                @media print {
                    body { 
                        background: white; 
                        padding: 0; 
                    }
                    .certificate-container { 
                        border: 2px solid #0369a1; 
                        box-shadow: none;
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <div class="watermark">BARANGAY</div>
                
                <div class="content-wrapper">
                    <div class="header">
                        ${this.generateHeader(config)}
                    </div>
                    
                    <div class="title">BARANGAY BUSINESS CLEARANCE</div>
                    
                    <div class="to-whom">To Whom It May Concern:</div>
                    
                    <div class="intro-text">
                        This is to certify that below business / trade name as described herein applying for:
                    </div>
                    
                    <div class="checkbox-section">
                        <div class="checkbox-item">
                            <span class="checkbox">${!isRenewal ? '✓' : ''}</span>
                            <span>New Business Clearance</span>
                        </div>
                        <div class="checkbox-item">
                            <span class="checkbox">${isRenewal ? '✓' : ''}</span>
                            <span>Renewal of Existing Business Clearance</span>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="info-label">Name of Owner</span>
                            <span class="info-value">${request.full_name || request.applicant_name || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Owner's Address</span>
                            <span class="info-value">${request.address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Business / Trade Name</span>
                            <span class="info-value">${businessDetails.businessName || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Business Address</span>
                            <span class="info-value">${businessDetails.businessAddress || request.address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Nature of Business</span>
                            <span class="info-value">${businessDetails.natureOfBusiness || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="compliance-text">
                        The subject business establishment upon occular visit / inspection conducted by this office jointly with Sangguniang Barangay Committees on Health, Environment and Finance and Barangay Treasurer found to be compliant and in confirmity with the existing barangay ordinances, rules and regulations as applicable for this nature of business being applied for clearance.
                    </div>
                    
                    <div class="compliance-text">
                        In view of the above, this office poses no objection for the issuance of further permits as necessary for the conduct of above business activity including Mayor's Permit, etc.
                    </div>
                    
                    <div class="issuance-text">
                        Issued this at Barangay Iba O' Este, Calumpit, Bulacan.
                    </div>
                    
                    <div class="signature-section">
                        <div class="payment-details">
                            <div class="payment-title">Details of Payment</div>
                            <div class="payment-row">OR NO. : <strong>${orData?.or_number || '_____________'}</strong></div>
                            <div class="payment-row">Amount Paid : <strong>${orData?.amount_paid ? '₱' + parseFloat(orData.amount_paid).toFixed(2) : '_____________'}</strong></div>
                            <div class="payment-row">BC Control No.: <strong>${orData?.control_number || request.reference_number || '_____________'}</strong></div>
                        </div>
                        
                        <div class="signature-block">
                            <div class="truly-yours">TRULY YOURS,</div>
                            <div class="signature-name">${config.officials.chairman}</div>
                            <div class="signature-title">BARANGAY CHAIRMAN</div>
                            ${captainApproval?.users?.employee_code ? `<div style="font-size: 10px; font-weight: bold; margin-top: 2px; color: #666;">${captainApproval.users.employee_code}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateQRCodeSVG(text) {
        // Simple QR code placeholder - in production, use a proper QR code library
        const encoded = Buffer.from(`VERIFY:${text}`).toString('base64');
        return encoded;
    }

    generateGuardianshipContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};
        const details = typeof request.details === 'string' ? JSON.parse(request.details) : (request.details || {});

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p style="margin: 20px 0;">This is to certify that below person is under the guardianship of <strong>${(details.guardianName || '').toUpperCase()}</strong>, both bona fide residents of this barangay:</p>
                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${(request.full_name || '').toUpperCase()}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${(request.address || '').toUpperCase()}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${(request.sex || '').toUpperCase()}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${(request.civil_status || '').toUpperCase()}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Guardian's Relationship</span><span>:</span><span class="detail-value">${(details.guardianRelationship || '').toUpperCase()}</span>
                </div>
                <p style="margin: 40px 0;">Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province} upon the request of above mentioned persons for any legal purposes it may serve.</p>
                <div class="signature-section">
                    <div class="sig-block"><div class="sig-line"></div><p style="font-size: 11px;">Resident's Signature / Thumb Mark</p></div>
                    <div class="sig-block" style="margin-top: 30px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        return this.generateDocument('BARANGAY CERTIFICATION FOR GUARDIANSHIP', bodyHtml, request, config);
    }

    generateCohabitationContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};
        const details = typeof request.details === 'string' ? JSON.parse(request.details) : (request.details || {});

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p style="margin: 20px 0;">This is to certify that the persons named below are living together as husband and wife without the benefit of marriage for <strong>${details.livingTogetherYears || '0'} year(s) and ${details.livingTogetherMonths || '0'} month(s)</strong>:</p>
                <div class="details-grid">
                    <span class="detail-label">Name (1)</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${(request.full_name || '').toUpperCase()}</span>
                    <span class="detail-label">Age/Sex/DOB</span><span>:</span><span class="detail-value">${request.age || '-'} / ${(request.sex || '').toUpperCase()} / ${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString() : '-'}</span>
                    <span class="detail-label">Name (2)</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${(details.partnerFullName || '').toUpperCase()}</span>
                    <span class="detail-label">Partner Age/Sex/DOB</span><span>:</span><span class="detail-value">${details.partnerAge || '-'} / ${(details.partnerSex || '').toUpperCase()} / ${details.partnerDateOfBirth ? new Date(details.partnerDateOfBirth).toLocaleDateString() : '-'}</span>
                    <span class="detail-label">No. of Children</span><span>:</span><span class="detail-value">${details.noOfChildren || '0'}</span>
                    <span class="detail-label">Address</span><span>:</span><span class="detail-value">${(request.address || '').toUpperCase()}</span>
                </div>
                <p style="margin: 40px 0;">Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName} for legal purposes.</p>
                <div class="signature-section">
                    <div class="sig-block" style="margin-top: 30px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        return this.generateDocument('CERTIFICATE OF COHABITATION', bodyHtml, request, config);
    }

    generateNaturalDeathContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};
        const details = typeof request.details === 'string' ? JSON.parse(request.details) : (request.details || {});

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p style="margin: 20px 0;">This is to certify that <strong>${(request.full_name || '').toUpperCase()}</strong>, a resident of ${request.address || ''}, passed away on <strong>${details.dateOfDeath ? new Date(details.dateOfDeath).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</strong> due to <strong>${(details.causeOfDeath || 'NATURAL CAUSES').toUpperCase()}</strong>.</p>
                <p style="margin: 20px 0;">This also certifies that the death was <strong>${details.covidRelated ? 'COVID-19' : 'NON-COVID'}</strong> related.</p>
                <p style="margin: 40px 0;">Issued this <strong>${currentDate}</strong> for burial/legal purposes.</p>
                <div class="signature-section">
                    <div class="sig-block" style="margin-top: 30px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        return this.generateDocument('CERTIFICATION OF NATURAL DEATH', bodyHtml, request, config);
    }

    generateMedicoLegalContent(request, config, captainApproval = null) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};
        const details = typeof request.details === 'string' ? JSON.parse(request.details) : (request.details || {});

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                <p style="margin: 20px 0;">This is a REQUEST FOR MEDICO LEGAL for the following person:</p>
                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value">${(request.full_name || '').toUpperCase()}</span>
                    <span class="detail-label">Age/Sex</span><span>:</span><span class="detail-value">${request.age || '-'} / ${(request.sex || '').toUpperCase()}</span>
                    <span class="detail-label">Address</span><span>:</span><span class="detail-value">${(request.address || '').toUpperCase()}</span>
                    <span class="detail-label">Date of Exam</span><span>:</span><span class="detail-value">${details.dateOfExamination || '-'}</span>
                    <span class="detail-label">Usaping Brgy</span><span>:</span><span class="detail-value">${details.usapingBarangay || '-'}</span>
                    <span class="detail-label">Date of Hearing</span><span>:</span><span class="detail-value">${details.dateOfHearing || '-'}</span>
                </div>
                <p style="margin: 40px 0;">Issued this <strong>${currentDate}</strong> for medical record purposes.</p>
                <div class="signature-section">
                    <div class="sig-block" style="margin-top: 30px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                        ${captainApproval?.users?.employee_code ? `<p style="font-size: 10px; font-weight: bold; margin: 0; color: #666;">${captainApproval.users.employee_code}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
        return this.generateDocument('REQUEST FOR MEDICO LEGAL', bodyHtml, request, config);
    }
}

module.exports = new CertificateGenerationService();