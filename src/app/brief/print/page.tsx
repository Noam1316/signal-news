'use client';

import { useEffect, useState } from 'react';
import type { BriefStory, ShockEvent } from '@/lib/types';

/** Generate Hebrew PDF by screenshotting the DOM (preserves RTL + Hebrew fonts) */
async function generateAndSharePDFFromDOM(isHe: boolean): Promise<void> {
  const element = document.getElementById('print-content');
  if (!element) return;

  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;

  // Clone into a clean fixed container — avoids toolbar overlap & margin issues
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'width:794px', 'margin:0', 'padding:32px',
    'background:white', 'z-index:-9999', 'pointer-events:none',
    'font-family:Arial,sans-serif',
  ].join(';');
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.90);
    const pageW = 210;
    const pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    let pos = 0;
    pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
    let remaining = imgH - pageH;
    while (remaining > 0) {
      pos -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH);
      remaining -= pageH;
    }

    const fileName = `zikuk-brief-${isHe ? 'he' : 'en'}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Zikuk Intel Brief' }); return; }
      catch { /* cancelled */ }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(clone);
  }
}

/** Generate and share/download a real PDF file using jsPDF */
async function generateAndSharePDF(d: PrintData, isHe: boolean): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 18;
  const pageW = 210;
  const contentW = pageW - margin * 2;
  let y = 20;

  const addLine = (text: string, opts: { size?: number; bold?: boolean; color?: [number,number,number]; gap?: number } = {}) => {
    const { size = 10, bold = false, color = [30,30,30], gap = 6 } = opts;
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentW);
    if (y + lines.length * (size * 0.4) > 280) { doc.addPage(); y = 20; }
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.4) + gap;
  };

  const addRule = (color: [number,number,number] = [220,220,220]) => {
    doc.setDrawColor(...color);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // ── Header ──
  addLine('Zikuk — Geopolitical Intelligence Brief', { size: 18, bold: true, color: [30,30,30], gap: 3 });
  addLine(d.generatedAt, { size: 9, color: [120,120,120], gap: 2 });
  if (d.riskIndex !== null) {
    const riskColor: [number,number,number] = d.riskIndex >= 66 ? [220,38,38] : d.riskIndex >= 34 ? [217,119,6] : [16,185,129];
    addLine(`Geopolitical Risk Index: ${d.riskIndex}/100`, { size: 9, bold: true, color: riskColor, gap: 4 });
  }
  addRule([99,102,241]);
  y += 2;

  // ── Top Stories ──
  addLine('TOP STORIES', { size: 9, bold: true, color: [99,102,241], gap: 4 });
  d.stories.forEach((s, i) => {
    const headline = getText(s.headline, 'en') || getText(s.headline, 'he');
    const summary  = getText(s.summary,  'en') || getText(s.summary,  'he');
    const likColor: [number,number,number] = s.likelihood >= 70 ? [16,185,129] : s.likelihood >= 45 ? [217,119,6] : [107,114,128];
    addLine(`${i + 1}. ${headline}`, { size: 11, bold: true, gap: 2 });
    addLine(`Likelihood: ${s.likelihood}%${s.delta ? `  Δ${s.delta > 0 ? '+' : ''}${s.delta}%` : ''}  |  ${s.sources?.length || 0} sources`, { size: 8, color: likColor, gap: 2 });
    if (summary) addLine(summary.slice(0, 220), { size: 9, color: [80,80,80], gap: 5 });
    if (i < d.stories.length - 1) addRule();
  });

  // ── Shocks ──
  if (d.shocks.length > 0) {
    y += 4;
    addRule([99,102,241]);
    addLine('ACTIVE SHOCKS', { size: 9, bold: true, color: [99,102,241], gap: 4 });
    d.shocks.forEach(sh => {
      const hl = getText(sh.headline, 'en') || getText(sh.headline, 'he');
      const wm = getText(sh.whatMoved, 'en') || getText(sh.whatMoved, 'he');
      addLine(`⚡ ${hl}`, { size: 10, bold: true, gap: 2 });
      if (wm) addLine(wm, { size: 9, color: [100,100,100], gap: 4 });
    });
  }

  // ── Alpha ──
  if (d.topAlpha) {
    y += 2;
    addRule([99,102,241]);
    addLine('SIGNAL VS MARKET ALPHA', { size: 9, bold: true, color: [99,102,241], gap: 4 });
    addLine(d.topAlpha.topic, { size: 10, bold: true, gap: 2 });
    addLine(`Signal: ${d.topAlpha.signalLikelihood}%  |  Market: ${d.topAlpha.marketProbability}%  |  Delta: ${d.topAlpha.delta > 0 ? '+' : ''}${d.topAlpha.delta}%  |  Alpha: ${d.topAlpha.alphaScore}`, { size: 9, color: [80,80,80], gap: 2 });
    if (d.topAlpha.whyDifferent) addLine(d.topAlpha.whyDifferent, { size: 9, color: [120,120,120], gap: 4 });
  }

  // ── Footer ──
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(160,160,160);
    doc.text(`Zikuk Intelligence  |  zikuk.vercel.app  |  ${d.generatedAt}  |  Page ${p}/${pageCount}`, margin, 290);
  }

  const fileName = `zikuk-brief-${new Date().toISOString().slice(0,10)}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], fileName, { type: 'application/pdf' });

  // Try native share with file (iOS 15+ / Android with Chrome)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Zikuk Intel Brief' });
      return;
    } catch { /* user cancelled or not supported */ }
  }
  // Fallback: trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

interface AlphaItem {
  topic: string;
  signalLikelihood: number;
  marketProbability: number;
  delta: number;
  alphaScore: number;
  alphaDirection: string;
  whyDifferent: string;
  polymarketTitle?: string;
}

interface PrintData {
  stories: BriefStory[];
  shocks: ShockEvent[];
  topAlpha: AlphaItem | null;
  biasTop: { topic: string; gap: string } | null;
  generatedAt: string;
  generatedAtHe: string;
  riskIndex: number | null;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   '#10b981',
  medium: '#f59e0b',
  low:    '#6b7280',
};

function buildShareText(d: PrintData, lang: 'he' | 'en'): string {
  const isHe = lang === 'he';
  const lines: string[] = [
    `⚡ ${isHe ? 'Zikuk — תקציר מודיעין גיאופוליטי' : 'Zikuk — Geopolitical Intel Brief'}`,
    `📅 ${isHe ? d.generatedAtHe : d.generatedAt}`,
    '',
  ];
  d.stories.slice(0, 5).forEach((s, i) => {
    const h = getText(s.headline, lang);
    if (h) lines.push(`${i + 1}. ${h} — ${s.likelihood}%`);
  });
  if (d.shocks.length > 0) {
    lines.push('', `⚡ ${isHe ? 'זעזועים' : 'Shocks'}:`);
    d.shocks.slice(0, 2).forEach(s => {
      const h = getText(s.headline, lang);
      if (h) lines.push(`• ${h}`);
    });
  }
  lines.push('', `🔗 ${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`);
  return lines.join('\n');
}

function getText(h: any, lang: 'he' | 'en'): string {
  if (!h) return '';
  if (typeof h === 'string') return h;
  return lang === 'he' ? (h.he || h.en || '') : (h.en || h.he || '');
}

export default function PrintBriefPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [lang, setLang] = useState<'he' | 'en'>('he');

  // Read language from localStorage (same as main app)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('signal_lang');
      if (saved === 'en') setLang('en');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [storiesRes, shocksRes, previewRes, biasRes, analyzeRes] = await Promise.allSettled([
          fetch('/api/stories'),
          fetch('/api/shocks'),
          fetch('/api/tweet-preview'),
          fetch('/api/bias'),
          fetch('/api/analyze'),
        ]);

        const storiesData = storiesRes.status === 'fulfilled' && storiesRes.value.ok
          ? await storiesRes.value.json() : {};
        const shocksData = shocksRes.status === 'fulfilled' && shocksRes.value.ok
          ? await shocksRes.value.json() : {};
        const previewData = previewRes.status === 'fulfilled' && previewRes.value.ok
          ? await previewRes.value.json() : {};
        const biasData = biasRes.status === 'fulfilled' && biasRes.value.ok
          ? await biasRes.value.json() : {};
        const analyzeData = analyzeRes.status === 'fulfilled' && analyzeRes.value.ok
          ? await analyzeRes.value.json() : {};

        const stories: BriefStory[] = storiesData.stories || [];
        const shocks: ShockEvent[] = shocksData.shocks || [];

        // Risk index
        const sent = analyzeData?.stats?.sentimentBreakdown || {};
        const sentTotal = Object.values(sent).reduce((a: number, b) => a + (b as number), 0) as number;
        const negRatio = sentTotal > 0 ? ((sent.negative || 0) / sentTotal) : 0.4;
        const sentScore = Math.round(negRatio * 40);
        const shockPressure = shocks.reduce((acc, s) => acc + (s.confidence === 'high' ? 16 : s.confidence === 'medium' ? 8 : 4), 0);
        const shockScore = Math.min(40, shockPressure);
        const signalScore = Math.round((analyzeData?.stats?.signalRatio || 0) * 20);
        const riskIndex = sentTotal > 0 ? Math.min(100, sentScore + shockScore + signalScore) : null;

        const topAlpha: AlphaItem | null = previewData?.todaysTweet?.match || null;

        const gaps: any[] = biasData?.coverageGaps || [];
        const topGap = gaps[0] || null;
        const biasTop = topGap ? {
          topic: topGap.topic?.he || topGap.topic?.en || topGap.topic || '',
          gap: topGap.description?.he || topGap.description?.en || topGap.description || '',
        } : null;

        const now = new Date();
        setData({
          stories: stories.slice(0, 7),
          shocks: shocks.slice(0, 4),
          topAlpha,
          biasTop,
          generatedAt: now.toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
          }),
          generatedAtHe: now.toLocaleString('he-IL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
          }),
          riskIndex,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingHePDF, setGeneratingHePDF] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640 || /iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);

  const handlePrint = () => {
    if (isMobile) { setShowMobileHint(true); return; }
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 100);
  };

  const handleShare = async () => {
    if (!data) return;
    const text = buildShareText(data, lang);
    if (navigator.share) {
      try { await navigator.share({ title: `Zikuk — ${isHe ? 'תקציר מודיעין' : 'Intel Brief'}`, text, url: window.location.origin + '/dashboard' }); return; }
      catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isHe = lang === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-3">📋</div>
          <p>{isHe ? 'מכין תקציר…' : 'Preparing your brief…'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-3xl mb-3">⚠️</div>
          <p>{isHe ? 'שגיאה בטעינת הנתונים. נסה שוב.' : 'Failed to load brief data. Please try again.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300"
          >
            {isHe ? 'נסה שוב' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const d = data;
  const riskLabel = d.riskIndex !== null
    ? (d.riskIndex >= 66
        ? (isHe ? 'סיכון גבוה' : 'High Risk')
        : d.riskIndex >= 34
          ? (isHe ? 'סיכון בינוני' : 'Med Risk')
          : (isHe ? 'סיכון נמוך' : 'Low Risk'))
    : '';

  const shockTypeLabel = (type: string) => {
    if (isHe) return type === 'likelihood' ? 'סבירות' : type === 'narrative' ? 'נרטיב' : 'פיצול';
    return type === 'likelihood' ? 'Likelihood' : type === 'narrative' ? 'Narrative' : 'Fragmentation';
  };

  const confLabel = (c: string) => {
    if (isHe) return c === 'high' ? 'גבוה' : c === 'medium' ? 'בינוני' : 'נמוך';
    return c?.toUpperCase() || '';
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm 2cm; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white text-sm shrink-0"
          >
            {isHe ? '→ חזרה' : '← Back'}
          </button>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span className="text-white text-sm font-semibold hidden sm:inline truncate">📋 {isHe ? 'תקציר מודיעין' : 'Intel Brief'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Language toggle */}
          <button
            onClick={() => setLang(l => l === 'he' ? 'en' : 'he')}
            className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:text-gray-200"
          >
            {isHe ? 'EN' : 'עב'}
          </button>

          {isMobile ? (
            /* Mobile: 2 simple buttons */
            <>
              {/* WhatsApp — share text summary */}
              <a
                href={data ? `https://wa.me/?text=${encodeURIComponent(buildShareText(data, lang))}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-bold hover:bg-green-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.526 5.849L.057 23.286a.75.75 0 00.921.921l5.437-1.47A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.716 9.716 0 01-4.952-1.354l-.355-.211-3.678.994.993-3.556-.232-.368A9.716 9.716 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                WA
              </a>
              {/* PDF עברי — צילום DOM */}
              <button
                onClick={async () => {
                  if (generatingHePDF) return;
                  setGeneratingHePDF(true);
                  try { await generateAndSharePDFFromDOM(isHe); }
                  catch { /* silent */ }
                  finally { setGeneratingHePDF(false); }
                }}
                disabled={generatingHePDF || generatingPDF}
                title={isHe ? 'PDF בעברית — צילום עמוד' : 'PDF in Hebrew — page screenshot'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-400 transition-colors disabled:opacity-60"
              >
                {generatingHePDF ? '⏳' : '📄'} {generatingHePDF ? (isHe ? 'מייצר…' : 'Building…') : (isHe ? 'PDF עב׳' : 'PDF HE')}
              </button>
              {/* PDF אנגלית — טקסט */}
              <button
                onClick={async () => {
                  if (!data || generatingPDF) return;
                  setGeneratingPDF(true);
                  try { await generateAndSharePDF(data, isHe); }
                  catch { /* silent */ }
                  finally { setGeneratingPDF(false); }
                }}
                disabled={generatingPDF || generatingHePDF || !data}
                title={isHe ? 'PDF באנגלית — טקסט מובנה' : 'PDF in English — structured text'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-60"
              >
                {generatingPDF ? '⏳' : '📄'} {generatingPDF ? (isHe ? 'מייצר…' : 'Building…') : 'PDF EN'}
              </button>
            </>
          ) : (
            /* Desktop: PDF export */
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-300 transition-colors disabled:opacity-60"
            >
              {printing ? '…' : (isHe ? '⬇️ ייצוא PDF' : '⬇️ Export PDF')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile: simple PDF tip banner inside page */}
      {isMobile && (
        <div className="no-print mt-16 mx-4 mb-2 px-4 py-3 rounded-xl bg-blue-950/60 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2">
          <span>💡</span>
          <span>
            {isHe
              ? 'לשמירת PDF: שתף את הקישור למחשב → פתח → הדפס → שמור כ-PDF'
              : 'To save PDF: share link to desktop → open → Print → Save as PDF'}
          </span>
        </div>
      )}

      {/* Main content */}
      <div id="print-content" dir={dir} className={`max-w-3xl mx-auto px-6 py-8 bg-white min-h-screen shadow-sm ${isMobile ? 'mt-4' : 'mt-16'} print:mt-0`}>

        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-500 font-black text-xl tracking-tight">⚡ Signal</span>
                <span className="text-gray-400 text-sm">{isHe ? 'תקציר מודיעין גיאופוליטי' : 'Intelligence Brief'}</span>
              </div>
              <p className="text-xs text-gray-500">{isHe ? d.generatedAtHe : d.generatedAt}</p>
            </div>
            {d.riskIndex !== null && (
              <div className={`text-center px-3 py-2 rounded border-2 ${
                d.riskIndex >= 66 ? 'border-red-500 bg-red-50' : d.riskIndex >= 34 ? 'border-amber-500 bg-amber-50' : 'border-emerald-500 bg-emerald-50'
              }`}>
                <div className={`text-2xl font-black ${
                  d.riskIndex >= 66 ? 'text-red-600' : d.riskIndex >= 34 ? 'text-amber-600' : 'text-emerald-600'
                }`}>{d.riskIndex}</div>
                <div className={`text-[10px] font-bold ${
                  d.riskIndex >= 66 ? 'text-red-500' : d.riskIndex >= 34 ? 'text-amber-500' : 'text-emerald-500'
                }`}>{riskLabel}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{isHe ? 'מדד סיכון גיאופוליטי' : 'Geopolitical Risk Index'}</div>
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 italic">
            {isHe
              ? `סודי — לשימוש פנימי בלבד. מבוסס על ${d.stories.length > 0 ? '35+' : 'מספר'} מקורות RSS גיאופוליטיים.`
              : `CONFIDENTIAL — For internal use only. Compiled from ${d.stories.length > 0 ? '35+' : 'multiple'} geopolitical RSS sources.`}
          </p>
        </div>

        {/* Section: Top Stories */}
        <section className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            {isHe ? 'סיפורים מובילים' : 'Top Stories'}
            <span className="w-3 h-0.5 bg-gray-400 inline-block" />
          </h2>
          <div className="space-y-4">
            {d.stories.map((story, i) => {
              const headline = getText(story.headline, lang);
              const summary  = getText(story.summary, lang);
              const category = getText(story.category, lang);
              const color = CONFIDENCE_COLOR[story.likelihoodLabel] || '#6b7280';
              const deltaSign = story.delta > 0 ? '+' : '';
              return (
                <div key={story.slug} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{headline}</h3>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {story.isSignal && (
                          <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">SIGNAL</span>
                        )}
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: color + '18' }}>
                          {story.likelihood}%
                        </span>
                        {story.delta !== 0 && (
                          <span className={`text-[9px] font-mono ${story.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {deltaSign}{story.delta}%
                          </span>
                        )}
                      </div>
                    </div>
                    {summary && <p className="text-xs text-gray-600 leading-relaxed mb-1">{summary}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      {category && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>}
                      <span>{story.sources?.length || 0} {isHe ? 'מקורות' : 'sources'}</span>
                    </div>
                    <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${story.likelihood}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Active Shocks */}
        {d.shocks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'זעזועים פעילים' : 'Active Shocks'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="space-y-3">
              {d.shocks.map(shock => {
                const headline  = getText(shock.headline, lang);
                const whatMoved = getText(shock.whatMoved, lang);
                const confColor = shock.confidence === 'high' ? '#ef4444' : shock.confidence === 'medium' ? '#f59e0b' : '#6b7280';
                return (
                  <div key={shock.id} className="flex gap-3 p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="shrink-0 w-1.5 rounded-full self-stretch" style={{ backgroundColor: confColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded"
                          style={{ color: confColor, backgroundColor: confColor + '15' }}>
                          {shockTypeLabel(shock.type)}
                        </span>
                        <span className="text-[9px] text-gray-400 font-medium">{confLabel(shock.confidence)}</span>
                        {shock.delta !== 0 && (
                          <span className={`text-[9px] font-mono ${shock.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {shock.delta > 0 ? '+' : ''}{shock.delta}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{headline}</p>
                      {whatMoved && <p className="text-xs text-gray-500 mt-0.5">{whatMoved}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section: Signal vs Market */}
        {d.topAlpha && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'Signal מול שוק' : 'Signal vs Market Alpha'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="p-4 rounded border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] font-bold text-yellow-700 uppercase mb-1">
                    {isHe ? 'פער אלפא מוביל' : 'Top Alpha Divergence'}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{d.topAlpha.topic}</p>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-black ${d.topAlpha.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {d.topAlpha.delta > 0 ? '+' : ''}{d.topAlpha.delta}%
                  </div>
                  <div className="text-[9px] text-gray-500">{isHe ? 'פער' : 'Delta'}</div>
                </div>
              </div>
              <div className="flex gap-4 text-xs mb-2">
                <div>
                  <span className="text-gray-500">Signal: </span>
                  <span className="font-bold text-yellow-700">{d.topAlpha.signalLikelihood}%</span>
                </div>
                <div>
                  <span className="text-gray-500">{isHe ? 'שוק' : 'Market'}: </span>
                  <span className="font-bold text-blue-700">{d.topAlpha.marketProbability}%</span>
                </div>
                <div>
                  <span className="text-gray-500">{isHe ? 'ציון אלפא' : 'Alpha Score'}: </span>
                  <span className="font-bold text-gray-800">{d.topAlpha.alphaScore}/100</span>
                </div>
              </div>
              {d.topAlpha.whyDifferent && (
                <p className="text-xs text-gray-600 italic">"{d.topAlpha.whyDifferent}"</p>
              )}
            </div>
          </section>
        )}

        {/* Section: Media Blind Spot */}
        {d.biasTop && (
          <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
              {isHe ? 'נקודת עיוורון תקשורתית' : 'Media Blind Spot'}
              <span className="w-3 h-0.5 bg-gray-400 inline-block" />
            </h2>
            <div className="p-3 rounded border border-purple-200 bg-purple-50">
              <p className="text-[10px] font-bold text-purple-700 uppercase mb-0.5">{d.biasTop.topic}</p>
              <p className="text-xs text-gray-700">{d.biasTop.gap}</p>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>⚡ Zikuk — signal-news.vercel.app</span>
            <span>{isHe ? `נוצר: ${d.generatedAtHe}` : `Generated ${d.generatedAt}`}</span>
          </div>
          <p className="text-[9px] text-gray-300 mt-1">
            {isHe
              ? 'ניתוח גיאופוליטי מבוסס מילות מפתח. אינו ייעוץ פיננסי או השקעות.'
              : 'Keyword-based geopolitical intelligence. Not financial or investment advice.'}
          </p>
        </div>
      </div>
    </>
  );
}
