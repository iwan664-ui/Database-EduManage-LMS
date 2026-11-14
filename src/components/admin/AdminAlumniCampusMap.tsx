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
  CampusGeoCluster,
  SCHOOL_ORIGIN_COORDS,
  aggregateAlumniByCampus,
} from './alumniGeoData';
import { Compass, Globe2, GraduationCap, Minus, Plus, RotateCcw } from 'lucide-react';
import type { AlumniMapScope } from './AdminAlumniGeoMap';

interface AdminAlumniCampusMapProps {
  alumni: AlumniRecord[];
  allAlumniCount: number;
  activeCampusFilter: string;
  onSelectCampusFilter: (campusName: string) => void;
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

function getCampusClusterFill(cluster: CampusGeoCluster): string {
  if (cluster.isInternational) return '#059669'; // Kampus Luar Negeri
  if (cluster.ptnOrScholarshipCount === cluster.count) return '#2563eb'; // PTN / Beasiswa
  return '#7c3aed'; // Campuran / Swasta
}

function getClusterRadius(count: number, maxCount: number): number {
  if (maxCount <= 1) return 9.5;
  const ratio = Math.sqrt(count / maxCount);
  return 7.5 + ratio * 11.5;
}

export function AdminAlumniCampusMap({
  alumni,
  allAlumniCount,
  activeCampusFilter,
  onSelectCampusFilter,
}: AdminAlumniCampusMapProps) {
  const [mapScope, setMapScope] = useState<AlumniMapScope>('indonesia');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredCampusKey, setHoveredCampusKey] = useState<string | null>(null);

  const { campusClusters, internationalCount, domesticCount } = useMemo(
    () => aggregateAlumniByCampus(alumni),
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
    return campusClusters
      .map((cluster) => {
        const pt = projection(cluster.coords);
        if (!pt) return null;
        const [x, y] = pt;
        const inViewport =
          x >= -15 && x <= SVG_WIDTH + 15 && y >= -15 && y <= SVG_HEIGHT + 15;
        if (mapScope !== 'global' && cluster.isInternational) return null;
        if (!inViewport) return null;
        return {
          cluster,
          x,
          y,
        };
      })
      .filter(
        (item): item is { cluster: CampusGeoCluster; x: number; y: number } =>
          Boolean(item)
      );
  }, [campusClusters, projection, mapScope]);

  const maxClusterCount = useMemo(
    () => Math.max(1, ...visibleClusters.map((v) => v.cluster.count)),
    [visibleClusters]
  );

  const originPoint = useMemo(() => projection(SCHOOL_ORIGIN_COORDS), [projection]);

  const hoveredItem = useMemo(
    () => visibleClusters.find((v) => v.cluster.key === hoveredCampusKey) || null,
    [visibleClusters, hoveredCampusKey]
  );

  const isFilteredView = alumni.length !== allAlumniCount;

  const handleScopeChange = (nextScope: AlumniMapScope) => {
    setMapScope(nextScope);
    setZoomLevel(1);
    setHoveredCampusKey(null);
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
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Pemetaan Geografis D3 · Kampus Diterima Alumni</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{campusClusters.length} Kampus Tujuan</span>
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
            Peta Sebaran Alumni Berdasarkan Nama Kampus
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
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

          {activeCampusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectCampusFilter('all')}
              className="py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Kampus</span>
            </button>
          )}
        </div>
      </div>

      {alumni.length === 0 ? (
        <div className="h-[320px] flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-1.5">
          <GraduationCap className="w-8 h-8 text-slate-300" />
          <p className="font-medium text-slate-600">
            Tidak ada data kampus alumni untuk dipetakan pada filter saat ini.
          </p>
          <p>Ubah kriteria filter atau reset filter untuk melihat peta sebaran kampus.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: D3 Geo Campus Map */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
            <div className="relative w-full">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                className="w-full h-auto block select-none bg-[#f8fafc]"
                role="img"
                aria-label="Peta interaktif sebaran alumni berdasarkan nama kampus"
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
                            ? '#e0e7ff'
                            : c.isHostCountry && mapScope === 'global'
                              ? '#dcfce7'
                              : '#eef2f6'
                        }
                        stroke={c.isIndonesia ? '#818cf8' : '#cbd5e1'}
                        strokeWidth={(c.isIndonesia ? 1 : 0.65) / zoomLevel}
                      />
                    );
                  })}

                  {/* Geodesic Arcs from School to Campus */}
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
                      hoveredCampusKey === cluster.key ||
                      activeCampusFilter === cluster.campusName;

                    return (
                      <path
                        key={`campus-arc-${cluster.key}`}
                        d={arcD}
                        fill="none"
                        stroke={isHighlighted ? '#2563eb' : '#64748b'}
                        strokeWidth={(isHighlighted ? 1.8 : 0.9) / zoomLevel}
                        strokeDasharray="4 3"
                        opacity={isHighlighted ? 0.85 : 0.3}
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

                  {/* University Campus Markers */}
                  {visibleClusters.map(({ cluster, x, y }) => {
                    const baseR = getClusterRadius(cluster.count, maxClusterCount);
                    const r = baseR / Math.pow(zoomLevel, 0.45);
                    const fill = getCampusClusterFill(cluster);
                    const isSelected = activeCampusFilter === cluster.campusName;
                    const isHovered = hoveredCampusKey === cluster.key;
                    const dimmed =
                      activeCampusFilter !== 'all' &&
                      activeCampusFilter !== cluster.campusName;

                    return (
                      <g
                        key={cluster.key}
                        transform={`translate(${x}, ${y})`}
                        onMouseEnter={() => setHoveredCampusKey(cluster.key)}
                        onMouseLeave={() => setHoveredCampusKey(null)}
                        onClick={() =>
                          onSelectCampusFilter(isSelected ? 'all' : cluster.campusName)
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
                          fillOpacity={0.9}
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

              {/* International Campus Shortcut */}
              {mapScope !== 'global' && internationalCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleScopeChange('global')}
                  className="absolute bottom-3 left-3 py-1.5 px-3 rounded-xl bg-white/95 hover:bg-white border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="tabular-nums">
                    +{internationalCount} alumni di kampus luar negeri · Buka Peta Global
                  </span>
                </button>
              )}

              {/* Campus Tooltip */}
              {hoveredItem && (
                <div
                  className="absolute z-20 pointer-events-none bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs w-68 space-y-1.5"
                  style={{
                    left: `${Math.min(72, Math.max(24, (hoveredItem.x / SVG_WIDTH) * 100))}%`,
                    top: `${Math.min(68, Math.max(14, (hoveredItem.y / SVG_HEIGHT) * 100))}%`,
                    transform: 'translate(-50%, -108%)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 leading-snug">
                        {hoveredItem.cluster.campusName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hoveredItem.cluster.city}, {hoveredItem.cluster.province}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                      {hoveredItem.cluster.count} Alumni
                    </span>
                  </div>

                  {hoveredItem.cluster.majors.length > 0 && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 leading-snug">
                      Prodi: {hoveredItem.cluster.majors.slice(0, 2).join(', ')}
                    </div>
                  )}

                  <div className="space-y-0.5 pt-1 border-t border-slate-100">
                    {hoveredItem.cluster.alumni.slice(0, 3).map((person) => (
                      <div key={person.id} className="text-[11px] leading-snug truncate tabular-nums">
                        <span className="font-semibold text-slate-800">{person.nama}</span>
                        <span className="text-slate-500">
                          {' '}
                          · {person.jalur_masuk_kampus} ({person.tahun_diterima})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb] shrink-0" />
                  <span>Kampus Dalam Negeri (PTN / Beasiswa)</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shrink-0" />
                  <span>Kampus Luar Negeri</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] shrink-0" />
                  <span>PTS / Jalur Campuran</span>
                </span>
              </div>
              <span className="text-slate-400">
                Klik titik kampus untuk memfilter tabel
              </span>
            </div>
          </div>

          {/* Right: Ranking Nama Kampus */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Sebaran Nama Kampus Diterima
              </div>
              <p className="text-[11px] text-slate-500">
                Klik nama kampus untuk menyaring daftar alumni dari perguruan tinggi tersebut.
              </p>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {campusClusters.map((campus) => {
                const isSelected = activeCampusFilter === campus.campusName;
                return (
                  <button
                    key={campus.campusName}
                    type="button"
                    onClick={() =>
                      onSelectCampusFilter(isSelected ? 'all' : campus.campusName)
                    }
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="font-semibold leading-snug">{campus.campusName}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isSelected ? 'text-slate-200' : 'text-slate-600'
                        }`}
                      >
                        {campus.count} ({campus.percentage}%)
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
                            ? 'bg-blue-400'
                            : campus.isInternational
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.max(8, campus.percentage)}%` }}
                      />
                    </div>

                    <div
                      className={`text-[11px] flex items-center justify-between gap-2 ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <span className="truncate">
                        {campus.city}, {campus.province}
                      </span>
                      <span className="truncate max-w-[140px] text-right">
                        {campus.majors.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
              <span>Kampus Dalam Negeri: {domesticCount}</span>
              <span>Kampus Luar Negeri: {internationalCount}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
