import React, { useMemo, useState } from 'react';
import {
  GeoPermissibleObjects,
  geoGraticule10,
  geoMercator,
  geoNaturalEarth1,
  geoPath,
} from 'd3-geo';
import { feature } from 'topojson-client';
import countriesAtlas from 'world-atlas/countries-50m.json';
import { AlumniRecord } from '../../types';
import {
  CityGeoCluster,
  SCHOOL_ORIGIN_COORDS,
  aggregateAlumniGeo,
} from './alumniGeoData';
import { Compass, Globe2, MapPin, Minus, Plus, RotateCcw } from 'lucide-react';

export type AlumniMapScope = 'indonesia' | 'jawa' | 'global';

interface AdminAlumniGeoMapProps {
  alumni: AlumniRecord[];
  allAlumniCount: number;
  activeRegionFilter: string;
  onSelectRegionFilter: (province: string) => void;
}

const SVG_WIDTH = 760;
const SVG_HEIGHT = 400;

const HOST_COUNTRY_IDS = new Set([
  '360', // Indonesia
  '682', // Saudi Arabia
  '818', // Egypt
  '458', // Malaysia
  '702', // Singapore
  '392', // Japan
  '036', // Australia
  '792', // Turkey
  '276', // Germany
  '826', // United Kingdom
  '400', // Jordan
]);

function getClusterFill(cluster: CityGeoCluster): string {
  if (cluster.studyCount > 0 && cluster.workCount > 0) {
    return '#7c3aed'; // Campuran Studi & Kerja
  }
  return cluster.studyCount >= cluster.workCount ? '#2563eb' : '#059669';
}

function getClusterRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return 9.5;
  const ratio = Math.sqrt(count / maxCount);
  return 7.5 + ratio * 11.5;
}

export function AdminAlumniGeoMap({
  alumni,
  allAlumniCount,
  activeRegionFilter,
  onSelectRegionFilter,
}: AdminAlumniGeoMapProps) {
  const [mapScope, setMapScope] = useState<AlumniMapScope>('indonesia');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredClusterKey, setHoveredClusterKey] = useState<string | null>(null);

  const { cityClusters, regionSummaries, internationalCount, domesticCount } = useMemo(
    () => aggregateAlumniGeo(alumni),
    [alumni]
  );

  const worldFeatures = useMemo(() => {
    const topology = countriesAtlas as unknown as Parameters<typeof feature>[0] & {
      objects: { countries: Parameters<typeof feature>[1] };
    };
    const geo = feature(topology, topology.objects.countries) as unknown as {
      type: 'FeatureCollection';
      features: Array<{
        type: 'Feature';
        id?: string | number;
        properties?: { name?: string };
        geometry: GeoPermissibleObjects;
      }>;
    };
    return geo.features || [];
  }, []);

  const projection = useMemo(() => {
    if (mapScope === 'jawa') {
      const jawaBounds: GeoPermissibleObjects = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [105.0, -5.3],
              [115.2, -5.3],
              [115.2, -8.9],
              [105.0, -8.9],
              [105.0, -5.3],
            ],
          ],
        },
      };
      return geoMercator().fitExtent(
        [
          [24, 24],
          [SVG_WIDTH - 24, SVG_HEIGHT - 24],
        ],
        jawaBounds
      );
    }

    if (mapScope === 'global') {
      const globalFocusBounds: GeoPermissibleObjects = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-12, 56],
              [152, 56],
              [152, -40],
              [-12, -40],
              [-12, 56],
            ],
          ],
        },
      };
      return geoNaturalEarth1().fitExtent(
        [
          [16, 16],
          [SVG_WIDTH - 16, SVG_HEIGHT - 16],
        ],
        globalFocusBounds
      );
    }

    // Default: Seluruh Nusantara (Indonesia)
    const indonesiaBounds: GeoPermissibleObjects = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [94.5, 6.4],
            [141.5, 6.4],
            [141.5, -11.3],
            [94.5, -11.3],
            [94.5, 6.4],
          ],
        ],
      },
    };
    return geoMercator().fitExtent(
      [
        [18, 18],
        [SVG_WIDTH - 18, SVG_HEIGHT - 18],
      ],
      indonesiaBounds
    );
  }, [mapScope]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const graticulePath = useMemo(
    () => pathGenerator(geoGraticule10()) || '',
    [pathGenerator]
  );

  const countryPaths = useMemo(() => {
    return worldFeatures.map((feat, idx) => {
      const idStr = String(feat.id ?? idx).padStart(3, '0');
      const d = pathGenerator(feat as unknown as GeoPermissibleObjects) || '';
      const isIndonesia = idStr === '360';
      const isHostCountry = HOST_COUNTRY_IDS.has(idStr);
      return {
        key: `${idStr}-${idx}`,
        d,
        isIndonesia,
        isHostCountry,
      };
    });
  }, [worldFeatures, pathGenerator]);

  const visibleClusters = useMemo(() => {
    const projected = cityClusters
      .map((cluster) => {
        const pt = projection(cluster.coords);
        if (!pt) return null;
        const [x, y] = pt;
        const inViewport = x >= -15 && x <= SVG_WIDTH + 15 && y >= -15 && y <= SVG_HEIGHT + 15;
        if (mapScope !== 'global' && cluster.isInternational) return null;
        if (!inViewport) return null;
        return {
          cluster,
          x,
          y,
        };
      })
      .filter((item): item is { cluster: CityGeoCluster; x: number; y: number } => Boolean(item));
    return projected;
  }, [cityClusters, projection, mapScope]);

  const maxClusterCount = useMemo(
    () => Math.max(1, ...visibleClusters.map((v) => v.cluster.count)),
    [visibleClusters]
  );

  const originPoint = useMemo(() => projection(SCHOOL_ORIGIN_COORDS), [projection]);

  const hoveredItem = useMemo(
    () => visibleClusters.find((v) => v.cluster.key === hoveredClusterKey) || null,
    [visibleClusters, hoveredClusterKey]
  );

  const isFilteredView = alumni.length !== allAlumniCount;

  const handleScopeChange = (nextScope: AlumniMapScope) => {
    setMapScope(nextScope);
    setZoomLevel(1);
    setHoveredClusterKey(null);
  };

  // Scale around SVG center for crisp zoom controls
  const zoomTransform = `translate(${SVG_WIDTH / 2}, ${SVG_HEIGHT / 2}) scale(${zoomLevel}) translate(${
    -SVG_WIDTH / 2
  }, ${-SVG_HEIGHT / 2})`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pemetaan Geografis D3 · Kota & Provinsi Studi / Kerja</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{cityClusters.length} Titik Kota</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{regionSummaries.length} Provinsi / Negara</span>
            {isFilteredView && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  {alumni.length} Alumni Terfilter
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Peta Sebaran Lokasi Alumni
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Scope Tabs */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleScopeChange('indonesia')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mapScope === 'indonesia'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Indonesia ({domesticCount})
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('jawa')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mapScope === 'jawa'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fokus Jawa & Jabodetabek
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('global')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mapScope === 'global'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global{internationalCount > 0 ? ` (${internationalCount} Luar Negeri)` : ''}
            </button>
          </div>

          {activeRegionFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectRegionFilter('all')}
              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Wilayah</span>
            </button>
          )}
        </div>
      </div>

      {alumni.length === 0 ? (
        <div className="h-[320px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1.5">
          <MapPin className="w-8 h-8 text-slate-300" />
          <p className="font-medium text-slate-600">
            Tidak ada lokasi alumni yang dapat dipetakan pada filter saat ini.
          </p>
          <p>Ubah kriteria pencarian atau reset filter untuk melihat peta sebaran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: D3 Geo Map Viewport */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <div className="relative w-full">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto block select-none bg-[#f8fafc]"
                role="img"
                aria-label="Peta interaktif sebaran lokasi studi dan karier alumni"
              >
                <g transform={zoomTransform}>
                  {/* Cartographic Graticule */}
                  <path
                    d={graticulePath}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={0.6 / zoomLevel}
                    strokeDasharray="2 2"
                  />

                  {/* Country Polygons */}
                  {countryPaths.map((c) => {
                    if (!c.d) return null;
                    return (
                      <path
                        key={c.key}
                        d={c.d}
                        fill={
                          c.isIndonesia
                            ? '#e2f2eb'
                            : c.isHostCountry && mapScope === 'global'
                              ? '#e0e7ff'
                              : '#eef2f6'
                        }
                        stroke={c.isIndonesia ? '#6ee7b7' : '#cbd5e1'}
                        strokeWidth={(c.isIndonesia ? 1 : 0.65) / zoomLevel}
                      />
                    );
                  })}

                  {/* Geodesic Connection Arcs from BSD City Origin */}
                  {visibleClusters.map(({ cluster }) => {
                    const arcFeature: GeoPermissibleObjects = {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: [SCHOOL_ORIGIN_COORDS, cluster.coords],
                      },
                    };
                    const arcD = pathGenerator(arcFeature);
                    if (!arcD) return null;
                    const isHighlighted =
                      hoveredClusterKey === cluster.key ||
                      activeRegionFilter === cluster.province;

                    return (
                      <path
                        key={`arc-${cluster.key}`}
                        d={arcD}
                        fill="none"
                        stroke={isHighlighted ? '#2563eb' : '#64748b'}
                        strokeWidth={(isHighlighted ? 1.8 : 0.9) / zoomLevel}
                        strokeDasharray="4 3"
                        opacity={isHighlighted ? 0.85 : 0.3}
                      />
                    );
                  })}

                  {/* School Origin Marker (AL-WILDAN 3 BSD CITY) */}
                  {originPoint && (
                    <g transform={`translate(${originPoint[0]}, ${originPoint[1]})`}>
                      <polygon
                        points={`0,${-6 / zoomLevel} ${6 / zoomLevel},0 0,${6 / zoomLevel} ${
                          -6 / zoomLevel
                        },0`}
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth={1.5 / zoomLevel}
                      />
                    </g>
                  )}

                  {/* Alumni City Proportional Markers */}
                  {visibleClusters.map(({ cluster, x, y }) => {
                    const baseR = getClusterRadius(cluster.count, maxClusterCount);
                    const r = baseR / Math.pow(zoomLevel, 0.45);
                    const fill = getClusterFill(cluster);
                    const isSelected = activeRegionFilter === cluster.province;
                    const isHovered = hoveredClusterKey === cluster.key;
                    const dimmed =
                      activeRegionFilter !== 'all' && activeRegionFilter !== cluster.province;

                    return (
                      <g
                        key={cluster.key}
                        transform={`translate(${x}, ${y})`}
                        onMouseEnter={() => setHoveredClusterKey(cluster.key)}
                        onMouseLeave={() => setHoveredClusterKey(null)}
                        onClick={() =>
                          onSelectRegionFilter(
                            isSelected ? 'all' : cluster.province
                          )
                        }
                        className="cursor-pointer"
                        opacity={dimmed ? 0.35 : 1}
                      >
                        {(isSelected || isHovered) && (
                          <circle
                            r={r + 4 / zoomLevel}
                            fill="none"
                            stroke={fill}
                            strokeWidth={1.6 / zoomLevel}
                            opacity={0.7}
                          />
                        )}
                        <circle
                          r={r}
                          fill={fill}
                          fillOpacity={0.88}
                          stroke="#ffffff"
                          strokeWidth={1.8 / zoomLevel}
                        />
                        {baseR >= 8 && (
                          <text
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize={10 / Math.pow(zoomLevel, 0.4)}
                            fontWeight={700}
                            style={{ pointerEvents: 'none' }}
                          >
                            {cluster.count}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Floating Zoom Controls */}
              <div className="absolute top-3 right-3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.6, Number((z + 0.4).toFixed(1))))}
                  title="Perbesar Peta"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.4).toFixed(1))))}
                  title="Perkecil Peta"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-b border-slate-100 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  title="Reset Zoom"
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* International Helper Prompt when viewing domestic scope */}
              {mapScope !== 'global' && internationalCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleScopeChange('global')}
                  className="absolute bottom-3 left-3 py-1.5 px-3 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="tabular-nums">
                    +{internationalCount} alumni di luar negeri · Buka Peta Global
                  </span>
                </button>
              )}

              {/* Hover Tooltip */}
              {hoveredItem && (
                <div
                  className="absolute z-20 pointer-events-none bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs w-64 space-y-1.5"
                  style={{
                    left: `${Math.min(72, Math.max(24, (hoveredItem.x / SVG_WIDTH) * 100))}%`,
                    top: `${Math.min(68, Math.max(14, (hoveredItem.y / SVG_HEIGHT) * 100))}%`,
                    transform: 'translate(-50%, -108%)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{hoveredItem.cluster.city}</div>
                      <div className="text-[11px] text-slate-500">
                        {hoveredItem.cluster.province}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                      {hoveredItem.cluster.count} Alumni
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-2 pt-1 border-t border-slate-100 tabular-nums">
                    <span>Studi: {hoveredItem.cluster.studyCount}</span>
                    <span aria-hidden="true">·</span>
                    <span>Kerja: {hoveredItem.cluster.workCount}</span>
                    <span aria-hidden="true">·</span>
                    <span>Mentor: {hoveredItem.cluster.mentorCount}</span>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    {hoveredItem.cluster.alumni.slice(0, 3).map((person) => (
                      <div key={person.id} className="text-[11px] leading-snug truncate">
                        <span className="font-semibold text-slate-800">{person.nama}</span>
                        <span className="text-slate-500">
                          {' '}
                          · {person.instansi_atau_kampus || person.kampus_diterima}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map Footer Legend */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                  <span>Dominan Studi Lanjut</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0" />
                  <span>Dominan Bekerja</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shrink-0" />
                  <span>Studi & Bekerja</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-slate-900 shrink-0" />
                  <span>Kampus Asal (BSD City)</span>
                </span>
              </div>
              <span className="text-slate-400">
                Klik titik kota untuk memfilter tabel
              </span>
            </div>
          </div>

          {/* Right: Ranking Provinsi / Wilayah */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Sebaran Provinsi & Wilayah
              </div>
              <p className="text-[11px] text-slate-500">
                Klik wilayah untuk menyaring daftar alumni pada tabel di bawah.
              </p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {regionSummaries.map((region) => {
                const isSelected = activeRegionFilter === region.province;
                return (
                  <button
                    key={region.province}
                    type="button"
                    onClick={() =>
                      onSelectRegionFilter(isSelected ? 'all' : region.province)
                    }
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold truncate">{region.province}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isSelected ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {region.count} ({region.percentage}%)
                      </span>
                    </div>

                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isSelected ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full ${
                          isSelected
                            ? 'bg-emerald-400'
                            : region.isInternational
                              ? 'bg-indigo-600'
                              : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.max(8, region.percentage)}%` }}
                      />
                    </div>

                    <div
                      className={`text-[11px] flex items-center justify-between gap-2 tabular-nums ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span className="truncate">{region.cities.join(', ')}</span>
                      <span className="shrink-0">
                        {region.studyCount} Studi · {region.workCount} Kerja
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
              <span>Domestik: {domesticCount} alumni</span>
              <span>Luar Negeri: {internationalCount} alumni</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
