// src/app/api/sheets/route.ts
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
// Tambahkan dua modul bawaan Node.js ini
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface SheetRowData {
  wilayah: string;
  jenisBelanja: string;
  program: string;
  tahun: string;
  anggaran: number;
  realisasiTotal: number;
  bulanan: Record<string, number>;
}

export async function GET() {
  try {
    // --- LOGIKA PINTAR UNTUK VERCEL & LOKAL (Bebas Error ESLint) ---
    let credentials;
    if (process.env.GOOGLE_CREDENTIALS) {
      // Jika di Vercel, baca dari Environment Variable
      credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } else {
      // Jika di komputer lokal, baca file menggunakan File System (fs)
      const filePath = path.join(process.cwd(), 'google-credentials.json');
      const fileContents = fs.readFileSync(filePath, 'utf8');
      credentials = JSON.parse(fileContents);
    }

    const serviceAccountAuth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1ayGwiw88EsyAadikJFkdPoDHS5fLbfEcC9YXsgKGm2c';
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const sheetNames = ['GRAND TOTAL', 'KAB ACEH UTARA', 'KAB BIREUN', 'LHOKSEUMAWE'];
    const allData: SheetRowData[] = [];

    const cleanNumber = (val: string | undefined | null) => {
      if (!val) return 0;
      return parseFloat(val.replace(/[^0-9,-]+/g, "") || "0");
    };

    for (const name of sheetNames) {
      const sheet = doc.sheetsByTitle[name];
      if (!sheet) continue;

      const rows = await sheet.getRows();

      const sheetData = rows.map((row) => {
        const jenisBelanja = (row.get('NMAKUN') || row.get('Jenis Belanja') || '').trim();

        return {
          wilayah: name,
          jenisBelanja: jenisBelanja,
          program: row.get('PROGRAM PENGELOLAAN')?.trim().toUpperCase() || 'LAINNYA',
          tahun: row.get('TAHUN') || new Date().getFullYear().toString(),
          anggaran: cleanNumber(row.get('PAGU')),
          realisasiTotal: cleanNumber(row.get('Total')),
          bulanan: {
            Jan: cleanNumber(row.get('REALISASI JANUARI')),
            Feb: cleanNumber(row.get('REALISASI FEBRUARI')),
            Mar: cleanNumber(row.get('REALISASI MARET')),
            Apr: cleanNumber(row.get('REALISASI APRIL')),
            Mei: cleanNumber(row.get('REALISASI MEI')),
            Jun: cleanNumber(row.get('REALISASI JUNI')),
            Jul: cleanNumber(row.get('REALISASI JULI')),
            Agu: cleanNumber(row.get('REALISASI AGUSTUS')),
            Sep: cleanNumber(row.get('REALISASI SEPTEMBER')),
            Okt: cleanNumber(row.get('REALISASI OKTOBER')),
            Nov: cleanNumber(row.get('REALISASI NOVEMBER')),
            Des: cleanNumber(row.get('REALISASI DESEMBER')),
          }
        };
      });

      const validData = sheetData.filter(d => d.jenisBelanja !== '');
      allData.push(...validData);
    }

    return NextResponse.json(allData);
  } catch (error) {
    console.error("Detail Error API:", error);
    return NextResponse.json({ error: "Gagal memuat data", detail: String(error) }, { status: 500 });
  }
}