"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type HistoryPoint = { date: string; price: number };

const WIDTH = 600;
const HEIGHT = 200;
const PADDING_LEFT = 56;
const PADDING_RIGHT = 12;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;

const RANGE_OPTIONS = [
  { label: "1A", range: "1mo", interval: "1d" },
  { label: "3A", range: "3mo", interval: "1d" },
  { label: "1Y", range: "1y", interval: "1wk" },
] as const;

export default function PriceChart({
  symbol,
  currencyLabel,
}: {
  symbol: string;
  currencyLabel: string;
}) {
  const [points, setPoints] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [rangeIndex, setRangeIndex] = useState(2);
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedRange = RANGE_OPTIONS[rangeIndex];

  useEffect(() => {
    setPoints(null);
    setError(false);
    setHoverIndex(null);
    fetch(
      `${API_URL}/market/history?symbol=${encodeURIComponent(symbol)}&range=${selectedRange.range}&interval=${selectedRange.interval}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("history fetch failed");
        return res.json();
      })
      .then((data) => setPoints(data.points))
      .catch(() => setError(true));
  }, [symbol, selectedRange.range, selectedRange.interval]);

  const chartWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const { linePath, areaPath, minPrice, maxPrice, midPrice, coords } = useMemo(() => {
    if (!points || points.length === 0) {
      return { linePath: "", areaPath: "", minPrice: 0, maxPrice: 0, midPrice: 0, coords: [] as { x: number; y: number }[] };
    }
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const coords = points.map((p, i) => {
      const x = PADDING_LEFT + (i / (points.length - 1 || 1)) * chartWidth;
      const y = PADDING_TOP + chartHeight - ((p.price - min) / range) * chartHeight;
      return { x, y };
    });

    const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    const area =
      line +
      ` L${coords[coords.length - 1].x.toFixed(2)},${(PADDING_TOP + chartHeight).toFixed(2)}` +
      ` L${coords[0].x.toFixed(2)},${(PADDING_TOP + chartHeight).toFixed(2)} Z`;

    return { linePath: line, areaPath: area, minPrice: min, maxPrice: max, midPrice: (min + max) / 2, coords };
  }, [points, chartWidth, chartHeight]);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!points || coords.length === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;

    let closest = 0;
    let closestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  const hover =
    points && hoverIndex !== null ? { point: points[hoverIndex], coord: coords[hoverIndex] } : null;

  const formatPrice = (v: number) =>
    v.toLocaleString("tr-TR", { maximumFractionDigits: v < 10 ? 4 : 2 });

  return (
    <div className="[--chart-line:#2a78d6] [--chart-area:#2a78d6] [--chart-grid:#e1e0d9] [--chart-axis:#898781] [--chart-crosshair:#c3c2b7] [--chart-surface:#fcfcfb] dark:[--chart-line:#3987e5] dark:[--chart-area:#3987e5] dark:[--chart-grid:#2c2c2a] dark:[--chart-axis:#898781] dark:[--chart-crosshair:#383835] dark:[--chart-surface:#1a1a19]">
      <div className="mb-2 flex gap-1">
        {RANGE_OPTIONS.map((opt, i) => (
          <button
            key={opt.label}
            onClick={() => setRangeIndex(i)}
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              i === rangeIndex
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-zinc-400">Bu varlik icin grafik verisi bulunamadi.</p>}
      {!error && !points && <p className="text-sm text-zinc-400">Grafik yukleniyor...</p>}

      {!error && points && (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ background: "var(--chart-surface)" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[minPrice, midPrice, maxPrice].map((v, i) => {
          const y = PADDING_TOP + chartHeight - ((v - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={PADDING_LEFT}
                x2={WIDTH - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text x={PADDING_LEFT - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--chart-axis)">
                {formatPrice(v)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="var(--chart-area)" opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--chart-line)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {points.length > 0 && (
          <>
            <text x={PADDING_LEFT} y={HEIGHT - 6} fontSize={10} fill="var(--chart-axis)">
              {points[0].date}
            </text>
            <text x={WIDTH - PADDING_RIGHT} y={HEIGHT - 6} textAnchor="end" fontSize={10} fill="var(--chart-axis)">
              {points[points.length - 1].date}
            </text>
          </>
        )}

        {hover && (
          <>
            <line
              x1={hover.coord.x}
              x2={hover.coord.x}
              y1={PADDING_TOP}
              y2={PADDING_TOP + chartHeight}
              stroke="var(--chart-crosshair)"
              strokeWidth={1}
            />
            <circle
              cx={hover.coord.x}
              cy={hover.coord.y}
              r={4}
              fill="var(--chart-line)"
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          </>
        )}
      </svg>
      )}

      {hover && (
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {hover.point.date}: <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {formatPrice(hover.point.price)} {currencyLabel}
          </span>
        </div>
      )}
    </div>
  );
}
