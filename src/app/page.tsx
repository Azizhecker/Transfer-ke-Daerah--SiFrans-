// src/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
// Impor Image bawaan Next.js untuk optimasi gambar (Mengatasi warning no-img-element)
import Image from "next/image";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar 
} from "recharts";
// Menghapus impor 'Wallet' karena tidak dipakai lagi (Mengatasi warning unused-vars)
import { LayoutDashboard, Map as MapIcon, TrendingUp, Loader2, Search, Building2, Calendar, FileText, ChevronRight } from "lucide-react";

interface SheetRow {
  wilayah: string;
  jenisBelanja: string;
  program: string;
  tahun: string;
  anggaran: number;
  realisasiTotal: number;
  bulanan: Record<string, number>;
}

// Menghapus konstanta KEMENKEU_NAVY yang tidak dipakai (Mengatasi warning unused-vars)
const KEMENKEU_BLUE = "#005FAC";
const KEMENKEU_GOLD = "#FFD700";
const COLORS = [KEMENKEU_BLUE, KEMENKEU_GOLD, '#ced4da', '#8ecae6', '#caf0f8', '#f8edeb', '#ecf39e', '#03045e'];

const BULAN_LIST = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function Dashboard() {
  const [activeRegion, setActiveRegion] = useState("GRAND TOTAL");
  const [activeYear, setActiveYear] = useState("Semua Tahun");
  const [activeTab, setActiveTab] = useState("program");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  
  const [rawData, setRawData] = useState<SheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/sheets');
        const data = await res.json();
        if (Array.isArray(data)) setRawData(data);
      } catch (error) {
        console.error("Gagal load data", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  };

  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const isRegionMatch = d.wilayah.toUpperCase() === activeRegion.toUpperCase();
      const isYearMatch = activeYear === "Semua Tahun" || d.tahun.toString() === activeYear;
      return isRegionMatch && isYearMatch;
    });
  }, [rawData, activeRegion, activeYear]);

  const totalAnggaran = filteredData.reduce((sum, item) => sum + item.anggaran, 0);
  const totalRealisasi = filteredData.reduce((sum, item) => sum + item.realisasiTotal, 0);
  const persentaseTotal = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(2) : "0.00";

  const chartDataProgram = useMemo(() => {
    const map = new Map();
    filteredData.forEach(item => {
      if (!map.has(item.program)) map.set(item.program, { name: item.program, anggaran: 0, realisasi: 0 });
      const current = map.get(item.program);
      current.anggaran += item.anggaran;
      current.realisasi += item.realisasiTotal;
    });
    return Array.from(map.values()).sort((a, b) => b.anggaran - a.anggaran);
  }, [filteredData]);

  const chartDataYearly = useMemo(() => {
    const map = new Map();
    filteredData.forEach(item => {
      if (!map.has(item.tahun)) map.set(item.tahun, { tahun: item.tahun, realisasi: 0 });
      map.get(item.tahun).realisasi += item.realisasiTotal;
    });
    return Array.from(map.values()).sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [filteredData]);

  const uniquePrograms = Array.from(new Set(filteredData.map(d => d.program)));
  const programToFilter = selectedProgramFilter || (uniquePrograms.length > 0 ? uniquePrograms[0] : "");
  
  const chartDataBelanja = useMemo(() => {
    const subData = filteredData.filter(d => d.program === programToFilter);
    const map = new Map();
    subData.forEach(item => {
      const key = activeYear === "Semua Tahun" ? `${item.tahun} - ${item.jenisBelanja}` : item.jenisBelanja;
      if (!map.has(key)) map.set(key, { nama: item.jenisBelanja, tahun: item.tahun, anggaran: 0, realisasi: 0 });
      const current = map.get(key);
      current.anggaran += item.anggaran;
      current.realisasi += item.realisasiTotal;
    });

    const arr = Array.from(map.values());
    if (activeYear === "Semua Tahun") {
      arr.sort((a, b) => a.tahun.localeCompare(b.tahun) || b.anggaran - a.anggaran);
    } else {
      arr.sort((a, b) => b.anggaran - a.anggaran);
    }
    return arr;
  }, [filteredData, programToFilter, activeYear]);

  const chartDataTren = useMemo(() => {
    return BULAN_LIST.map(bulan => {
      const obj: Record<string, string | number> = { bulan };
      uniquePrograms.forEach(prog => {
        obj[prog] = filteredData
          .filter(d => d.program === prog)
          .reduce((sum, d) => sum + (d.bulanan[bulan] || 0), 0);
      });
      return obj;
    });
  }, [filteredData, uniquePrograms]);

  const yearOptions = ["Semua Tahun", ...Array.from(new Set(rawData.map(d => d.tahun))).sort().reverse()];

if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#F0F2F5] text-[#002B5B] px-4">
        
        {/* HEADER LOGO & TEKS (Sejajar ke Samping / Horizontal) */}
        <div className="flex items-center gap-4 md:gap-6 mb-12">
          
          {/* 1. Logo Emblem */}
          <Image 
            src="/logo/logo-djpb-lhokseumawe.png" // Sesuaikan nama filenya jika berbeda
            alt="Logo Kemenkeu" 
            width={90} 
            height={90} 
            className="w-auto h-16 md:h-20 object-contain drop-shadow-sm"
            priority
          />
          
          {/* 2. Garis Pemisah Vertikal (Vertical Divider) */}
          <div className="h-10 md:h-16 w-0.5 bg-slate-300 rounded-full"></div>

          {/* 3. Teks Instansi di Kanan Logo */}
          <div className="flex flex-col text-left">
            <h1 className="text-xl md:text-2xl text-[#003366] tracking-wide" style={{ fontFamily: 'Arial, sans-serif' }}>
              DITJEN PERBENDAHARAAN KEMENKEU RI
            </h1>
            <div className="mt-1">
              <h2 className="font-extrabold text-sm md:text-base text-[#002B5B] tracking-widest uppercase">
                Lhokseumawe
              </h2>
              {/* Garis Kuning Khas Kemenkeu di Bawah Teks Lhokseumawe */}
              <div className="h-1 w-16 bg-[#FFD700] mt-1.5 rounded-sm"></div>
            </div>
          </div>

        </div>

        {/* KOTAK LOADING UTAMA */}
        <div className="flex flex-col items-center justify-center gap-4 bg-white p-8 md:p-10 rounded-xl shadow-lg border-t-4 border-[#005FAC] w-full max-w-sm">
          <Loader2 className="animate-spin text-[#005FAC]" size={44} />
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800">Realisasi Transfer ke Daerah (SiFRANS)</h3>
            <p className="text-sm text-slate-500 mt-1">KPPN LHOKSEUMAWE</p>
          </div>
        </div>

      </div>
    );
  }

  const regionLabel = {
    'GRAND TOTAL': 'Semua Wilayah Kerja',
    'LHOKSEUMAWE': 'Kota Lhokseumawe',
    'KAB ACEH UTARA': 'Kab. Aceh Utara',
    'KAB BIREUN': 'Kab. Bireun'
  }[activeRegion] || activeRegion;

  const displayYearText = activeYear === "Semua Tahun" ? "Semua Tahun Anggaran" : `Tahun Anggaran ${activeYear}`;

  return (
    <div className="flex h-screen bg-[#F0F2F5] text-slate-800 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#002B5B] text-white flex flex-col justify-between shadow-2xl z-20">
        <div>
          <div className="p-5 border-b border-blue-900/50 bg-[#001D3D] flex items-center gap-3">
            <div className="bg-white p-2 rounded flex items-center justify-center">
              <Building2 size={24} className="text-[#002B5B]" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-widest text-white leading-tight">KPPN 089</h1>
              <p className="text-[10px] font-medium text-[#FFD700] uppercase tracking-wider">Lhokseumawe</p>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-[11px] font-bold text-blue-300/70 mb-3 px-2 uppercase tracking-widest">Wilayah Kerja</p>
            <nav className="space-y-1 mb-8">
              {[
                { id: "GRAND TOTAL", label: "Konsolidasi Total", icon: LayoutDashboard },
                { id: "LHOKSEUMAWE", label: "Kota Lhokseumawe", icon: MapIcon },
                { id: "KAB ACEH UTARA", label: "Kab. Aceh Utara", icon: MapIcon },
                { id: "KAB BIREUN", label: "Kab. Bireun", icon: MapIcon },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveRegion(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-medium ${
                    activeRegion === item.id 
                      ? "bg-[#005FAC] text-white border-l-4 border-[#FFD700] shadow-md" 
                      : "text-blue-100/70 hover:bg-[#003B73] hover:text-white"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="px-2 pt-4 border-t border-blue-900/50">
              <p className="text-[11px] font-bold text-blue-300/70 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12}/> Tahun Anggaran
              </p>
              <select 
                value={activeYear}
                onChange={(e) => setActiveYear(e.target.value)}
                className="w-full px-3 py-2 border border-blue-800 rounded bg-[#001D3D] text-white text-sm font-semibold outline-none focus:ring-1 focus:ring-[#FFD700] appearance-none"
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-[#001D3D] border-t border-blue-900/50 text-center">
          <p className="text-[10px] text-blue-300/50">Modul Transfer Daerah v2.0</p>
          <p className="text-[10px] text-blue-300/50">© 2026 Kemenkeu RI</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <span className="text-[#002B5B] font-bold">Modul TKD</span>
            <ChevronRight size={16} className="mx-1 opacity-50"/>
            <span>Realisasi</span>
            <ChevronRight size={16} className="mx-1 opacity-50"/>
            <span className="text-slate-800">{regionLabel}</span>
          </div>
          
          <div className="flex items-center gap-4 border-l pl-6">
            {/* Perbaikan: Menggunakan komponen Image dari Next.js */}
            <Image 
               src="/logo/INTRESS.png" 
               alt="INTRESS" 
               width={120} 
               height={24} 
               className="h-6 w-auto object-contain" 
            />
            <Image 
               src="/logo/DJPb.png" 
               alt="DJPb" 
               width={120} 
               height={32} 
               className="h-8 w-auto object-contain" 
            />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 bg-[#F0F2F5] p-8">
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#002B5B] tracking-tight uppercase">Monitoring Penyaluran Dana Transfer</h2>
            <p className="text-slate-600 text-sm mt-1">{regionLabel} • {displayYearText}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm border-l-4 border-l-[#005FAC]">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pagu Anggaran</p>
              <h3 className="text-2xl font-black text-slate-800">{formatRupiah(totalAnggaran)}</h3>
            </div>
            
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm border-l-4 border-l-[#FFD700]">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Realisasi S.D. Saat Ini</p>
              <h3 className="text-2xl font-black text-[#005FAC]">{formatRupiah(totalRealisasi)}</h3>
            </div>
            
            <div className="bg-[#002B5B] p-5 rounded shadow-sm relative overflow-hidden">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Persentase Penyerapan</p>
              <h3 className="text-3xl font-black text-white flex items-end gap-1">
                {persentaseTotal} <span className="text-lg font-bold text-[#FFD700] mb-1">%</span>
              </h3>
              <div className="w-full bg-blue-900 rounded-none h-1.5 mt-3">
                <div className="bg-[#FFD700] h-1.5 rounded-none" style={{ width: `${persentaseTotal}%` }}></div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="bg-white border-b border-slate-200 mb-6 flex px-2 pt-2">
            {[
              { id: "program", label: "Program Pengelolaan", icon: LayoutDashboard },
              { id: "belanja", label: "Rincian Belanja", icon: FileText },
              { id: "tren", label: "Grafik Bulanan", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? "border-[#005FAC] text-[#005FAC] bg-blue-50/50" 
                    : "border-transparent text-slate-500 hover:text-[#002B5B] hover:bg-slate-50"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: PROGRAM TKD */}
          {activeTab === "program" && (
            <div className="space-y-6">
              {activeYear === "Semua Tahun" && (
                <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-[#002B5B] uppercase text-sm tracking-wider mb-6 border-b pb-2">Perbandingan Realisasi Antar Tahun</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataYearly}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis tickFormatter={(val) => `Rp${val/1000000000}M`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}}/>
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="realisasi" fill="#005FAC" radius={[2, 2, 0, 0]} barSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="bg-white p-6 rounded border border-slate-200 shadow-sm lg:col-span-4">
                  <h3 className="font-bold text-[#002B5B] uppercase text-sm tracking-wider mb-6 border-b pb-2">Komposisi Pagu</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataProgram} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="anggaran">
                          {chartDataProgram.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} />
                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '8px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-0 rounded border border-slate-200 shadow-sm lg:col-span-8 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-200 bg-[#F8FAFC]">
                    <h3 className="font-bold text-[#002B5B] uppercase text-sm tracking-wider">Tabel Rincian Program</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-[#F1F5F9] text-slate-600 font-bold uppercase text-xs border-b border-slate-300">
                        <tr>
                          <th className="px-5 py-3">Uraian Program</th>
                          <th className="px-5 py-3 text-right">Pagu Anggaran</th>
                          <th className="px-5 py-3 text-right">Realisasi</th>
                          <th className="px-5 py-3 text-center">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chartDataProgram.map((item, index) => (
                          <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-5 py-3 font-semibold text-[#002B5B]">{item.name}</td>
                            <td className="px-5 py-3 text-right font-mono text-slate-700">{formatRupiah(item.anggaran)}</td>
                            <td className="px-5 py-3 text-right font-mono text-slate-700">{formatRupiah(item.realisasi)}</td>
                            <td className="px-5 py-3 text-center font-bold text-[#005FAC]">
                              {item.anggaran > 0 ? ((item.realisasi / item.anggaran) * 100).toFixed(2) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: JENIS BELANJA */}
          {activeTab === "belanja" && (
            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-[#F8FAFC] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-[#002B5B] uppercase text-sm tracking-wider flex items-center gap-2">
                  <Search size={16} className="text-[#005FAC]"/> Filter Program Pengelolaan
                </h3>
                <select 
                  value={programToFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded bg-white text-sm font-bold text-[#002B5B] outline-none focus:border-[#005FAC] focus:ring-1 focus:ring-[#005FAC]"
                >
                  {uniquePrograms.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                </select>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#F1F5F9] text-slate-600 font-bold uppercase text-xs border-b border-slate-300">
                    <tr>
                      {activeYear === "Semua Tahun" && <th className="px-5 py-3">Tahun</th>}
                      <th className="px-5 py-3">Jenis Belanja (Akun)</th>
                      <th className="px-5 py-3 text-right">Pagu Anggaran</th>
                      <th className="px-5 py-3 text-right">Realisasi</th>
                      <th className="px-5 py-3 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chartDataBelanja.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada data rincian belanja.</td></tr>
                    )}
                    {chartDataBelanja.map((item, index) => {
                      const pct = item.anggaran > 0 ? ((item.realisasi / item.anggaran) * 100).toFixed(2) : 0;
                      return (
                        <tr key={index} className={`hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          {activeYear === "Semua Tahun" && <td className="px-5 py-3 font-mono text-slate-500">{item.tahun}</td>}
                          <td className="px-5 py-3 font-medium text-[#002B5B]">{item.nama}</td>
                          <td className="px-5 py-3 text-right font-mono text-slate-700">{formatRupiah(item.anggaran)}</td>
                          <td className="px-5 py-3 text-right font-mono text-slate-700">{formatRupiah(item.realisasi)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="font-bold text-[#005FAC] w-12 text-right">{pct}%</span>
                              <div className="w-16 bg-slate-200 h-1.5 rounded-none hidden md:block">
                                <div className="bg-[#005FAC] h-1.5 rounded-none" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TREN BULANAN */}
          {activeTab === "tren" && (
            <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
              {activeYear === "Semua Tahun" ? (
                <div className="bg-orange-50 text-orange-800 p-5 rounded border-l-4 border-orange-500 flex flex-col items-center justify-center text-center py-10">
                  <Calendar size={40} className="text-orange-400 mb-4 opacity-50"/>
                  <h4 className="font-bold text-lg mb-1">Pilih Tahun Anggaran</h4>
                  <p className="text-sm">Grafik pergerakan bulanan hanya dapat ditampilkan untuk satu tahun anggaran spesifik. <br/>Silakan ubah filter tahun di menu samping kiri.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-[#002B5B] uppercase text-sm tracking-wider mb-6 border-b pb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#005FAC]"/> Grafik Realisasi Bulanan TA {activeYear}
                  </h3>
                  {/* Perbaikan: Mengganti h-[400px] dengan class kanonikal h-100 */}
                  <div className="h-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartDataTren} margin={{top: 10, right: 30, left: 20, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `Rp${val/1000000}JT`} />
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} />
                        <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}/>
                        {uniquePrograms.map((prog, index) => (
                          <Line key={prog as string} type="monotone" dataKey={prog as string} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}