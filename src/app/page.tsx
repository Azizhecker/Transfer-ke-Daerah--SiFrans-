// src/app/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, BarChart, Bar 
} from "recharts";
import { 
  LayoutDashboard, Map as MapIcon, TrendingUp, Loader2, Search, 
  Building2, Calendar, FileText, ChevronRight, Menu, X 
} from "lucide-react";

interface SheetRow {
  wilayah: string;
  jenisBelanja: string;
  program: string;
  tahun: string;
  anggaran: number;
  realisasiTotal: number;
  bulanan: Record<string, number>;
}

const KEMENKEU_BLUE = "#005FAC";
// Sedikit menggelapkan warna emas Kemenkeu agar teks putih/background putih lebih kontras
const KEMENKEU_GOLD = "#F59E0B"; 

// PERBAIKAN WARNA: Menggunakan warna-warna yang tegas, solid, dan kontras tinggi
const COLORS = [
  KEMENKEU_BLUE, 
  KEMENKEU_GOLD, 
  '#10B981', // Emerald Green (Hijau Tegas)
  '#EF4444', // Red (Merah Tegas)
  '#8B5CF6', // Purple (Ungu)
  '#06B6D4', // Cyan (Biru Muda Terang)
  '#F97316', // Orange (Oranye)
  '#1E293B'  // Dark Slate (Biru Dongker Sangat Gelap)
];

const BULAN_LIST = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default function Dashboard() {
  const [activeRegion, setActiveRegion] = useState("GRAND TOTAL");
  const [activeYear, setActiveYear] = useState("Semua Tahun");
  const [activeTab, setActiveTab] = useState("program");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("");
  
  const [rawData, setRawData] = useState<SheetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [yoyMetric, setYoyMetric] = useState("keduanya");
  const [selectedJenisBelanjaFilter, setSelectedJenisBelanjaFilter] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const regionalRawData = useMemo(() => {
    return rawData.filter(d => d.wilayah.toUpperCase() === activeRegion.toUpperCase());
  }, [rawData, activeRegion]);

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
      if (!map.has(item.tahun)) map.set(item.tahun, { tahun: item.tahun, realisasi: 0, anggaran: 0 });
      const current = map.get(item.tahun);
      current.realisasi += item.realisasiTotal;
      current.anggaran += item.anggaran;
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

  const uniqueJenisBelanja = useMemo(() => {
    return Array.from(new Set(regionalRawData.map(d => d.jenisBelanja))).sort();
  }, [regionalRawData]);

  const activeJenisBelanja = selectedJenisBelanjaFilter && uniqueJenisBelanja.includes(selectedJenisBelanjaFilter)
    ? selectedJenisBelanjaFilter
    : (uniqueJenisBelanja.length > 0 ? uniqueJenisBelanja[0] : "");

  const chartDataYoYJenisBelanja = useMemo(() => {
    const map = new Map();
    const subData = regionalRawData.filter(d => d.jenisBelanja === activeJenisBelanja);
    subData.forEach(item => {
      if (!map.has(item.tahun)) map.set(item.tahun, { tahun: item.tahun, realisasi: 0, anggaran: 0 });
      const current = map.get(item.tahun);
      current.realisasi += item.realisasiTotal;
      current.anggaran += item.anggaran;
    });
    return Array.from(map.values()).sort((a, b) => a.tahun.localeCompare(b.tahun));
  }, [regionalRawData, activeJenisBelanja]);

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
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 md:mb-12">
          <Image src="/logo/logo-djpb-lhokseumawe.png" alt="Logo Kemenkeu" width={90} height={90} className="w-auto h-16 md:h-20 object-contain drop-shadow-sm" priority />
          <div className="h-0.5 w-16 md:h-16 md:w-0.5 bg-slate-300 rounded-full my-2 md:my-0"></div>
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-lg md:text-2xl font-bold text-[#005FAC] tracking-wide" style={{ fontFamily: 'Arial, sans-serif' }}>DITJEN PERBENDAHARAAN KEMENKEU RI</h1>
            <div className="mt-1 flex flex-col items-center md:items-start">
              <h2 className="font-extrabold text-sm md:text-base text-[#002B5B] tracking-widest uppercase">Lhokseumawe</h2>
              <div className="h-1 w-16 bg-[#FFD700] mt-1.5 rounded-sm"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 bg-white p-8 md:p-10 rounded-xl shadow-lg border-t-4 border-[#005FAC] w-full max-w-sm">
          <Loader2 className="animate-spin text-[#005FAC]" size={44} />
          <div className="text-center">
            <h3 className="font-bold text-lg text-slate-800">Realisasi Transfer ke Daerah (SiFRANS)</h3>
            <p className="text-sm text-slate-500 mt-1">KPPN LHOKSEUMAWE...</p>
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
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 shrink-0 bg-[#002B5B] text-white flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0 ml-0" : "-translate-x-full lg:-ml-64"}`}>
        <div>
          <div className="p-5 border-b border-blue-900/50 bg-[#001D3D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded flex items-center justify-center">
                <Building2 size={24} className="text-[#002B5B]" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-widest text-white leading-tight">KPPN 089</h1>
                <p className="text-[10px] font-medium text-[#FFD700] uppercase tracking-wider">Lhokseumawe</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-blue-200 hover:text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto">
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
                  onClick={() => {
                    setActiveRegion(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
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
          <p className="text-[10px] text-blue-300/50">© 2026 kppn lhokseumawe</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300 ease-in-out">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors shrink-0"
              title="Toggle Menu"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden sm:flex items-center text-xs md:text-sm font-medium text-slate-500 truncate">
              <span className="text-[#002B5B] font-bold whitespace-nowrap">Modul TKD</span>
              <ChevronRight size={16} className="mx-1 opacity-50 shrink-0"/>
              <span className="whitespace-nowrap">Realisasi</span>
              <ChevronRight size={16} className="mx-1 opacity-50 shrink-0"/>
              <span className="text-slate-800 truncate max-w-30 md:max-w-none">{regionLabel}</span>
            </div>
            <span className="sm:hidden text-[#002B5B] font-bold text-sm truncate ml-1">Realisasi TKD</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-6">
            <Image src="/logo/intreskppnlhok.png" alt="INTRESS" width={100} height={20} className="h-4 md:h-6 w-auto object-contain hidden sm:block" />
            <Image src="/logo/DJPb.png" alt="DJPb" width={100} height={28} className="h-6 md:h-8 w-auto object-contain" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 bg-[#F0F2F5] p-4 lg:p-8">
          
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#002B5B] tracking-tight uppercase leading-tight">Monitoring Penyaluran Dana Transfer</h2>
            <p className="text-slate-600 text-xs md:text-sm mt-1">{regionLabel} • {displayYearText}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-5 rounded border border-slate-200 shadow-sm border-l-4 border-l-[#005FAC]">
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Pagu Anggaran</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800 truncate">{formatRupiah(totalAnggaran)}</h3>
            </div>
            <div className="bg-white p-4 md:p-5 rounded border border-slate-200 shadow-sm border-l-4 border-l-[#FFD700]">
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Realisasi S.D. Saat Ini</p>
              <h3 className="text-xl md:text-2xl font-black text-[#005FAC] truncate">{formatRupiah(totalRealisasi)}</h3>
            </div>
            <div className="bg-[#002B5B] p-4 md:p-5 rounded shadow-sm relative overflow-hidden">
              <p className="text-blue-200 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Persentase Penyerapan</p>
              <h3 className="text-2xl md:text-3xl font-black text-white flex items-end gap-1">
                {persentaseTotal} <span className="text-base md:text-lg font-bold text-[#FFD700] mb-0.5 md:mb-1">%</span>
              </h3>
              <div className="w-full bg-blue-900 rounded-none h-1.5 mt-2 md:mt-3">
                <div className="bg-[#FFD700] h-1.5 rounded-none" style={{ width: `${persentaseTotal}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white border-b border-slate-200 mb-6 flex overflow-x-auto hide-scrollbar pt-2">
            {[
              { id: "program", label: "Program", icon: LayoutDashboard },
              { id: "belanja", label: "Rincian", icon: FileText },
              { id: "tren", label: "Tren", icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
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
                <div className="bg-white p-4 md:p-6 rounded border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 border-b pb-2 gap-3">
                    <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider">Perbandingan Tren Lintas Tahun</h3>
                    <select 
                      value={yoyMetric}
                      onChange={(e) => setYoyMetric(e.target.value)}
                      className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-xs font-bold text-[#002B5B] outline-none focus:border-[#005FAC] focus:ring-1 focus:ring-[#005FAC]"
                    >
                      <option value="keduanya">Pagu & Realisasi</option>
                      <option value="anggaran">Hanya Pagu Anggaran</option>
                      <option value="realisasi">Hanya Realisasi</option>
                    </select>
                  </div>
                  <div className="h-48 md:h-64 -ml-4 md:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataYearly} margin={{ left: -15, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <YAxis tickFormatter={(val) => `${val/1000000000}M`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}}/>
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} cursor={{fill: '#f8fafc'}} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {(yoyMetric === "keduanya" || yoyMetric === "anggaran") && (
                          <Bar name="Pagu Anggaran" dataKey="anggaran" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={40} />
                        )}
                        {(yoyMetric === "keduanya" || yoyMetric === "realisasi") && (
                          <Bar name="Realisasi" dataKey="realisasi" fill="#005FAC" radius={[2, 2, 0, 0]} maxBarSize={40} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="bg-white p-4 md:p-6 rounded border border-slate-200 shadow-sm lg:col-span-4">
                  <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider mb-4 md:mb-6 border-b pb-2">Komposisi Pagu</h3>
                  <div className="h-56 md:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataProgram} innerRadius="55%" outerRadius="90%" paddingAngle={2} dataKey="anggaran">
                          {chartDataProgram.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} />
                        {/* PERBAIKAN: Format teks legend di sini agar super tebal dan gelap */}
                        <Legend 
                          verticalAlign="bottom" 
                          formatter={(value) => <span style={{ color: '#0F172A', fontWeight: 700 }}>{value}</span>}
                          wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-0 rounded border border-slate-200 shadow-sm lg:col-span-8 overflow-hidden flex flex-col w-full">
                  <div className="p-3 md:p-4 border-b border-slate-200 bg-[#F8FAFC]">
                    <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider">Tabel Rincian Program</h3>
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-150">
                      <thead className="bg-[#F1F5F9] text-slate-600 font-bold uppercase text-[10px] md:text-xs border-b border-slate-300">
                        <tr>
                          <th className="px-3 md:px-5 py-2 md:py-3">Uraian Program</th>
                          <th className="px-3 md:px-5 py-2 md:py-3 text-right">Pagu Anggaran</th>
                          <th className="px-3 md:px-5 py-2 md:py-3 text-right">Realisasi</th>
                          <th className="px-3 md:px-5 py-2 md:py-3 text-center">%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {chartDataProgram.map((item, index) => (
                          <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-3 md:px-5 py-2 md:py-3 font-semibold text-[#002B5B] whitespace-normal min-w-50">{item.name}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-right font-mono text-slate-700">{formatRupiah(item.anggaran)}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-right font-mono text-slate-700">{formatRupiah(item.realisasi)}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-center font-bold text-[#005FAC]">
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
            <div className="space-y-6">
              {activeYear === "Semua Tahun" && chartDataYoYJenisBelanja.length > 0 && (
                <div className="bg-white p-4 md:p-6 rounded border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 border-b pb-2 gap-3">
                    <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider">
                      Tren Lintas Tahun per Jenis Belanja
                    </h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select 
                        value={activeJenisBelanja}
                        onChange={(e) => setSelectedJenisBelanjaFilter(e.target.value)}
                        className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 rounded bg-slate-50 text-xs font-bold text-[#002B5B] outline-none focus:border-[#005FAC] focus:ring-1 focus:ring-[#005FAC]"
                      >
                        {uniqueJenisBelanja.map(jb => <option key={jb} value={jb}>{jb}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="h-48 md:h-64 -ml-4 md:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataYoYJenisBelanja} margin={{ left: -15, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="tahun" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <YAxis tickFormatter={(val) => `${val/1000000000}M`} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}}/>
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} cursor={{fill: '#f8fafc'}} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar name="Pagu Anggaran" dataKey="anggaran" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={40} />
                        <Bar name="Realisasi" dataKey="realisasi" fill="#F59E0B" radius={[2, 2, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="p-4 md:p-5 border-b border-slate-200 bg-[#F8FAFC] flex flex-col gap-3">
                  <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider flex items-center gap-2">
                    <Search size={16} className="text-[#005FAC] shrink-0"/> Rincian per Program
                  </h3>
                  <select 
                    value={programToFilter}
                    onChange={(e) => setSelectedProgramFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs md:text-sm font-bold text-[#002B5B] outline-none focus:border-[#005FAC] focus:ring-1 focus:ring-[#005FAC]"
                  >
                    {uniquePrograms.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                  </select>
                </div>

                <div className="p-0 overflow-x-auto w-full">
                  <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-175">
                    <thead className="bg-[#F1F5F9] text-slate-600 font-bold uppercase text-[10px] md:text-xs border-b border-slate-300">
                      <tr>
                        {activeYear === "Semua Tahun" && <th className="px-3 md:px-5 py-2 md:py-3">Tahun</th>}
                        <th className="px-3 md:px-5 py-2 md:py-3">Jenis Belanja (Akun)</th>
                        <th className="px-3 md:px-5 py-2 md:py-3 text-right">Pagu Anggaran</th>
                        <th className="px-3 md:px-5 py-2 md:py-3 text-right">Realisasi</th>
                        <th className="px-3 md:px-5 py-2 md:py-3 text-center">%</th>
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
                            {activeYear === "Semua Tahun" && <td className="px-3 md:px-5 py-2 md:py-3 font-mono text-slate-500">{item.tahun}</td>}
                            <td className="px-3 md:px-5 py-2 md:py-3 font-medium text-[#002B5B]">{item.nama}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-right font-mono text-slate-700">{formatRupiah(item.anggaran)}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3 text-right font-mono text-slate-700">{formatRupiah(item.realisasi)}</td>
                            <td className="px-3 md:px-5 py-2 md:py-3">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="font-bold text-[#005FAC] w-10 md:w-12 text-right">{pct}%</span>
                                <div className="w-12 md:w-16 bg-slate-200 h-1.5 rounded-none hidden sm:block">
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
            </div>
          )}

          {/* TAB 3: TREN BULANAN */}
          {activeTab === "tren" && (
            <div className="bg-white p-4 md:p-6 rounded border border-slate-200 shadow-sm overflow-hidden">
              {activeYear === "Semua Tahun" ? (
                <div className="bg-orange-50 text-orange-800 p-4 md:p-5 rounded border-l-4 border-orange-500 flex flex-col items-center justify-center text-center py-8 md:py-10">
                  <Calendar size={36} className="text-orange-400 mb-3 opacity-50"/>
                  <h4 className="font-bold text-base md:text-lg mb-1">Pilih Tahun Anggaran</h4>
                  <p className="text-xs md:text-sm max-w-sm">Grafik pergerakan bulanan hanya dapat ditampilkan untuk satu tahun anggaran spesifik. Silakan ubah filter tahun di menu.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-[#002B5B] uppercase text-xs md:text-sm tracking-wider mb-4 md:mb-6 border-b pb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#005FAC]"/> Grafik Realisasi TA {activeYear}
                  </h3>
                  <div className="h-64 md:h-100 -ml-4 md:ml-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartDataTren} margin={{top: 10, right: 10, left: -10, bottom: 5}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(val) => `${val/1000000}JT`} />
                        <RechartsTooltip formatter={(value) => formatRupiah(value as number)} />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }}/>
                        {uniquePrograms.map((prog, index) => (
                          <Line key={prog as string} type="monotone" dataKey={prog as string} stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} />
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