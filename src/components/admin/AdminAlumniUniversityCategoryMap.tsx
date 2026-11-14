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
import { AlumniRecord, AlumniUniversityCategory } from '../../types';
import {
  SCHOOL_ORIGIN_COORDS,
  UNIVERSITY_CATEGORIES,
  UNIVERSITY_CATEGORY_META,
  UniversityCategoryMapNode,
  aggregateAlumniByUniversityCategory,
} from './alumniGeoData';
import { Compass, Globe2, Landmark, Minus, Plus, RotateCcw } from 'lucide-react';
import type { AlumniMapScope } from './AdminAlumniGeoMap';

interface AdminAlumniUniversityCategoryMapProps {
  alumni: AlumniRecord[];
  allAlumniCount: number;
  activeCategoryFilter: 'all' | AlumniUniversityCategory;
  onSelectCategoryFilter: (category: 'all' | AlumniUniversityCategory) => void;
}

const SVG_WIDTH = 760;
const SVG_HEIGHT = 400;

const HOST_COUNTRY_IDS = new Set([
  '360', // Indonesia
  '458', // Malaysia
  '682', // Saudi Arabia
  '818', // Egypt
  '400', // Jordan
  '792', // Turkey
  '702', // Singapore
  '392', // Japan
  '036', // Australia
  '276', // Germany
  '826', // United Kingdom
  '528', // Netherlands
  '840', // United States
]);

function getNodeRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return 9;
  const ratio = Math.sqrt(count / maxCount);
  return 7.5 + ratio * 11;
}

export function AdminAlumniUniversityCategoryMap({
  alumni,
  allAlumniCount,
  activeCategoryFilter,
  onSelectCategoryFilter,
}: AdminAlumniUniversityCategoryMapProps) {
  const [mapScope, setMapScope] = useState<AlumniMapScope>('global');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);

  const { campusNodes, categorySummaries, internationalCount, domesticCount } = useMemo(
    () => aggregateAlumniByUniversityCategory(alumni),
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

    if (mapScope === 'indonesia') {
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
    }

    const globalFocusBounds: GeoPermissibleObjects = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-14, 56],
            [154, 56],
            [154, -40],
            [-14, -40],
            [-14, 56],
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
      const isMalaysia = idStr === '458';
      const isHostCountry = HOST_COUNTRY_IDS.has(idStr);
      return {
        key: `${idStr}-${idx}`,
        d,
        isIndonesia,
        isMalaysia,
        isHostCountry,
      };
    });
  }, [worldFeatures, pathGenerator]);

  const visibleNodes = useMemo(() => {
    return campusNodes
      .map((node) => {
        const pt = projection(node.coords);
        if (!pt) return null;
        const [x, y] = pt;
        const inViewport =
          x >= -15 && x <= SVG_WIDTH + 15 && y >= -15 && y <= SVG_HEIGHT + 15;
        if (mapScope !== 'global' && node.isInternational) return null;
        if (!inViewport) return null;
        return { node, x, y };
      })
      .filter(
        (item): item is { node: UniversityCategoryMapNode; x: number; y: number } =>
          Boolean(item)
      );
  }, [campusNodes, projection, mapScope]);

  const maxNodeCount = useMemo(
    () => Math.max(1, ...visibleNodes.map((v) => v.node.count)),
    [visibleNodes]
  );

  const originPoint = useMemo(() => projection(SCHOOL_ORIGIN_COORDS), [projection]);

  const hoveredItem = useMemo(
    () => visibleNodes.find((v) => v.node.key === hoveredNodeKey) || null,
    [visibleNodes, hoveredNodeKey]
  );

  const isFilteredView = alumni.length !== allAlumniCount;

  const handleScopeChange = (nextScope: AlumniMapScope) => {
    setMapScope(nextScope);
    setZoomLevel(1);
    setHoveredNodeKey(null);
  };

  const zoomTransform = `translate(${SVG_WIDTH / 2}, ${SVG_HEIGHT / 2}) scale(${zoomLevel}) translate(${
    -SVG_WIDTH / 2
  }, ${-SVG_HEIGHT / 2})`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Pemetaan Geografis D3 · Klasifikasi 5 Kategori Perguruan Tinggi</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {domesticCount} Dalam Negeri · {internationalCount} Luar Negeri
            </span>
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
            Peta Sebaran Alumni Berdasarkan Kategori Perguruan Tinggi
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => handleScopeChange('global')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mapScope === 'global'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global (5 Kategori)
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('indonesia')}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mapScope === 'indonesia'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Indonesia (PTN & PTS)
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
          </div>

          {activeCategoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCategoryFilter('all')}
              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Kategori</span>
            </button>
          )}
        </div>
      </div>

      {alumni.length === 0 ? (
        <div className="h-[320px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1.5">
          <Globe2 className="w-8 h-8 text-slate-300" />
          <p className="font-medium text-slate-600">
            Tidak ada data kategori perguruan tinggi alumni untuk dipetakan pada filter saat ini.
          </p>
          <p>Ubah kriteria filter atau reset filter untuk menampilkan peta kategori kampus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: D3 Geo Map by 5 University Categories */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <div className="relative w-full">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto block select-none bg-[#f8fafc]"
                role="img"
                aria-label="Peta interaktif sebaran alumni berdasarkan kategori perguruan tinggi"
              >
                <g transform={zoomTransform}>
                  <path
                    d={graticulePath}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={0.6 / zoomLevel}
                    strokeDasharray="2 2"
                  />

                  {countryPaths.map((c) => {
                    if (!c.d) return null;
                    return (
                      <path
                        key={c.key}
                        d={c.d}
                        fill={
                          c.isIndonesia
                            ? '#dbeafe'
                            : c.isMalaysia
                              ? '#fef3c7'
                              : c.isHostCountry
                                ? '#d1fae5'
                                : '#eef2f6'
                        }
                        stroke={c.isIndonesia ? '#93c5fd' : '#cbd5e1'}
                        strokeWidth={(c.isIndonesia ? 1 : 0.65) / zoomLevel}
                      />
                    );
                  })}

                  {/* Geodesic Arcs from BSD City to Campus */}
                  {visibleNodes.map(({ node }) => {
                    const arcFeature: GeoPermissibleObjects = {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: [SCHOOL_ORIGIN_COORDS, node.coords],
                      },
                    };
                    const arcD = pathGenerator(arcFeature);
                    if (!arcD) return null;
                    const catColor = UNIVERSITY_CATEGORY_META[node.category].color;
                    const isHighlighted =
                      hoveredNodeKey === node.key ||
                      activeCategoryFilter === node.category;

                    return (
                      <path
                        key={`cat-arc-${node.key}`}
                        d={arcD}
                        fill="none"
                        stroke={isHighlighted ? catColor : '#64748b'}
                        strokeWidth={(isHighlighted ? 1.8 : 0.85) / zoomLevel}
                        strokeDasharray="4 3"
                        opacity={
                          activeCategoryFilter !== 'all' &&
                          activeCategoryFilter !== node.category
                            ? 0.14
                            : isHighlighted
                              ? 0.9
                              : 0.32
                        }
                      />
                    );
                  })}

                  {/* School Origin Marker */}
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

                  {/* Category-Colored Campus Markers */}
                  {visibleNodes.map(({ node, x, y }) => {
                    const baseR = getNodeRadius(node.count, maxNodeCount);
                    const r = baseR / Math.pow(zoomLevel, 0.45);
                    const fill = UNIVERSITY_CATEGORY_META[node.category].color;
                    const isSelected = activeCategoryFilter === node.category;
                    const isHovered = hoveredNodeKey === node.key;
                    const dimmed =
                      activeCategoryFilter !== 'all' &&
                      activeCategoryFilter !== node.category;

                    return (
                      <g
                        key={node.key}
                        transform={`translate(${x}, ${y})`}
                        onMouseEnter={() => setHoveredNodeKey(node.key)}
                        onMouseLeave={() => setHoveredNodeKey(null)}
                        onClick={() =>
                          onSelectCategoryFilter(isSelected ? 'all' : node.category)
                        }
                        className="cursor-pointer"
                        opacity={dimmed ? 0.28 : 1}
                      >
                        {(isSelected || isHovered) && (
                          <circle
                            r={r + 4 / zoomLevel}
                            fill="none"
                            stroke={fill}
                            strokeWidth={1.6 / zoomLevel}
                            opacity={0.75}
                          />
                        )}
                        <circle
                          r={r}
                          fill={fill}
                          fillOpacity={0.92}
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
                            {node.count}
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

              {/* Global Scope Reminder if switched to Domestic & International exists */}
              {mapScope !== 'global' && internationalCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleScopeChange('global')}
                  className="absolute bottom-3 left-3 py-1.5 px-3 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="tabular-nums">
                    +{internationalCount} alumni PT Malaysia, Timur Tengah & Luar Negeri · Buka Global
                  </span>
                </button>
              )}

              {/* Hover Tooltip */}
              {hoveredItem && (
                <div
                  className="absolute z-20 pointer-events-none bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs w-72 space-y-1.5"
                  style={{
                    left: `${Math.min(72, Math.max(24, (hoveredItem.x / SVG_WIDTH) * 100))}%`,
                    top: `${Math.min(68, Math.max(14, (hoveredItem.y / SVG_HEIGHT) * 100))}%`,
                    transform: 'translate(-50%, -108%)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              UNIVERSITY_CATEGORY_META[hoveredItem.node.category].color,
                          }}
                        />
                        <span className="truncate">{hoveredItem.node.category}</span>
                      </div>
                      <div className="font-bold text-slate-900 leading-snug mt-0.5">
                        {hoveredItem.node.campusName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hoveredItem.node.city}, {hoveredItem.node.country}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                      {hoveredItem.node.count} Alumni
                    </span>
                  </div>

                  {hoveredItem.node.majors.length > 0 && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 leading-snug">
                      Prodi: {hoveredItem.node.majors.slice(0, 2).join(', ')}
                    </div>
                  )}

                  <div className="space-y-0.5 pt-1 border-t border-slate-100">
                    {hoveredItem.node.alumni.slice(0, 3).map((person) => (
                      <div key={person.id} className="text-[11px] leading-snug truncate tabular-nums">
                        <span className="font-semibold text-slate-800">{person.nama}</span>
                        <span className="text-slate-500">
                          {' '}
                          · Angkatan {person.tahun_lulus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5-Category Legend */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-700">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {UNIVERSITY_CATEGORIES.map((cat) => {
                  const meta = UNIVERSITY_CATEGORY_META[cat];
                  return (
                    <span key={cat} className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-medium">{meta.shortLabel}</span>
                    </span>
                  );
                })}
              </div>
              <span className="text-slate-400">
                Klik titik atau kategori untuk memfilter tabel
              </span>
            </div>
          </div>

          {/* Right: 5 University Categories Interactive Breakdown */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Distribusi 5 Kategori Perguruan Tinggi
              </div>
              <p className="text-[11px] text-slate-500">
                Klik kategori untuk menyaring daftar alumni dan menyorot titik kampusnya di peta.
              </p>
            </div>

            <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
              {categorySummaries.map((item) => {
                const meta = UNIVERSITY_CATEGORY_META[item.category];
                const isSelected = activeCategoryFilter === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() =>
                      onSelectCategoryFilter(isSelected ? 'all' : item.category)
                    }
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="font-semibold leading-snug inline-flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span>{item.category}</span>
                      </span>
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isSelected ? 'text-slate-200' : 'text-slate-700 font-semibold'
                        }`}
                      >
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>

                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isSelected ? 'bg-slate-700' : 'bg-slate-100'
                      }`}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.count > 0 ? Math.max(8, item.percentage) : 0}%`,
                          backgroundColor: meta.color,
                        }}
                      />
                    </div>

                    <div
                      className={`text-[11px] flex items-center justify-between gap-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span className="truncate">
                        {item.campuses.length > 0
                          ? item.campuses.slice(0, 2).join(', ')
                          : meta.description}
                      </span>
                      <span className="tabular-nums shrink-0">
                        {item.campusCount} kampus
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
              <span>Dalam Negeri (PTN/PTS): {domesticCount}</span>
              <span>Luar Negeri: {internationalCount}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
