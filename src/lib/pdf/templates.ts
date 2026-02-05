/**
 * PDF Template System
 * 
 * Customizable PDF templates for:
 * - Quotation (Penawaran)
 * - SPK (Surat Pesanan Kendaraan)
 * - Invoice
 * 
 * All templates support dynamic dealer branding.
 */

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatRupiah } from "@/lib/utils";

// ==========================================
// PDF DATA INTERFACES
// ==========================================

export interface DealerInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string; // Base64 or URL
    npwp?: string;
}

export interface CustomerInfo {
    name: string;
    address: string;
    phone: string;
    email?: string;
    nik?: string;
}

export interface VehicleInfo {
    brand: string;
    model: string;
    variant: string;
    year: number;
    color: string;
    condition: "baru" | "bekas";
    vinNumber?: string;
    engineNumber?: string;
    plateNumber?: string;
}

export interface PricingInfo {
    vehiclePrice: number;
    discount?: number;
    downPayment?: number;
    tenor?: number;
    monthlyPayment?: number;
    adminFee?: number;
    insuranceFee?: number;
    totalAmount: number;
    paymentMethod: "cash" | "credit";
    leasingPartner?: string;
}

export interface QuotationData {
    number: string;
    date: Date;
    validUntil: Date;
    dealer: DealerInfo;
    customer: CustomerInfo;
    vehicle: VehicleInfo;
    pricing: PricingInfo;
    notes?: string;
    salesName: string;
    salesPhone?: string;
}

export interface SPKData {
    number: string;
    date: Date;
    dealer: DealerInfo;
    customer: CustomerInfo;
    vehicle: VehicleInfo;
    pricing: PricingInfo;
    deliveryDate?: Date;
    terms?: string[];
    salesName: string;
}

export interface InvoiceData {
    number: string;
    date: Date;
    dueDate: Date;
    dealer: DealerInfo;
    customer: CustomerInfo;
    vehicle: VehicleInfo;
    pricing: PricingInfo;
    paymentStatus: "unpaid" | "partial" | "paid";
    paidAmount?: number;
    salesName: string;
}

// ==========================================
// HTML TEMPLATE GENERATORS
// ==========================================

/**
 * Common CSS styles for all PDF templates
 */
const pdfStyles = `
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
      padding: 40px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .dealer-info h1 {
      font-size: 20pt;
      color: #3b82f6;
      margin-bottom: 5px;
    }
    
    .dealer-info p {
      font-size: 9pt;
      color: #64748b;
    }
    
    .document-info {
      text-align: right;
    }
    
    .document-info h2 {
      font-size: 16pt;
      color: #1e293b;
      margin-bottom: 10px;
    }
    
    .document-info .number {
      font-size: 12pt;
      font-weight: bold;
      color: #3b82f6;
    }
    
    .document-info .date {
      font-size: 9pt;
      color: #64748b;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #3b82f6;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 5px 10px;
    }
    
    .info-grid dt {
      font-weight: 500;
      color: #64748b;
    }
    
    .info-grid dd {
      font-weight: 500;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background-color: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 9pt;
    }
    
    .text-right {
      text-align: right;
    }
    
    .total-row {
      background-color: #3b82f6;
      color: white;
    }
    
    .total-row td {
      font-weight: bold;
      font-size: 12pt;
      border-bottom: none;
    }
    
    .notes {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
    }
    
    .notes h4 {
      color: #92400e;
      margin-bottom: 5px;
    }
    
    .notes p {
      font-size: 9pt;
      color: #92400e;
    }
    
    .footer {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-box .label {
      font-size: 9pt;
      color: #64748b;
      margin-bottom: 60px;
    }
    
    .signature-box .line {
      border-top: 1px solid #1e293b;
      padding-top: 5px;
      font-weight: 500;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    .badge-success {
      background-color: #dcfce7;
      color: #166534;
    }
    
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .badge-info {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .validity {
      background-color: #fef2f2;
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 10px 15px;
      text-align: center;
      font-size: 10pt;
      color: #991b1b;
      margin-top: 15px;
    }
  </style>
`;

/**
 * Format date to Indonesian locale
 */
function formatDate(date: Date): string {
    return format(date, "d MMMM yyyy", { locale: localeId });
}

/**
 * Generate Quotation HTML
 */
export function generateQuotationHTML(data: QuotationData): string {
    const conditionLabel = data.vehicle.condition === "baru" ? "Baru" : "Bekas";
    const paymentMethodLabel = data.pricing.paymentMethod === "cash" ? "Tunai" : "Kredit";

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      ${pdfStyles}
    </head>
    <body>
      <div class="header">
        <div class="dealer-info">
          <h1>${data.dealer.name}</h1>
          <p>${data.dealer.address}</p>
          <p>Telp: ${data.dealer.phone} | Email: ${data.dealer.email}</p>
          ${data.dealer.npwp ? `<p>NPWP: ${data.dealer.npwp}</p>` : ""}
        </div>
        <div class="document-info">
          <h2>QUOTATION</h2>
          <p class="number">${data.number}</p>
          <p class="date">${formatDate(data.date)}</p>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Kepada Yth.</h3>
        <dl class="info-grid">
          <dt>Nama</dt>
          <dd>${data.customer.name}</dd>
          <dt>Alamat</dt>
          <dd>${data.customer.address}</dd>
          <dt>Telepon</dt>
          <dd>${data.customer.phone}</dd>
          ${data.customer.email ? `<dt>Email</dt><dd>${data.customer.email}</dd>` : ""}
        </dl>
      </div>
      
      <div class="section">
        <h3 class="section-title">Detail Kendaraan</h3>
        <table>
          <tr>
            <th>Kendaraan</th>
            <th>Tahun</th>
            <th>Warna</th>
            <th>Kondisi</th>
            <th class="text-right">Harga</th>
          </tr>
          <tr>
            <td><strong>${data.vehicle.brand} ${data.vehicle.model}</strong><br><span style="color: #64748b; font-size: 9pt;">${data.vehicle.variant}</span></td>
            <td>${data.vehicle.year}</td>
            <td>${data.vehicle.color}</td>
            <td><span class="badge ${data.vehicle.condition === "baru" ? "badge-info" : "badge-warning"}">${conditionLabel}</span></td>
            <td class="text-right">${formatRupiah(data.pricing.vehiclePrice)}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3 class="section-title">Rincian Pembayaran (${paymentMethodLabel})</h3>
        <table>
          <tr>
            <td>Harga Kendaraan (OTR)</td>
            <td class="text-right">${formatRupiah(data.pricing.vehiclePrice)}</td>
          </tr>
          ${data.pricing.discount ? `
          <tr>
            <td>Diskon</td>
            <td class="text-right" style="color: #16a34a;">- ${formatRupiah(data.pricing.discount)}</td>
          </tr>
          ` : ""}
          ${data.pricing.paymentMethod === "credit" ? `
          <tr>
            <td>Uang Muka (DP)</td>
            <td class="text-right">${formatRupiah(data.pricing.downPayment || 0)}</td>
          </tr>
          <tr>
            <td>Biaya Admin</td>
            <td class="text-right">${formatRupiah(data.pricing.adminFee || 0)}</td>
          </tr>
          <tr>
            <td>Asuransi</td>
            <td class="text-right">${formatRupiah(data.pricing.insuranceFee || 0)}</td>
          </tr>
          <tr>
            <td>Tenor</td>
            <td class="text-right">${data.pricing.tenor} Bulan</td>
          </tr>
          <tr>
            <td><strong>Cicilan per Bulan</strong></td>
            <td class="text-right"><strong>${formatRupiah(data.pricing.monthlyPayment || 0)}</strong></td>
          </tr>
          ${data.pricing.leasingPartner ? `
          <tr>
            <td>Leasing</td>
            <td class="text-right">${data.pricing.leasingPartner}</td>
          </tr>
          ` : ""}
          ` : ""}
          <tr class="total-row">
            <td>TOTAL PEMBAYARAN</td>
            <td class="text-right">${formatRupiah(data.pricing.totalAmount)}</td>
          </tr>
        </table>
      </div>
      
      ${data.notes ? `
      <div class="notes">
        <h4>Catatan:</h4>
        <p>${data.notes}</p>
      </div>
      ` : ""}
      
      <div class="validity">
        ⚠️ Penawaran ini berlaku sampai dengan <strong>${formatDate(data.validUntil)}</strong>
      </div>
      
      <div class="footer">
        <div class="signature-box">
          <p class="label">Hormat Kami,</p>
          <p class="line">${data.salesName}</p>
          <p style="font-size: 9pt; color: #64748b;">${data.salesPhone || ""}</p>
        </div>
        <div class="signature-box">
          <p class="label">Customer,</p>
          <p class="line">${data.customer.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate SPK HTML
 */
export function generateSPKHTML(data: SPKData): string {
    const conditionLabel = data.vehicle.condition === "baru" ? "Baru" : "Bekas";

    const defaultTerms = [
        "Pembeli wajib melunasi pembayaran sesuai kesepakatan",
        "Kendaraan diserahkan dalam kondisi seperti yang telah diinspeksi",
        "Garansi sesuai dengan ketentuan pabrikan (untuk kendaraan baru)",
        "Dokumen akan diserahkan setelah pembayaran lunas"
    ];

    const terms = data.terms || defaultTerms;

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      ${pdfStyles}
    </head>
    <body>
      <div class="header">
        <div class="dealer-info">
          <h1>${data.dealer.name}</h1>
          <p>${data.dealer.address}</p>
          <p>Telp: ${data.dealer.phone} | Email: ${data.dealer.email}</p>
        </div>
        <div class="document-info">
          <h2>SURAT PESANAN KENDARAAN</h2>
          <p class="number">${data.number}</p>
          <p class="date">${formatDate(data.date)}</p>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Data Pembeli</h3>
        <dl class="info-grid">
          <dt>Nama</dt>
          <dd>${data.customer.name}</dd>
          <dt>Alamat</dt>
          <dd>${data.customer.address}</dd>
          <dt>Telepon</dt>
          <dd>${data.customer.phone}</dd>
          ${data.customer.nik ? `<dt>NIK</dt><dd>${data.customer.nik}</dd>` : ""}
        </dl>
      </div>
      
      <div class="section">
        <h3 class="section-title">Data Kendaraan</h3>
        <dl class="info-grid">
          <dt>Merek / Model</dt>
          <dd><strong>${data.vehicle.brand} ${data.vehicle.model}</strong></dd>
          <dt>Varian</dt>
          <dd>${data.vehicle.variant}</dd>
          <dt>Tahun</dt>
          <dd>${data.vehicle.year}</dd>
          <dt>Warna</dt>
          <dd>${data.vehicle.color}</dd>
          <dt>Kondisi</dt>
          <dd><span class="badge ${data.vehicle.condition === "baru" ? "badge-info" : "badge-warning"}">${conditionLabel}</span></dd>
          ${data.vehicle.vinNumber ? `<dt>No. Rangka</dt><dd>${data.vehicle.vinNumber}</dd>` : ""}
          ${data.vehicle.engineNumber ? `<dt>No. Mesin</dt><dd>${data.vehicle.engineNumber}</dd>` : ""}
          ${data.vehicle.plateNumber ? `<dt>No. Polisi</dt><dd>${data.vehicle.plateNumber}</dd>` : ""}
        </dl>
      </div>
      
      <div class="section">
        <h3 class="section-title">Pembayaran</h3>
        <table>
          <tr>
            <td>Harga Kendaraan (OTR)</td>
            <td class="text-right">${formatRupiah(data.pricing.vehiclePrice)}</td>
          </tr>
          ${data.pricing.discount ? `
          <tr>
            <td>Diskon</td>
            <td class="text-right" style="color: #16a34a;">- ${formatRupiah(data.pricing.discount)}</td>
          </tr>
          ` : ""}
          ${data.pricing.paymentMethod === "credit" ? `
          <tr>
            <td>Uang Muka (DP)</td>
            <td class="text-right">${formatRupiah(data.pricing.downPayment || 0)}</td>
          </tr>
          <tr>
            <td>Angsuran ${data.pricing.tenor}x</td>
            <td class="text-right">${formatRupiah(data.pricing.monthlyPayment || 0)} / bulan</td>
          </tr>
          <tr>
            <td>Leasing</td>
            <td class="text-right">${data.pricing.leasingPartner || "-"}</td>
          </tr>
          ` : ""}
          <tr class="total-row">
            <td>TOTAL</td>
            <td class="text-right">${formatRupiah(data.pricing.totalAmount)}</td>
          </tr>
        </table>
      </div>
      
      ${data.deliveryDate ? `
      <div class="section">
        <h3 class="section-title">Estimasi Pengiriman</h3>
        <p><strong>${formatDate(data.deliveryDate)}</strong></p>
      </div>
      ` : ""}
      
      <div class="section">
        <h3 class="section-title">Syarat dan Ketentuan</h3>
        <ol style="padding-left: 20px; font-size: 9pt; color: #475569;">
          ${terms.map(t => `<li style="margin-bottom: 5px;">${t}</li>`).join("")}
        </ol>
      </div>
      
      <div class="footer">
        <div class="signature-box">
          <p class="label">Penjual,</p>
          <p class="line">${data.salesName}</p>
          <p style="font-size: 9pt; color: #64748b;">${data.dealer.name}</p>
        </div>
        <div class="signature-box">
          <p class="label">Pembeli,</p>
          <p class="line">${data.customer.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate Invoice HTML
 */
export function generateInvoiceHTML(data: InvoiceData): string {
    const statusBadge = {
        unpaid: { class: "badge-warning", label: "Belum Lunas" },
        partial: { class: "badge-info", label: "Sebagian" },
        paid: { class: "badge-success", label: "Lunas" }
    };

    const status = statusBadge[data.paymentStatus];
    const remainingAmount = data.pricing.totalAmount - (data.paidAmount || 0);

    return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      ${pdfStyles}
    </head>
    <body>
      <div class="header">
        <div class="dealer-info">
          <h1>${data.dealer.name}</h1>
          <p>${data.dealer.address}</p>
          <p>Telp: ${data.dealer.phone} | Email: ${data.dealer.email}</p>
          ${data.dealer.npwp ? `<p>NPWP: ${data.dealer.npwp}</p>` : ""}
        </div>
        <div class="document-info">
          <h2>INVOICE</h2>
          <p class="number">${data.number}</p>
          <p class="date">${formatDate(data.date)}</p>
          <p style="margin-top: 10px;"><span class="badge ${status.class}">${status.label}</span></p>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">Tagihan Kepada</h3>
        <dl class="info-grid">
          <dt>Nama</dt>
          <dd>${data.customer.name}</dd>
          <dt>Alamat</dt>
          <dd>${data.customer.address}</dd>
          <dt>Telepon</dt>
          <dd>${data.customer.phone}</dd>
        </dl>
      </div>
      
      <div class="section">
        <h3 class="section-title">Detail Pembelian</h3>
        <table>
          <tr>
            <th>Deskripsi</th>
            <th class="text-right">Jumlah</th>
          </tr>
          <tr>
            <td>
              <strong>${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.variant}</strong><br>
              <span style="font-size: 9pt; color: #64748b;">
                Tahun ${data.vehicle.year} | ${data.vehicle.color} | ${data.vehicle.condition === "baru" ? "Baru" : "Bekas"}
              </span>
              ${data.vehicle.vinNumber ? `<br><span style="font-size: 9pt; color: #64748b;">No. Rangka: ${data.vehicle.vinNumber}</span>` : ""}
            </td>
            <td class="text-right">${formatRupiah(data.pricing.vehiclePrice)}</td>
          </tr>
          ${data.pricing.discount ? `
          <tr>
            <td>Diskon</td>
            <td class="text-right" style="color: #16a34a;">- ${formatRupiah(data.pricing.discount)}</td>
          </tr>
          ` : ""}
          ${data.pricing.adminFee ? `
          <tr>
            <td>Biaya Administrasi</td>
            <td class="text-right">${formatRupiah(data.pricing.adminFee)}</td>
          </tr>
          ` : ""}
          <tr class="total-row">
            <td>TOTAL</td>
            <td class="text-right">${formatRupiah(data.pricing.totalAmount)}</td>
          </tr>
        </table>
      </div>
      
      <div class="section">
        <h3 class="section-title">Status Pembayaran</h3>
        <table>
          <tr>
            <td>Total Tagihan</td>
            <td class="text-right">${formatRupiah(data.pricing.totalAmount)}</td>
          </tr>
          <tr>
            <td>Sudah Dibayar</td>
            <td class="text-right" style="color: #16a34a;">${formatRupiah(data.paidAmount || 0)}</td>
          </tr>
          <tr style="background-color: ${remainingAmount > 0 ? '#fef2f2' : '#dcfce7'};">
            <td><strong>Sisa Pembayaran</strong></td>
            <td class="text-right"><strong>${formatRupiah(remainingAmount)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="validity">
        📅 Jatuh Tempo: <strong>${formatDate(data.dueDate)}</strong>
      </div>
      
      <div class="notes" style="background-color: #dbeafe; border-color: #3b82f6;">
        <h4 style="color: #1e40af;">Informasi Pembayaran:</h4>
        <p style="color: #1e40af;">
          Mohon lakukan pembayaran sebelum tanggal jatuh tempo.<br>
          Untuk konfirmasi pembayaran, hubungi: ${data.dealer.phone}
        </p>
      </div>
      
      <div class="footer" style="grid-template-columns: 1fr;">
        <div class="signature-box">
          <p class="label">Dikeluarkan oleh,</p>
          <p class="line">${data.salesName}</p>
          <p style="font-size: 9pt; color: #64748b;">${data.dealer.name}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
