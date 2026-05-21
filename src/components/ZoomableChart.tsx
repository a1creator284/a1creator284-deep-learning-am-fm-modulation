import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from "recharts";
import { cn } from "../utils/cn";

interface ZoomableChartProps {
  data: any[];
  lines: Array<{
    dataKey: string;
    stroke: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    name: string;
    dot?: boolean;
  }>;
  xAxisKey: string;
  xAxisLabel: string;
  yAxisLabel: string;
  formatXAxis: (value: number) => string;
  theme: "dark" | "light";
  height?: number;
  showLegend?: boolean;
  yDomain?: [number | string, number | string];
  tooltipBorderColor?: string;
}

export function ZoomableChart({
  data,
  lines,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  formatXAxis,
  theme,
  height = 280,
  showLegend = true,
  yDomain = ["auto", "auto"],
  tooltipBorderColor,
}: ZoomableChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBrush, setShowBrush] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleReset = useCallback(() => {
    setZoomLevel(1);
    setShowBrush(false);
  }, []);

  const toggleBrush = useCallback(() => {
    setShowBrush((prev) => !prev);
  }, []);

  // Calculate effective height based on zoom
  const effectiveHeight = Math.round(height * zoomLevel);

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <motion.button
          type="button"
          onClick={handleZoomIn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={zoomLevel >= 3}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border transition",
            zoomLevel >= 3
              ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
              : "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
          )}
          title="Zoom in"
        >
          <ZoomIn size={14} />
        </motion.button>
        <motion.button
          type="button"
          onClick={handleZoomOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={zoomLevel <= 0.5}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border transition",
            zoomLevel <= 0.5
              ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
              : "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
          )}
          title="Zoom out"
        >
          <ZoomOut size={14} />
        </motion.button>
        <motion.button
          type="button"
          onClick={toggleBrush}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border transition",
            showBrush
              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
              : "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
          )}
          title={showBrush ? "Hide brush selector" : "Show brush selector"}
        >
          <Maximize2 size={14} />
        </motion.button>
        <motion.button
          type="button"
          onClick={handleReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={zoomLevel === 1 && !showBrush}
          className={cn(
            "flex h-7 items-center justify-center rounded-lg border px-2 text-[10px] font-semibold uppercase tracking-wider transition",
            zoomLevel === 1 && !showBrush
              ? "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
              : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          )}
          title="Reset zoom"
        >
          Reset
        </motion.button>
      </div>

      {/* Zoom level indicator */}
      {zoomLevel !== 1 && (
        <div className="absolute left-2 top-2 z-10 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold text-sky-300">
          {(zoomLevel * 100).toFixed(0)}%
        </div>
      )}

      {/* Chart container with scroll if zoomed */}
      <div className={cn("w-full", zoomLevel > 1 ? "overflow-x-auto overflow-y-hidden" : "")}>
        <div style={{ height: `${effectiveHeight}px`, minWidth: zoomLevel > 1 ? `${zoomLevel * 100}%` : "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 32, right: 28, left: 12, bottom: showBrush ? 60 : 28 }}>
              <CartesianGrid stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey={xAxisKey}
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={formatXAxis}
                label={{ value: xAxisLabel, position: "insideBottom", offset: showBrush ? -40 : -16, fill: "#64748b", fontSize: 11 }}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: "#64748b", fontSize: 10 }}
                domain={yDomain}
                width={48}
                label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "light" ? "#ffffff" : "#020617",
                  borderColor: tooltipBorderColor || "#475569",
                  borderRadius: 8,
                }}
                labelStyle={{ color: theme === "light" ? "#1e293b" : "#cbd5e1" }}
                itemStyle={{ fontSize: 12 }}
                labelFormatter={(v) => formatXAxis(Number(v))}
              />
              {showLegend && (
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, paddingBottom: 6, paddingTop: 4 }} />
              )}
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth || 2}
                  strokeDasharray={line.strokeDasharray}
                  dot={line.dot !== undefined ? line.dot : false}
                  name={line.name}
                  isAnimationActive={true}
                  animationDuration={600}
                />
              ))}
              {showBrush && (
                <Brush
                  dataKey={xAxisKey}
                  height={30}
                  stroke="#8b5cf6"
                  fill={theme === "light" ? "#f1f5f9" : "#0f172a"}
                  tickFormatter={formatXAxis}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Instructions */}
      {showBrush && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Drag the brush selector at the bottom to zoom into a specific time range
        </p>
      )}
    </div>
  );
}
