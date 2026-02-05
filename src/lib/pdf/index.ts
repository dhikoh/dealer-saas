/**
 * PDF Generator Service
 * 
 * Generates PDF documents from HTML templates.
 * Uses server-side rendering.
 */

import {
    generateQuotationHTML,
    generateSPKHTML,
    generateInvoiceHTML,
    QuotationData,
    SPKData,
    InvoiceData
} from "./templates";

export interface PDFGeneratorResult {
    html: string;
    fileName: string;
}

/**
 * Generate Quotation PDF
 */
export function generateQuotation(data: QuotationData): PDFGeneratorResult {
    const html = generateQuotationHTML(data);
    const fileName = `Quotation_${data.number.replace(/\//g, "-")}.pdf`;

    return { html, fileName };
}

/**
 * Generate SPK PDF
 */
export function generateSPK(data: SPKData): PDFGeneratorResult {
    const html = generateSPKHTML(data);
    const fileName = `SPK_${data.number.replace(/\//g, "-")}.pdf`;

    return { html, fileName };
}

/**
 * Generate Invoice PDF
 */
export function generateInvoice(data: InvoiceData): PDFGeneratorResult {
    const html = generateInvoiceHTML(data);
    const fileName = `Invoice_${data.number.replace(/\//g, "-")}.pdf`;

    return { html, fileName };
}

/**
 * Generate document number
 */
export function generateDocumentNumber(
    type: "QUO" | "SPK" | "INV",
    tenantCode: string,
    sequence: number
): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const seq = sequence.toString().padStart(4, "0");

    return `${type}/${tenantCode}/${year}${month}/${seq}`;
}

export * from "./templates";
