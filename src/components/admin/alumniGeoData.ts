import { AlumniRecord, AlumniUniversityCategory } from '../../types';

export interface GeoPlaceEntry {
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number]; // [longitude, latitude]
  keywords: string[];
}

export interface ResolvedAlumniGeo {
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
  activityType: 'study' | 'work';
  matched: boolean;
}

export interface CityGeoCluster {
  key: string;
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
  count: number;
  studyCount: number;
  workCount: number;
  mentorCount: number;
  alumni: AlumniRecord[];
}

export interface RegionGeoSummary {
  province: string;
  country: string;
  isInternational: boolean;
  count: number;
  studyCount: number;
  workCount: number;
  percentage: number;
  cities: string[];
}

export const SCHOOL_ORIGIN_COORDS: [number, number] = [106.6635, -6.3019]; // BSD City, Tangerang Selatan

const GEO_PLACES: GeoPlaceEntry[] = [
  // International Hubs (checked first for compound strings like "Madinah / Tangerang")
  {
    city: 'Madinah',
    province: 'Madinah (Arab Saudi)',
    country: 'Arab Saudi',
    isInternational: true,
    coords: [39.6142, 24.5247],
    keywords: ['madinah', 'medina', 'islamic university of madinah', 'universitas islam madinah'],
  },
  {
    city: 'Makkah',
    province: 'Makkah (Arab Saudi)',
    country: 'Arab Saudi',
    isInternational: true,
    coords: [39.8579, 21.3891],
    keywords: ['makkah', 'mekah', 'mecca', 'umm al-qura'],
  },
  {
    city: 'Riyadh',
    province: 'Riyadh (Arab Saudi)',
    country: 'Arab Saudi',
    isInternational: true,
    coords: [46.6753, 24.7136],
    keywords: ['riyadh', 'king saud'],
  },
  {
    city: 'Kairo',
    province: 'Kairo (Mesir)',
    country: 'Mesir',
    isInternational: true,
    coords: [31.2357, 30.0444],
    keywords: ['kairo', 'cairo', 'mesir', 'egypt', 'al-azhar', 'azhar'],
  },
  {
    city: 'Amman',
    province: 'Amman (Yordania)',
    country: 'Yordania',
    isInternational: true,
    coords: [35.9106, 31.9539],
    keywords: ['amman', 'yordania', 'jordan'],
  },
  {
    city: 'Kuala Lumpur',
    province: 'Malaysia',
    country: 'Malaysia',
    isInternational: true,
    coords: [101.6869, 3.139],
    keywords: ['kuala lumpur', 'malaysia', 'iium', 'uiam', 'um malaysia', 'ukm', 'putrajaya', 'cyberjaya'],
  },
  {
    city: 'Singapura',
    province: 'Singapura',
    country: 'Singapura',
    isInternational: true,
    coords: [103.8198, 1.3521],
    keywords: ['singapura', 'singapore', 'nus', 'ntu'],
  },
  {
    city: 'Tokyo',
    province: 'Jepang',
    country: 'Jepang',
    isInternational: true,
    coords: [139.6917, 35.6895],
    keywords: ['tokyo', 'jepang', 'japan', 'osaka', 'kyoto', 'tsukuba'],
  },
  {
    city: 'Istanbul',
    province: 'Turki',
    country: 'Turki',
    isInternational: true,
    coords: [28.9784, 41.0082],
    keywords: ['istanbul', 'ankara', 'turki', 'turkey', 'turkiye'],
  },
  {
    city: 'Melbourne',
    province: 'Australia',
    country: 'Australia',
    isInternational: true,
    coords: [144.9631, -37.8136],
    keywords: ['melbourne', 'sydney', 'australia', 'canberra', 'monash', 'unsw'],
  },
  {
    city: 'Berlin',
    province: 'Jerman',
    country: 'Jerman',
    isInternational: true,
    coords: [13.405, 52.52],
    keywords: ['berlin', 'munich', 'munchen', 'jerman', 'germany', 'aachen'],
  },
  {
    city: 'London',
    province: 'Inggris',
    country: 'Inggris',
    isInternational: true,
    coords: [-0.1276, 51.5072],
    keywords: ['london', 'inggris', 'uk', 'oxford', 'cambridge', 'manchester'],
  },
  {
    city: 'Amsterdam',
    province: 'Belanda',
    country: 'Belanda',
    isInternational: true,
    coords: [4.9041, 52.3676],
    keywords: ['amsterdam', 'delft', 'leiden', 'rotterdam', 'belanda', 'netherlands'],
  },
  {
    city: 'Boston / New York',
    province: 'Amerika Serikat',
    country: 'Amerika Serikat',
    isInternational: true,
    coords: [-71.0589, 42.3601],
    keywords: ['boston', 'new york', 'amerika', 'usa', 'harvard', 'mit', 'stanford', 'berkeley'],
  },
  {
    city: 'Doha',
    province: 'Qatar',
    country: 'Qatar',
    isInternational: true,
    coords: [51.531, 25.2854],
    keywords: ['doha', 'qatar', 'hamad bin khalifa'],
  },
  {
    city: 'Rabat',
    province: 'Maroko',
    country: 'Maroko',
    isInternational: true,
    coords: [-6.8498, 34.0209],
    keywords: ['rabat', 'maroko', 'morocco', 'qarawiyyin', 'mohammed v'],
  },

  // Jabodetabek & Banten
  {
    city: 'Tangerang Selatan',
    province: 'Banten',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.7059, -6.2886],
    keywords: ['tangerang selatan', 'tangsel', 'bsd', 'serpong', 'ciputat', 'pamulang', 'bintaro'],
  },
  {
    city: 'Kota Tangerang',
    province: 'Banten',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.63, -6.1783],
    keywords: ['kota tangerang', 'tangerang', 'karawaci', 'cikokol'],
  },
  {
    city: 'Serang / Cilegon',
    province: 'Banten',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.1503, -6.12],
    keywords: ['serang', 'cilegon', 'banten', 'pandeglang', 'lebak'],
  },
  {
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.8106, -6.2615],
    keywords: ['jakarta selatan', 'jaksel', 'kebayoran', 'tb simatupang', 'sudirman', 'scbd'],
  },
  {
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.8341, -6.1865],
    keywords: ['jakarta pusat', 'jakpus', 'jakarta', 'dki jakarta', 'menteng', 'thamrin'],
  },
  {
    city: 'Jakarta Barat / Utara',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.758, -6.148],
    keywords: ['jakarta barat', 'jakbar', 'jakarta utara', 'jakut', 'jakarta timur', 'jaktim'],
  },
  {
    city: 'Depok',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.8272, -6.3645],
    keywords: ['depok', 'margonda', 'cinere', 'sawangan'],
  },
  {
    city: 'Bogor',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.806, -6.5971],
    keywords: ['bogor', 'cibinong', 'ipb', 'dramaga', 'sentul'],
  },
  {
    city: 'Bekasi',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [107.001, -6.2383],
    keywords: ['bekasi', 'cikarang', 'karawang'],
  },
  {
    city: 'Bandung',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [107.6191, -6.9175],
    keywords: ['bandung', 'sumedang', 'jatinangor', 'cimahi', 'jawa barat', 'itb', 'unpad'],
  },
  {
    city: 'Cirebon / Tasikmalaya',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [108.5523, -6.732],
    keywords: ['cirebon', 'tasikmalaya', 'garut', 'purwakarta', 'subang'],
  },

  // Jawa Tengah, DIY, Jawa Timur
  {
    city: 'Semarang',
    province: 'Jawa Tengah',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.4203, -6.9667],
    keywords: ['semarang', 'undip', 'salatiga', 'jawa tengah', 'pekalongan', 'tegal'],
  },
  {
    city: 'Surakarta / Solo',
    province: 'Jawa Tengah',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.8282, -7.5755],
    keywords: ['solo', 'surakarta', 'uns', 'ums', 'purwokerto', 'magelang', 'unsoed'],
  },
  {
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.3695, -7.7956],
    keywords: ['yogyakarta', 'jogja', 'yogya', 'sleman', 'bantul', 'ugm', 'uii', 'umy'],
  },
  {
    city: 'Surabaya',
    province: 'Jawa Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [112.7521, -7.2575],
    keywords: ['surabaya', 'sidoarjo', 'gresik', 'jawa timur', 'unair'],
  },
  {
    city: 'Malang',
    province: 'Jawa Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [112.6326, -7.9666],
    keywords: ['malang', 'brawijaya', 'batu', 'jember', 'kediri'],
  },

  // Sumatera
  {
    city: 'Banda Aceh',
    province: 'Aceh',
    country: 'Indonesia',
    isInternational: false,
    coords: [95.3238, 5.5483],
    keywords: ['aceh', 'banda aceh', 'lhokseumawe'],
  },
  {
    city: 'Medan',
    province: 'Sumatera Utara',
    country: 'Indonesia',
    isInternational: false,
    coords: [98.6722, 3.5952],
    keywords: ['medan', 'sumatera utara', 'sumut', 'deli serdang', 'usu'],
  },
  {
    city: 'Padang',
    province: 'Sumatera Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [100.4172, -0.9471],
    keywords: ['padang', 'bukittinggi', 'sumatera barat', 'sumbar', 'unand'],
  },
  {
    city: 'Pekanbaru',
    province: 'Riau',
    country: 'Indonesia',
    isInternational: false,
    coords: [101.4478, 0.5071],
    keywords: ['pekanbaru', 'riau', 'batam', 'kepulauan riau', 'kepri', 'dumai'],
  },
  {
    city: 'Palembang',
    province: 'Sumatera Selatan',
    country: 'Indonesia',
    isInternational: false,
    coords: [104.7754, -2.9761],
    keywords: ['palembang', 'sumatera selatan', 'sumsel', 'jambi', 'bengkulu', 'unsri'],
  },
  {
    city: 'Bandar Lampung',
    province: 'Lampung',
    country: 'Indonesia',
    isInternational: false,
    coords: [105.2667, -5.4292],
    keywords: ['lampung', 'bandar lampung', 'unila'],
  },

  // Bali & Nusa Tenggara
  {
    city: 'Denpasar',
    province: 'Bali',
    country: 'Indonesia',
    isInternational: false,
    coords: [115.2126, -8.6705],
    keywords: ['denpasar', 'bali', 'badung', 'udayana'],
  },
  {
    city: 'Mataram / Kupang',
    province: 'Nusa Tenggara',
    country: 'Indonesia',
    isInternational: false,
    coords: [116.1165, -8.5833],
    keywords: ['mataram', 'lombok', 'ntb', 'ntt', 'kupang', 'nusa tenggara'],
  },

  // Kalimantan
  {
    city: 'Balikpapan / Samarinda',
    province: 'Kalimantan Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [116.8312, -1.2379],
    keywords: ['balikpapan', 'samarinda', 'kalimantan timur', 'kaltim', 'nusantara', 'ikn'],
  },
  {
    city: 'Pontianak / Banjarmasin',
    province: 'Kalimantan Barat & Selatan',
    country: 'Indonesia',
    isInternational: false,
    coords: [114.5908, -3.3194],
    keywords: ['pontianak', 'banjarmasin', 'banjarbaru', 'palangkaraya', 'kalimantan'],
  },

  // Sulawesi, Maluku & Papua
  {
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    country: 'Indonesia',
    isInternational: false,
    coords: [119.4327, -5.1477],
    keywords: ['makassar', 'sulawesi selatan', 'sulsel', 'unhas', 'kendari'],
  },
  {
    city: 'Manado / Palu',
    province: 'Sulawesi Utara & Tengah',
    country: 'Indonesia',
    isInternational: false,
    coords: [124.8421, 1.4748],
    keywords: ['manado', 'palu', 'gorontalo', 'sulawesi'],
  },
  {
    city: 'Ambon / Jayapura',
    province: 'Maluku & Papua',
    country: 'Indonesia',
    isInternational: false,
    coords: [140.7181, -2.5916],
    keywords: ['ambon', 'maluku', 'ternate', 'jayapura', 'sorong', 'papua', 'manokwari'],
  },
];

export function resolveAlumniGeo(record: AlumniRecord): ResolvedAlumniGeo {
  const rawCity = (record.kota_domisili || '').trim();
  const combined = `${rawCity} ${record.instansi_atau_kampus || ''} ${record.kampus_diterima || ''}`.toLowerCase();

  const isStudy =
    record.sektor_karier === 'Mahasiswa / Studi Lanjut' ||
    record.profesi_saat_ini.toLowerCase().includes('mahasiswa') ||
    record.profesi_saat_ini.toLowerCase().includes('co-ass') ||
    record.profesi_saat_ini.toLowerCase().includes('santri');
  const activityType: 'study' | 'work' = isStudy ? 'study' : 'work';

  // Match first by raw kota_domisili for highest precision
  const cityLower = rawCity.toLowerCase();
  let match = GEO_PLACES.find((place) =>
    place.keywords.some((kw) => cityLower.includes(kw))
  );

  // Fallback: inspect campus/institution string if city field was generic
  if (!match) {
    match = GEO_PLACES.find((place) =>
      place.keywords.some((kw) => combined.includes(kw))
    );
  }

  if (match) {
    return {
      city: rawCity || match.city,
      province: match.province,
      country: match.country,
      isInternational: match.isInternational,
      coords: match.coords,
      activityType,
      matched: true,
    };
  }

  return {
    city: rawCity || 'Lainnya',
    province: 'Wilayah Lainnya',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.8456, -6.2088],
    activityType,
    matched: false,
  };
}

export function aggregateAlumniGeo(alumni: AlumniRecord[]): {
  cityClusters: CityGeoCluster[];
  regionSummaries: RegionGeoSummary[];
  internationalCount: number;
  domesticCount: number;
} {
  const clusterMap = new Map<string, CityGeoCluster>();
  const regionMap = new Map<string, {
    province: string;
    country: string;
    isInternational: boolean;
    count: number;
    studyCount: number;
    workCount: number;
    cities: Set<string>;
  }>();

  let internationalCount = 0;
  let domesticCount = 0;

  alumni.forEach((item) => {
    const geo = resolveAlumniGeo(item);
    if (geo.isInternational) {
      internationalCount += 1;
    } else {
      domesticCount += 1;
    }

    const clusterKey = `${geo.coords[0].toFixed(2)},${geo.coords[1].toFixed(2)}`;
    const existingCluster = clusterMap.get(clusterKey);
    if (existingCluster) {
      existingCluster.count += 1;
      if (geo.activityType === 'study') existingCluster.studyCount += 1;
      else existingCluster.workCount += 1;
      if (item.bersedia_mentoring) existingCluster.mentorCount += 1;
      existingCluster.alumni.push(item);
    } else {
      clusterMap.set(clusterKey, {
        key: clusterKey,
        city: geo.city,
        province: geo.province,
        country: geo.country,
        isInternational: geo.isInternational,
        coords: geo.coords,
        count: 1,
        studyCount: geo.activityType === 'study' ? 1 : 0,
        workCount: geo.activityType === 'work' ? 1 : 0,
        mentorCount: item.bersedia_mentoring ? 1 : 0,
        alumni: [item],
      });
    }

    const existingReg = regionMap.get(geo.province);
    if (existingReg) {
      existingReg.count += 1;
      if (geo.activityType === 'study') existingReg.studyCount += 1;
      else existingReg.workCount += 1;
      existingReg.cities.add(geo.city);
    } else {
      regionMap.set(geo.province, {
        province: geo.province,
        country: geo.country,
        isInternational: geo.isInternational,
        count: 1,
        studyCount: geo.activityType === 'study' ? 1 : 0,
        workCount: geo.activityType === 'work' ? 1 : 0,
        cities: new Set([geo.city]),
      });
    }
  });

  const total = alumni.length;
  const cityClusters = Array.from(clusterMap.values()).sort((a, b) => b.count - a.count);
  const regionSummaries: RegionGeoSummary[] = Array.from(regionMap.values())
    .map((r) => ({
      province: r.province,
      country: r.country,
      isInternational: r.isInternational,
      count: r.count,
      studyCount: r.studyCount,
      workCount: r.workCount,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      cities: Array.from(r.cities),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    cityClusters,
    regionSummaries,
    internationalCount,
    domesticCount,
  };
}

export interface CampusGeoPlace {
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
  keywords: string[];
}

export interface CampusGeoCluster {
  key: string;
  campusName: string;
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
  count: number;
  percentage: number;
  mentorCount: number;
  ptnOrScholarshipCount: number;
  majors: string[];
  admissionPaths: string[];
  alumni: AlumniRecord[];
}

const CAMPUS_GEO_PLACES: CampusGeoPlace[] = [
  {
    city: 'Depok',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.8272, -6.3628],
    keywords: ['universitas indonesia', '(ui)', 'feui', 'fkui'],
  },
  {
    city: 'Bandung',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [107.6107, -6.8915],
    keywords: ['institut teknologi bandung', '(itb)', 'stei'],
  },
  {
    city: 'Sumedang / Jatinangor',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [107.7747, -6.9261],
    keywords: ['padjadjaran', 'unpad'],
  },
  {
    city: 'Surabaya',
    province: 'Jawa Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [112.7949, -7.2824],
    keywords: ['sepuluh nopember', '(its)'],
  },
  {
    city: 'Surabaya',
    province: 'Jawa Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [112.7586, -7.2721],
    keywords: ['airlangga', 'unair'],
  },
  {
    city: 'Sleman / Yogyakarta',
    province: 'DI Yogyakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.3775, -7.7714],
    keywords: ['gadjah mada', 'ugm'],
  },
  {
    city: 'Bogor',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.7254, -6.5554],
    keywords: ['ipb', 'pertanian bogor'],
  },
  {
    city: 'Malang',
    province: 'Jawa Timur',
    country: 'Indonesia',
    isInternational: false,
    coords: [112.6137, -7.9525],
    keywords: ['brawijaya', '(ub)'],
  },
  {
    city: 'Semarang',
    province: 'Jawa Tengah',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.4396, -7.0507],
    keywords: ['diponegoro', 'undip'],
  },
  {
    city: 'Surakarta / Solo',
    province: 'Jawa Tengah',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.8565, -7.5594],
    keywords: ['sebelas maret', '(uns)'],
  },
  {
    city: 'Tangerang Selatan',
    province: 'Banten',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.7562, -6.3063],
    keywords: ['uin syarif hidayatullah', 'uin jakarta'],
  },
  {
    city: 'BSD City, Tangerang',
    province: 'Banten',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.6494, -6.2241],
    keywords: ['binus', 'bina nusantara', 'prasetiya mulya', 'umn', 'multimedia nusantara'],
  },
  {
    city: 'Bandung Selatan',
    province: 'Jawa Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [107.6303, -6.973],
    keywords: ['telkom university', 'tel-u'],
  },
  {
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [110.4131, -7.6879],
    keywords: ['universitas islam indonesia', 'uii', 'umy', 'muhammadiyah yogyakarta'],
  },
  {
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    country: 'Indonesia',
    isInternational: false,
    coords: [119.4881, -5.1322],
    keywords: ['hasanuddin', 'unhas'],
  },
  {
    city: 'Medan',
    province: 'Sumatera Utara',
    country: 'Indonesia',
    isInternational: false,
    coords: [98.6563, 3.5624],
    keywords: ['sumatera utara', '(usu)'],
  },
  {
    city: 'Padang',
    province: 'Sumatera Barat',
    country: 'Indonesia',
    isInternational: false,
    coords: [100.4616, -0.9144],
    keywords: ['andalas', 'unand'],
  },
  {
    city: 'Palembang',
    province: 'Sumatera Selatan',
    country: 'Indonesia',
    isInternational: false,
    coords: [104.6512, -3.2194],
    keywords: ['sriwijaya', 'unsri'],
  },
  {
    city: 'Madinah',
    province: 'Madinah (Arab Saudi)',
    country: 'Arab Saudi',
    isInternational: true,
    coords: [39.5665, 24.4809],
    keywords: ['universitas islam madinah', 'islamic university of madinah', 'madinah'],
  },
  {
    city: 'Makkah',
    province: 'Makkah (Arab Saudi)',
    country: 'Arab Saudi',
    isInternational: true,
    coords: [39.9462, 21.3267],
    keywords: ['umm al-qura', 'makkah'],
  },
  {
    city: 'Kairo',
    province: 'Kairo (Mesir)',
    country: 'Mesir',
    isInternational: true,
    coords: [31.3145, 30.0566],
    keywords: ['al-azhar', 'cairo university', 'kairo'],
  },
  {
    city: 'Kuala Lumpur',
    province: 'Malaysia',
    country: 'Malaysia',
    isInternational: true,
    coords: [101.7347, 3.2535],
    keywords: ['iium', 'uiam', 'universiti malaya', 'ukm', 'utm', 'malaysia'],
  },
  {
    city: 'Singapura',
    province: 'Singapura',
    country: 'Singapura',
    isInternational: true,
    coords: [103.7764, 1.2966],
    keywords: ['national university of singapore', 'nus', 'ntu', 'singapore'],
  },
  {
    city: 'Tokyo',
    province: 'Jepang',
    country: 'Jepang',
    isInternational: true,
    coords: [139.7619, 35.7127],
    keywords: ['tokyo', 'kyoto', 'osaka', 'tohoku', 'tsukuba', 'waseda'],
  },
  {
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    isInternational: false,
    coords: [106.7989, -6.2356],
    keywords: [
      'al-azhar indonesia',
      'paramadina',
      'bakrie',
      'atma jaya',
      'trisakti',
      'tarumanagara',
      'untar',
      'gunadarma',
      'pelita harapan',
      'uph',
      'parahyangan',
      'unpar',
    ],
  },
  {
    city: 'Melbourne',
    province: 'Australia',
    country: 'Australia',
    isInternational: true,
    coords: [144.9612, -37.7983],
    keywords: ['melbourne', 'monash', 'unsw', 'sydney', 'anu'],
  },
  {
    city: 'Kuala Lumpur',
    province: 'Malaysia',
    country: 'Malaysia',
    isInternational: true,
    coords: [101.7347, 3.2535],
    keywords: [
      'international islamic university malaysia',
      'iium',
      'uiam',
      'universiti malaya',
      'universiti kebangsaan malaysia',
      'ukm',
      'universiti teknologi malaysia',
      'utm',
      'universiti putra malaysia',
      'upm',
      'taylor',
      'sunway',
      'monash malaysia',
      'malaysia',
    ],
  },
];

export function resolveCampusGeo(record: AlumniRecord): {
  campusName: string;
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
} {
  const campusName = (record.kampus_diterima || '').trim() || 'Kampus Belum Diisi';
  const campusLower = campusName.toLowerCase();

  const directMatch = CAMPUS_GEO_PLACES.find((c) =>
    c.keywords.some((kw) => campusLower.includes(kw))
  );
  if (directMatch) {
    return {
      campusName,
      city: directMatch.city,
      province: directMatch.province,
      country: directMatch.country,
      isInternational: directMatch.isInternational,
      coords: directMatch.coords,
    };
  }

  // Fallback to city/province matching from campus string or kota_domisili
  const combinedMatch = GEO_PLACES.find((p) =>
    p.keywords.some((kw) => campusLower.includes(kw))
  );
  if (combinedMatch) {
    return {
      campusName,
      city: combinedMatch.city,
      province: combinedMatch.province,
      country: combinedMatch.country,
      isInternational: combinedMatch.isInternational,
      coords: combinedMatch.coords,
    };
  }

  const fallbackDomicile = resolveAlumniGeo(record);
  return {
    campusName,
    city: fallbackDomicile.city,
    province: fallbackDomicile.province,
    country: fallbackDomicile.country,
    isInternational: fallbackDomicile.isInternational,
    coords: fallbackDomicile.coords,
  };
}

export function aggregateAlumniByCampus(alumni: AlumniRecord[]): {
  campusClusters: CampusGeoCluster[];
  internationalCount: number;
  domesticCount: number;
} {
  const grouped = new Map<
    string,
    {
      campusName: string;
      city: string;
      province: string;
      country: string;
      isInternational: boolean;
      coords: [number, number];
      mentorCount: number;
      ptnOrScholarshipCount: number;
      majors: Set<string>;
      admissionPaths: Set<string>;
      alumni: AlumniRecord[];
    }
  >();

  let internationalCount = 0;
  let domesticCount = 0;

  alumni.forEach((item) => {
    const geo = resolveCampusGeo(item);
    if (geo.isInternational) {
      internationalCount += 1;
    } else {
      domesticCount += 1;
    }

    const key = geo.campusName;
    const isPtnOrScholarship =
      item.jalur_masuk_kampus === 'SNBP' ||
      item.jalur_masuk_kampus === 'SNBT / UTBK' ||
      item.jalur_masuk_kampus.startsWith('Beasiswa');

    const existing = grouped.get(key);
    if (existing) {
      if (item.bersedia_mentoring) existing.mentorCount += 1;
      if (isPtnOrScholarship) existing.ptnOrScholarshipCount += 1;
      if (item.jurusan_diterima) existing.majors.add(item.jurusan_diterima);
      if (item.jalur_masuk_kampus) existing.admissionPaths.add(item.jalur_masuk_kampus);
      existing.alumni.push(item);
    } else {
      grouped.set(key, {
        campusName: geo.campusName,
        city: geo.city,
        province: geo.province,
        country: geo.country,
        isInternational: geo.isInternational,
        coords: geo.coords,
        mentorCount: item.bersedia_mentoring ? 1 : 0,
        ptnOrScholarshipCount: isPtnOrScholarship ? 1 : 0,
        majors: new Set(item.jurusan_diterima ? [item.jurusan_diterima] : []),
        admissionPaths: new Set(item.jalur_masuk_kampus ? [item.jalur_masuk_kampus] : []),
        alumni: [item],
      });
    }
  });

  const total = alumni.length;
  const campusClusters: CampusGeoCluster[] = Array.from(grouped.values())
    .map((entry) => ({
      key: entry.campusName,
      campusName: entry.campusName,
      city: entry.city,
      province: entry.province,
      country: entry.country,
      isInternational: entry.isInternational,
      coords: entry.coords,
      count: entry.alumni.length,
      percentage: total > 0 ? Math.round((entry.alumni.length / total) * 100) : 0,
      mentorCount: entry.mentorCount,
      ptnOrScholarshipCount: entry.ptnOrScholarshipCount,
      majors: Array.from(entry.majors),
      admissionPaths: Array.from(entry.admissionPaths),
      alumni: entry.alumni,
    }))
    .sort((a, b) => b.count - a.count || a.campusName.localeCompare(b.campusName));

  return {
    campusClusters,
    internationalCount,
    domesticCount,
  };
}

export const UNIVERSITY_CATEGORIES: AlumniUniversityCategory[] = [
  'Perguruan Tinggi Negeri',
  'Perguruan Tinggi Swasta',
  'Perguruan Tinggi Malaysia',
  'Perguruan Tinggi Timur Tengah',
  'Perguruan Tinggi Luar Negeri Lainnya',
];

export const UNIVERSITY_CATEGORY_META: Record<
  AlumniUniversityCategory,
  {
    color: string;
    shortLabel: string;
    description: string;
  }
> = {
  'Perguruan Tinggi Negeri': {
    color: '#2563eb',
    shortLabel: 'PT Negeri (PTN)',
    description: 'UI, ITB, ITS, UGM, Unpad, Undip, Kedinasan',
  },
  'Perguruan Tinggi Swasta': {
    color: '#7c3aed',
    shortLabel: 'PT Swasta (PTS)',
    description: 'Binus, Telkom Univ, UMN, Prasetiya Mulya, UII',
  },
  'Perguruan Tinggi Malaysia': {
    color: '#d97706',
    shortLabel: 'PT Malaysia',
    description: 'IIUM / UIAM, Universiti Malaya, UKM, UTM',
  },
  'Perguruan Tinggi Timur Tengah': {
    color: '#059669',
    shortLabel: 'PT Timur Tengah',
    description: 'Univ. Islam Madinah, Al-Azhar Kairo, Yordania, Turki',
  },
  'Perguruan Tinggi Luar Negeri Lainnya': {
    color: '#e11d48',
    shortLabel: 'PT Luar Negeri Lainnya',
    description: 'Singapura, Jepang, Australia, Eropa & Amerika',
  },
};

const MALAYSIA_KEYWORDS = [
  'malaysia',
  'iium',
  'uiam',
  'international islamic university malaysia',
  'universiti malaya',
  'universiti kebangsaan',
  'universiti teknologi malaysia',
  'universiti putra',
  'universiti sains malaysia',
  'taylor',
  'sunway',
  'kuala lumpur',
  'putrajaya',
  'cyberjaya',
  'monash malaysia',
  'utm malaysia',
  'ukm malaysia',
];

const MIDDLE_EAST_KEYWORDS = [
  'madinah',
  'medina',
  'makkah',
  'mekah',
  'umm al-qura',
  'riyadh',
  'king saud',
  'arab saudi',
  'saudi',
  'al-azhar',
  'cairo',
  'kairo',
  'mesir',
  'egypt',
  'yordania',
  'jordan',
  'amman',
  'maroko',
  'morocco',
  'qarawiyyin',
  'qatar',
  'doha',
  'emirat',
  'dubai',
  'kuwait',
  'turki',
  'turkey',
  'turkiye',
  'istanbul',
  'ankara',
  'lipia',
  'timur tengah',
];

const OTHER_INTERNATIONAL_KEYWORDS = [
  'singapura',
  'singapore',
  'national university of singapore',
  'nus',
  'ntu',
  'nanyang',
  'jepang',
  'japan',
  'tokyo',
  'kyoto',
  'osaka',
  'tohoku',
  'waseda',
  'tsukuba',
  'australia',
  'melbourne',
  'monash',
  'unsw',
  'sydney',
  'anu',
  'jerman',
  'germany',
  'berlin',
  'munich',
  'aachen',
  'inggris',
  'uk',
  'london',
  'oxford',
  'cambridge',
  'manchester',
  'belanda',
  'netherlands',
  'amsterdam',
  'delft',
  'leiden',
  'amerika',
  'usa',
  'harvard',
  'stanford',
  'mit',
  'korea',
  'kaist',
  'seoul',
];

const PRIVATE_INDONESIA_KEYWORDS = [
  'binus',
  'bina nusantara',
  'telkom',
  'tel-u',
  'prasetiya mulya',
  'multimedia nusantara',
  'umn',
  'trisakti',
  'tarumanagara',
  'untar',
  'pelita harapan',
  'uph',
  'universitas islam indonesia',
  'uii',
  'muhammadiyah',
  'umy',
  'ums',
  'umm',
  'gunadarma',
  'paramadina',
  'bakrie',
  'atma jaya',
  'parahyangan',
  'unpar',
  'al-azhar indonesia',
  'uai',
  'mercu buana',
  'esa unggul',
  'pancasila',
  'president university',
  'ciputra',
  'petra',
  'maranatha',
  'kalbis',
  'tazkia',
  'swasta',
];

const PUBLIC_INDONESIA_KEYWORDS = [
  'universitas indonesia',
  '(ui)',
  'institut teknologi bandung',
  '(itb)',
  'institut teknologi sepuluh nopember',
  '(its)',
  'gadjah mada',
  'ugm',
  'padjadjaran',
  'unpad',
  'diponegoro',
  'undip',
  'airlangga',
  'unair',
  'brawijaya',
  '(ub)',
  'sebelas maret',
  '(uns)',
  'ipb',
  'hasanuddin',
  'unhas',
  'sumatera utara',
  '(usu)',
  'andalas',
  'unand',
  'sriwijaya',
  'unsri',
  'udayana',
  'uin ',
  'universitas negeri',
  'politeknik negeri',
  'stan',
  'stis',
  'ipdn',
];

export function inferUniversityCategory(
  kampusDiterima: string,
  jalurMasuk?: string,
  kotaDomisili?: string
): AlumniUniversityCategory {
  const campusLower = (kampusDiterima || '').toLowerCase();
  const jalurLower = (jalurMasuk || '').toLowerCase();
  const cityLower = (kotaDomisili || '').toLowerCase();
  const combined = `${campusLower} ${cityLower}`.trim();

  if (MALAYSIA_KEYWORDS.some((kw) => combined.includes(kw))) {
    return 'Perguruan Tinggi Malaysia';
  }

  // Check Al-Azhar Indonesia specifically before Al-Azhar Cairo
  if (
    campusLower.includes('al-azhar indonesia') ||
    PRIVATE_INDONESIA_KEYWORDS.some((kw) => campusLower.includes(kw))
  ) {
    return 'Perguruan Tinggi Swasta';
  }

  if (MIDDLE_EAST_KEYWORDS.some((kw) => combined.includes(kw))) {
    return 'Perguruan Tinggi Timur Tengah';
  }

  if (OTHER_INTERNATIONAL_KEYWORDS.some((kw) => combined.includes(kw))) {
    return 'Perguruan Tinggi Luar Negeri Lainnya';
  }

  if (PUBLIC_INDONESIA_KEYWORDS.some((kw) => campusLower.includes(kw))) {
    return 'Perguruan Tinggi Negeri';
  }

  if (
    jalurLower.includes('snbp') ||
    jalurLower.includes('snbt') ||
    jalurLower.includes('utbk') ||
    jalurLower.includes('kedinasan')
  ) {
    return 'Perguruan Tinggi Negeri';
  }

  if (jalurLower.includes('timur tengah')) {
    return 'Perguruan Tinggi Timur Tengah';
  }

  return 'Perguruan Tinggi Negeri';
}

export function resolveAlumniUniversityCategory(
  record: AlumniRecord
): AlumniUniversityCategory {
  if (
    record.kategori_perguruan_tinggi &&
    UNIVERSITY_CATEGORIES.includes(record.kategori_perguruan_tinggi)
  ) {
    return record.kategori_perguruan_tinggi;
  }
  return inferUniversityCategory(
    record.kampus_diterima,
    record.jalur_masuk_kampus,
    record.kota_domisili
  );
}

export interface UniversityCategoryMapNode {
  key: string;
  campusName: string;
  category: AlumniUniversityCategory;
  city: string;
  province: string;
  country: string;
  isInternational: boolean;
  coords: [number, number];
  count: number;
  majors: string[];
  alumni: AlumniRecord[];
}

export interface UniversityCategorySummary {
  category: AlumniUniversityCategory;
  count: number;
  percentage: number;
  campusCount: number;
  campuses: string[];
}

export function aggregateAlumniByUniversityCategory(alumni: AlumniRecord[]): {
  campusNodes: UniversityCategoryMapNode[];
  categorySummaries: UniversityCategorySummary[];
  internationalCount: number;
  domesticCount: number;
} {
  const nodeMap = new Map<
    string,
    {
      key: string;
      campusName: string;
      category: AlumniUniversityCategory;
      city: string;
      province: string;
      country: string;
      isInternational: boolean;
      coords: [number, number];
      majors: Set<string>;
      alumni: AlumniRecord[];
    }
  >();

  const summaryMap = new Map<
    AlumniUniversityCategory,
    {
      count: number;
      campuses: Set<string>;
    }
  >();

  UNIVERSITY_CATEGORIES.forEach((cat) => {
    summaryMap.set(cat, { count: 0, campuses: new Set<string>() });
  });

  let internationalCount = 0;
  let domesticCount = 0;

  alumni.forEach((item) => {
    const category = resolveAlumniUniversityCategory(item);
    const geo = resolveCampusGeo(item);
    const isIntlCategory =
      category === 'Perguruan Tinggi Malaysia' ||
      category === 'Perguruan Tinggi Timur Tengah' ||
      category === 'Perguruan Tinggi Luar Negeri Lainnya' ||
      geo.isInternational;

    if (isIntlCategory) {
      internationalCount += 1;
    } else {
      domesticCount += 1;
    }

    const catBucket = summaryMap.get(category)!;
    catBucket.count += 1;
    if (geo.campusName) {
      catBucket.campuses.add(geo.campusName);
    }

    const nodeKey = `${geo.campusName}::${category}`;
    const existing = nodeMap.get(nodeKey);
    if (existing) {
      if (item.jurusan_diterima) existing.majors.add(item.jurusan_diterima);
      existing.alumni.push(item);
    } else {
      nodeMap.set(nodeKey, {
        key: nodeKey,
        campusName: geo.campusName,
        category,
        city: geo.city,
        province: geo.province,
        country: geo.country,
        isInternational: isIntlCategory,
        coords: geo.coords,
        majors: new Set(item.jurusan_diterima ? [item.jurusan_diterima] : []),
        alumni: [item],
      });
    }
  });

  const total = alumni.length;
  const campusNodes: UniversityCategoryMapNode[] = Array.from(nodeMap.values())
    .map((entry) => ({
      key: entry.key,
      campusName: entry.campusName,
      category: entry.category,
      city: entry.city,
      province: entry.province,
      country: entry.country,
      isInternational: entry.isInternational,
      coords: entry.coords,
      count: entry.alumni.length,
      majors: Array.from(entry.majors),
      alumni: entry.alumni,
    }))
    .sort((a, b) => b.count - a.count || a.campusName.localeCompare(b.campusName));

  const categorySummaries: UniversityCategorySummary[] = UNIVERSITY_CATEGORIES.map((cat) => {
    const bucket = summaryMap.get(cat)!;
    return {
      category: cat,
      count: bucket.count,
      percentage: total > 0 ? Math.round((bucket.count / total) * 100) : 0,
      campusCount: bucket.campuses.size,
      campuses: Array.from(bucket.campuses),
    };
  });

  return {
    campusNodes,
    categorySummaries,
    internationalCount,
    domesticCount,
  };
}


