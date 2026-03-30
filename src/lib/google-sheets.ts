// src/lib/google-sheets.ts
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function getDashboardData() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.NEXT_PUBLIC_SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();

  // Contoh mengambil data dari Sheet 'GRAND TOTAL'
  const sheet = doc.sheetsByTitle['GRAND TOTAL'];
  const rows = await sheet.getRows();

  // Mapping data seperti yang dilakukan Pandas di Python
  const data = rows.map((row) => {
    return {
      wilayah: row.get('Nama KPPN') || 'GRAND TOTAL',
      jenisBelanja: row.get('NMAKUN'),
      program: row.get('PROGRAM PENGELOLAAN'),
      tahun: parseInt(row.get('TAHUN')),
      anggaran: parseFloat(row.get('PAGU')?.replace(/[^0-9,-]+/g,"") || "0"),
      realisasi: parseFloat(row.get('Total')?.replace(/[^0-9,-]+/g,"") || "0"),
    };
  });

  return data;
}