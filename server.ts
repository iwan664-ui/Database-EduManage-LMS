import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Proxy endpoint for Google Apps Script Web App (avoiding CORS or network quirks in iframe)
app.post('/api/sheets-proxy', async (req, res) => {
  try {
    const { url, action, payload } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Target URL is required' });
    }

    const targetUrl = new URL(url);
    if (action) {
      targetUrl.searchParams.set('action', action);
    }

    const fetchOptions: RequestInit = {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    } else {
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      } catch {
        return res.json({ success: response.ok, raw: text });
      }
    }
  } catch (error: any) {
    console.error('Error proxying to Google Sheets:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to connect to Google Sheets' });
  }
});

// AI Insight analysis endpoint
app.post('/api/ai-insight', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum dikonfigurasi di environment server.',
      });
    }

    const { className, subject, month, year, attendanceSummary, gradeSummary, studentsData } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Anda adalah seorang Konsultan Pendidikan & Analis Akademik Senior untuk AL-WILDAN ISLAMIC SCHOOL 29 KOTA DEPOK.
Analisis data akademik kelas berikut ini dan berikan kesimpulan, evaluasi tren (naik/turun/stagnan), serta rekomendasi praktis bernilai edukatif dan berkarakter Islami.

DATA AKADEMIK KELAS:
- Kelas: ${className || 'Semua Kelas'}
- Mata Pelajaran: ${subject || 'Semua Mapel'}
- Periode: ${month || 'Bulan Berjalan'} ${year || new Date().getFullYear()}
- Ringkasan Kehadiran:
  * Total Presensi Tercatat: ${attendanceSummary?.total || 0}
  * Hadir: ${attendanceSummary?.hadir || 0} (${attendanceSummary?.hadirPercent || 0}%)
  * Izin: ${attendanceSummary?.izin || 0}
  * Sakit: ${attendanceSummary?.sakit || 0}
  * Alfa/Tanpa Keterangan: ${attendanceSummary?.alfa || 0}
- Ringkasan Nilai:
  * Rata-rata Nilai: ${gradeSummary?.average || 0} (KKM: 75)
  * Nilai Tertinggi: ${gradeSummary?.highest || 0}
  * Nilai Terendah: ${gradeSummary?.lowest || 0}
  * Persentase Tuntas (>= 75): ${gradeSummary?.passRate || 0}%
  * Total Penilaian: ${gradeSummary?.totalEntries || 0}
- Detail Siswa (Sampel):
${JSON.stringify(studentsData || [], null, 2)}

INSTRUKSI OUTPUT:
Harap berikan respons dalam format JSON valid (tanpa markdown wrapper tambahan di luar format json) dengan struktur berikut:
{
  "statusTrend": "Naik" | "Turun" | "Stagnan" | "Optimal",
  "trendSummary": "Ringkasan 2-3 kalimat mengenai performa akademik dan dinamika kehadiran siswa.",
  "keyHighlights": [
    "Poin keunggulan atau kemajuan spesifik yang dicapai",
    "Poin korelasi kehadiran dan capaian nilai",
    "Temuan penting dari sebaran nilai siswa"
  ],
  "topAchievers": [
    "Nama siswa berprestasi tinggi dan kelebihannya"
  ],
  "needsAttention": [
    "Nama siswa yang butuh perhatian khusus/remedial beserta catatan kendalanya"
  ],
  "actionableRecommendations": [
    "Rekomendasi taktis untuk Tutor pengampu kelas",
    "Rekomendasi untuk Manajemen/Admin/Wali Murid",
    "Saran metode belajar atau remedial terfokus"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fences if any
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      insight: parsedResult,
    });
  } catch (error: any) {
    console.error('AI Insight generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal menghasilkan AI Insight',
    });
  }
});

// Dev or production setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
