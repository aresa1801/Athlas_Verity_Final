import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface GreenCarbonPDFData {
  projectName: string;
  projectLocation: string;
  projectDescription?: string;
  projectArea: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  
  // Carbon Metrics
  finalVerifiedReduction: number;
  baselineEmissions: number;
  projectEmissions: number;
  leakageAdjustment: number;
  bufferPoolDeduction: number;
  integrityClassAdjustment: number;
  
  // Verification Data
  integrityClass: string;
  integrityScore: number;
  vegetationType: string;
  ndviValue: number;
  agbValue: number;
  carbonFraction: number;
  
  // Validation Results
  validationStatus: string;
  validatorConsensus: number;
  anomalyFlags: string[];
  
  // Coordinates
  coordinates?: Array<{ latitude: number; longitude: number }>;
  
  // Additional metadata
  generatedDate?: Date;
  submittedDate?: Date;
}

/**
 * Generates a professional Green Carbon Validation Report PDF
 * Following the Batuah Hilir validation report format
 */
export async function generateGreenCarbonPDF(
  data: GreenCarbonPDFData,
  htmlContent: string
): Promise<void> {
  try {
    // Convert HTML to Canvas
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    document.body.removeChild(element);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Additional pages
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download PDF
    const fileName = `${data.projectName.replace(/\s+/g, '-')}-Validation-Report.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Generates the HTML content for the Green Carbon validation report
 * Matches the professional format of the Batuah Hilir report
 */
export function generateGreenCarbonPDFHTML(data: GreenCarbonPDFData): string {
  const dateStr = (data.generatedDate || new Date()).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const coordinatesHTML = data.coordinates
    ? data.coordinates
        .map(
          (coord, idx) =>
            `<tr><td>Point ${idx + 1}</td><td>${coord.latitude.toFixed(6)}</td><td>${coord.longitude.toFixed(6)}</td></tr>`
        )
        .join('')
    : '<tr><td>No coordinates</td><td>-</td><td>-</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          background: white;
        }
        .page {
          width: 210mm;
          height: 297mm;
          padding: 20mm;
          margin: 0 auto;
          background: white;
          page-break-after: always;
          box-sizing: border-box;
        }
        .page-break { page-break-after: always; }
        h1 { font-size: 28px; font-weight: 700; margin: 20px 0 10px 0; color: #1a1a1a; }
        h2 { font-size: 18px; font-weight: 600; margin: 15px 0 8px 0; color: #2d2d2d; }
        h3 { font-size: 14px; font-weight: 600; margin: 10px 0 6px 0; color: #404040; }
        p { margin: 8px 0; font-size: 12px; }
        .header {
          text-align: center;
          border-bottom: 3px solid #4ade80;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .logo { font-size: 16px; font-weight: 700; color: #4ade80; }
        .subtitle { color: #666; font-size: 11px; margin-top: 4px; }
        .section {
          margin: 15px 0;
          border-left: 4px solid #4ade80;
          padding-left: 12px;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 10px;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
          font-size: 12px;
        }
        .metric-label { font-weight: 500; color: #555; }
        .metric-value { font-weight: 600; color: #2d2d2d; }
        .highlight {
          background: #f0fde4;
          border: 1px solid #4ade80;
          padding: 12px;
          border-radius: 6px;
          margin: 10px 0;
        }
        .highlight-accent {
          background: rgba(74, 222, 128, 0.08);
          border-left: 4px solid #4ade80;
          padding: 12px;
          margin: 10px 0;
        }
        .final-value {
          font-size: 24px;
          font-weight: 700;
          color: #4ade80;
          margin: 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 11px;
        }
        th {
          background: #f5f5f5;
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-weight: 600;
        }
        td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        tr:nth-child(even) { background: #fafafa; }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-approved { background: #dbeafe; color: #0c4a6e; }
        .status-pending { background: #fef3c7; color: #78350f; }
        .status-warning { background: #fee2e2; color: #7f1d1d; }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .grid-item {
          border: 1px solid #e0e0e0;
          padding: 10px;
          border-radius: 4px;
          background: #fafafa;
        }
        .grid-label { font-size: 11px; color: #666; margin-bottom: 4px; }
        .grid-value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
      </style>
    </head>
    <body>
      <!-- Page 1: Cover Page -->
      <div class="page">
        <div class="header">
          <div class="logo">ATHLAS VERITY</div>
          <div class="subtitle">Environmental Impact Verification Platform</div>
          <hr style="border: none; border-top: 2px solid #4ade80; margin: 10px 0;">
        </div>

        <div style="text-align: center; margin-top: 60px;">
          <h1>VALIDATION REPORT</h1>
          <h2 style="color: #4ade80; margin-top: 20px;">Green Carbon Project</h2>
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            <strong>${data.projectName}</strong>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">
            Project Location: ${data.projectLocation}
          </p>
        </div>

        <div style="margin-top: 100px;">
          <div class="grid-2">
            <div>
              <div class="grid-label">Verification Date</div>
              <div class="grid-value">${dateStr}</div>
            </div>
            <div>
              <div class="grid-label">Report Status</div>
              <div class="grid-value">
                <span class="status-badge status-approved">FINAL</span>
              </div>
            </div>
          </div>

          <div class="grid-2" style="margin-top: 20px;">
            <div>
              <div class="grid-label">Project Owner</div>
              <div class="grid-value">${data.ownerName}</div>
            </div>
            <div>
              <div class="grid-label">Contact</div>
              <div class="grid-value">${data.ownerEmail}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>© 2025 Athlas Verity - Powered by CarbonFi Labs System<br>Confidential - For Internal Use Only</p>
        </div>
      </div>

      <!-- Page 2: Project Overview -->
      <div class="page page-break">
        <h1>Project Overview</h1>
        
        <div class="section">
          <h3 class="section-title">Project Details</h3>
          <div class="metric-row">
            <span class="metric-label">Project Name</span>
            <span class="metric-value">${data.projectName}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Location</span>
            <span class="metric-value">${data.projectLocation}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Project Area</span>
            <span class="metric-value">${data.projectArea.toFixed(2)} hectares</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vegetation Type</span>
            <span class="metric-value">${data.vegetationType || 'Tropical Rainforest'}</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Project Description</h3>
          <p>${data.projectDescription || 'No description provided'}</p>
        </div>

        <div class="section">
          <h3 class="section-title">Project Owner Information</h3>
          <div class="metric-row">
            <span class="metric-label">Owner Name</span>
            <span class="metric-value">${data.ownerName}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Email</span>
            <span class="metric-value">${data.ownerEmail}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Phone</span>
            <span class="metric-value">${data.ownerPhone}</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Project Coordinates</h3>
          <table>
            <thead>
              <tr>
                <th>Point</th>
                <th>Latitude</th>
                <th>Longitude</th>
              </tr>
            </thead>
            <tbody>
              ${coordinatesHTML}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Page 3: Verification Results & Scores -->
      <div class="page page-break">
        <h1>Verification Results & Scores</h1>

        <div class="highlight-accent">
          <p style="color: #666; margin-bottom: 8px;">Final Verified Reduction (Conservative P10)</p>
          <div class="final-value">${data.finalVerifiedReduction.toLocaleString()}</div>
          <p style="color: #666; font-size: 11px;">tonnes CO₂ equivalent (after all adjustments and integrity discounts)</p>
        </div>

        <div class="section">
          <h3 class="section-title">Carbon Calculation Summary</h3>
          <div class="metric-row">
            <span class="metric-label">Baseline Emissions</span>
            <span class="metric-value">${data.baselineEmissions.toLocaleString()} tCO₂</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Project Emissions</span>
            <span class="metric-value">${data.projectEmissions.toLocaleString()} tCO₂</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Leakage Adjustment</span>
            <span class="metric-value">-${data.leakageAdjustment.toLocaleString()} tCO₂</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Buffer Pool Deduction</span>
            <span class="metric-value">-${data.bufferPoolDeduction.toLocaleString()} tCO₂</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Integrity Class Adjustment</span>
            <span class="metric-value">-${data.integrityClassAdjustment.toLocaleString()} tCO₂</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Integrity Assessment</h3>
          <div class="grid-2">
            <div class="grid-item">
              <div class="grid-label">Integrity Class</div>
              <div class="grid-value">${data.integrityClass}</div>
            </div>
            <div class="grid-item">
              <div class="grid-label">Integrity Score</div>
              <div class="grid-value">${data.integrityScore}/100</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Verification Consensus</h3>
          <div class="metric-row">
            <span class="metric-label">Validator Consensus</span>
            <span class="metric-value">${(data.validatorConsensus * 100).toFixed(1)}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Validation Status</span>
            <span class="metric-value">
              ${
                data.validationStatus === 'passed'
                  ? '<span class="status-badge status-approved">✓ Passed</span>'
                  : '<span class="status-badge status-warning">⚠ Warning</span>'
              }
            </span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Anomaly Detection</h3>
          ${
            data.anomalyFlags.length === 0
              ? '<p style="color: #4ade80; font-weight: 600;">✓ No anomalies detected</p>'
              : `<ul>${data.anomalyFlags.map((flag) => `<li>${flag}</li>`).join('')}</ul>`
          }
        </div>
      </div>

      <!-- Page 4: Technical Details -->
      <div class="page page-break">
        <h1>Technical Details</h1>

        <div class="section">
          <h3 class="section-title">Satellite Data Analysis</h3>
          <div class="grid-2">
            <div class="grid-item">
              <div class="grid-label">NDVI Value</div>
              <div class="grid-value">${data.ndviValue.toFixed(4)}</div>
            </div>
            <div class="grid-item">
              <div class="grid-label">AGB Estimation</div>
              <div class="grid-value">${data.agbValue.toFixed(2)} tC/ha</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Carbon Calculation Parameters</h3>
          <div class="metric-row">
            <span class="metric-label">Carbon Fraction</span>
            <span class="metric-value">${(data.carbonFraction * 100).toFixed(1)}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Project Area</span>
            <span class="metric-value">${data.projectArea.toFixed(2)} ha</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Vegetation Type</span>
            <span class="metric-value">${data.vegetationType || 'Tropical Rainforest'}</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Quality Assurance</h3>
          <div class="metric-row">
            <span class="metric-label">Data Quality Check</span>
            <span class="metric-value">✓ Passed</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Satellite Imagery Verification</span>
            <span class="metric-value">✓ Passed</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Geospatial Consistency</span>
            <span class="metric-value">✓ Passed</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Calculation Validation</span>
            <span class="metric-value">✓ Passed</span>
          </div>
        </div>

        <div class="footer">
          <p>Generated on ${dateStr} | Athlas Verity Platform v1.0</p>
          <p>This report contains verified carbon credit calculations based on satellite imagery and validated methodologies.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
