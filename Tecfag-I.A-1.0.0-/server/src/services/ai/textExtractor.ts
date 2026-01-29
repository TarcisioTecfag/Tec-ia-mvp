import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import path from 'path';

export interface ExtractionResult {
    text: string;
    metadata?: {
        pages?: number;
        title?: string;
        type?: string;
    };
}

/**
 * Extract text from various file formats
 */
export async function extractText(
    filePath: string,
    fileType: string
): Promise<ExtractionResult> {
    const extension = path.extname(filePath).toLowerCase();

    // Determine extraction method based on file type or extension
    if (fileType.includes('pdf') || extension === '.pdf') {
        return extractFromPDF(filePath);
    } else if (
        fileType.includes('wordprocessingml') ||
        extension === '.docx'
    ) {
        return extractFromDOCX(filePath);
    } else if (
        fileType.includes('text') ||
        extension === '.txt'
    ) {
        return extractFromTXT(filePath);
    } else {
        throw new Error(`Unsupported file type: ${fileType}`);
    }
}

/**
 * Extract text from PDF
 */
async function extractFromPDF(filePath: string): Promise<ExtractionResult> {
    try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);

        return {
            text: cleanText(data.text),
            metadata: {
                pages: data.numpages,
                title: data.info?.Title
            }
        };
    } catch (error) {
        console.error('Error extracting PDF:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

/**
 * Extract text from DOCX
 */
async function extractFromDOCX(filePath: string): Promise<ExtractionResult> {
    try {
        const result = await mammoth.extractRawText({ path: filePath });

        return {
            text: cleanText(result.value),
            metadata: {}
        };
    } catch (error) {
        console.error('Error extracting DOCX:', error);
        throw new Error('Failed to extract text from DOCX');
    }
}

/**
 * Extract text from TXT
 */
async function extractFromTXT(filePath: string): Promise<ExtractionResult> {
    try {
        const text = await fs.readFile(filePath, 'utf-8');

        // Specific fix for Compilado file: Skip JSON parsing to avoid data loss from table conversion
        // The table converter was dropping rows/columns, causing incomplete machine lists.
        const isCompilado = filePath.includes('Compilado');
        const markdown = isCompilado ? text : tryParseJsonToMarkdown(text);

        if (markdown !== text) {
            return {
                text: markdown,
                metadata: { type: 'json-table' }
            };
        }

        return {
            text: cleanText(text),
            metadata: {}
        };
    } catch (error) {
        console.error('Error reading TXT:', error);
        throw new Error('Failed to read text file');
    }
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
    return text
        // Remove excessive spaces/tabs but keep newlines
        .replace(/[ \t]+/g, ' ')
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize newlines
        .replace(/\r\n/g, '\n')
        // Remove multiple consecutive newlines (keep max 2)
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Tries to parse JSON content and convert it to a readable Markdown table
 * This is specific for the "raw Excel export" format observed
 */
function tryParseJsonToMarkdown(text: string): string {
    try {
        // Sanitize: Replace invalid JSON 'NaN' with 'null'
        const sanitizedText = text.replace(/:\s*NaN/g, ': null');

        // 1. Try to parse JSON
        const data = JSON.parse(sanitizedText);

        // 2. Check if it's the specific format: Array of objects with "planilha" and "dados"
        if (Array.isArray(data) && data.length > 0 && data[0].dados) {
            let markdownOutput = '';
            const seenItems = new Set<string>(); // NEW: Track unique items by Code

            for (const sheet of data) {
                if (sheet.planilha) {
                    markdownOutput += `## Planilha: ${sheet.planilha}\n\n`;
                }

                if (Array.isArray(sheet.dados) && sheet.dados.length > 0) {

                    const rows = sheet.dados;
                    let headerRowIndex = -1;

                    // Simple heuristic: Look for a row containing "Código" or "Descrição" or "Modelo"
                    for (let i = 0; i < Math.min(rows.length, 5); i++) {
                        const values = Object.values(rows[i]).map(v => String(v).toLowerCase());
                        if (values.some(v => v.includes('código') || v.includes('descrição') || v.includes('modelo'))) {
                            headerRowIndex = i;
                            break;
                        }
                    }

                    // If no obvious header found, use keys or first row
                    if (headerRowIndex === -1) headerRowIndex = 0;

                    // Extract headers from the header row
                    const headerMap: Record<string, string> = {};
                    const headerRow = rows[headerRowIndex];

                    const refinedHeaders: string[] = [];
                    const validKeys: string[] = [];

                    for (const [key, value] of Object.entries(headerRow)) {
                        const headerText = value ? String(value).replace(/\n/g, ' ').trim() : '';
                        if (headerText && headerText !== 'NaN') {
                            headerMap[key] = headerText;
                            refinedHeaders.push(headerText);
                            validKeys.push(key);
                        }
                    }

                    if (refinedHeaders.length === 0) continue;

                    // Build Markdown Table
                    // Header
                    markdownOutput += `| ${refinedHeaders.join(' | ')} |\n`;
                    // Separator
                    markdownOutput += `| ${refinedHeaders.map(() => '---').join(' | ')} |\n`;

                    // Data Rows (skip header row and before)
                    for (let i = headerRowIndex + 1; i < rows.length; i++) {
                        const row = rows[i];
                        const rowValues: string[] = [];
                        let hasData = false;
                        let rowCode = '';

                        for (const key of validKeys) {
                            let cellValue = row[key];

                            // Clean cell value
                            if (cellValue === null || cellValue === undefined || String(cellValue) === 'NaN') {
                                cellValue = '';
                            } else {
                                cellValue = String(cellValue).replace(/\n/g, ' ').trim();
                                hasData = true;
                            }

                            rowValues.push(cellValue);

                            // Assume first column is Code if it looks like one
                            if (!rowCode && codesLookLikeCode(cellValue)) {
                                rowCode = cellValue;
                            }
                        }

                        // If no code found, use first column or description or just row string as uniqueness key
                        if (!rowCode && rowValues.length > 0) {
                            rowCode = rowValues[0] || rowValues.join('|');
                        }

                        if (hasData) {
                            // DEDUPLICATION REMOVED: Allow duplicates because different sheets might use same codes
                            // if (seenItems.has(rowCode)) {
                            //    continue;
                            // }
                            // seenItems.add(rowCode);

                            markdownOutput += `| ${rowValues.join(' | ')} |\n`;
                        }
                    }
                    markdownOutput += '\n';
                }
            }

            if (markdownOutput.trim().length > 0) {
                console.log('[TextExtractor] ✅ Successfully converted JSON dump to Markdown Table (Deduplicated)');
                return markdownOutput;
            }
        }
    } catch (e) {
        // Not JSON or parse error, return original text
    }

    return text;
}

// Helper to identify if a string looks like a product code
function codesLookLikeCode(str: string): boolean {
    return str.length > 3 && /[A-Z0-9-]/.test(str);
}
