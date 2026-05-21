import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CircleHelp, Activity, Radio, Waves } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "../utils/cn";
import { demodulateAM, demodulateFM, demodulatePM, buildCompareData } from "../utils/demodulation";
import type { SignalParameters, SignalPoint } from "../utils/signalProcessor";

interface DemodulationPageProps {
  activeSignalData: SignalPoint[];
  params: SignalParameters;
  mode: "AM" | "FM" | "PM";
  theme: "dark" | "light";
  formatTimeLabel: (seconds: number) => string;
  activeDemodTab: "AM" | "FM" | "PM" | "compare";
  setActiveDemodTab: (tab: "AM" | "FM" | "PM" | "compare") => void;
  onHelpClick: () => void;
  onSimulatorClick: () => void;
}

function FeatureButton({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "sky" | "emerald" | "violet" | "amber";
  onClick: () => void;
}) {
  const toneClasses = {
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-300 hover:border-sky-400/50 hover:bg-sky-500/20",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/20",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:border-violet-400/50 hover:bg-violet-500/20",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/50 hover:bg-amber-500/20",
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn("inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition", toneClasses[tone])}
    >
      {icon}
      {label}
    </motion.button>
  );
}

export function DemodulationPage({
  activeSignalData,
  params,
  mode,
  theme,
  formatTimeLabel,
  activeDemodTab,
  setActiveDemodTab,
  onHelpClick,
  onSimulatorClick,
}: DemodulationPageProps) {
  const amResult = useMemo(() => demodulateAM(activeSignalData, params), [activeSignalData, params]);
  const fmResult = useMemo(() => demodulateFM(activeSignalData, params), [activeSignalData, params]);
  const pmResult = useMemo(() => demodulatePM(activeSignalData, params), [activeSignalData, params]);
  const compareData = useMemo(() => buildCompareData(activeSignalData, params), [activeSignalData, params]);

  const activeResult = activeDemodTab === "AM" ? amResult : activeDemodTab === "FM" ? fmResult : pmResult;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
      <div className="space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">Demodulation Laboratory</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Signal Recovery & Analysis</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-100/80">
                This page demonstrates the complete demodulation process for AM, FM, and PM signals. Watch how the original message is extracted from the modulated carrier using real signal processing algorithms.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FeatureButton label="Help" icon={<CircleHelp size={15} />} tone="violet" onClick={onHelpClick} />
              <FeatureButton label="Back to Simulator" icon={<ArrowLeft size={15} />} tone="emerald" onClick={onSimulatorClick} />
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            {(["AM", "FM", "PM", "compare"] as const).map((tab) => (
              <motion.button
                key={tab}
                type="button"
                onClick={() => setActiveDemodTab(tab)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-wider transition",
                  activeDemodTab === tab
                    ? tab === "AM"
                      ? "border border-sky-500/50 bg-sky-500/20 text-sky-200 shadow-lg shadow-sky-500/20"
                      : tab === "FM"
                      ? "border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 shadow-lg shadow-emerald-500/20"
                      : tab === "PM"
                      ? "border border-violet-500/50 bg-violet-500/20 text-violet-200 shadow-lg shadow-violet-500/20"
                      : "border border-amber-500/50 bg-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/20"
                    : "border border-white/10 bg-slate-900/60 text-slate-400 hover:text-slate-200"
                )}
              >
                {tab === "compare" ? "Compare All" : tab}
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Main content */}
        {activeDemodTab !== "compare" ? (
          <>
            {/* Demodulation steps */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
                {activeDemodTab} Demodulation Process — Step by Step
              </h3>
              <div className="mt-4 space-y-3">
                {activeResult.steps.map((step, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-bold text-violet-300">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{step.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{step.description}</p>
                        <p className="mt-2 break-words font-mono text-xs text-sky-300">{step.formula}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Received signal */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Received Modulated Signal</h3>
              <p className="mt-1 text-xs text-slate-500">This is the signal after transmission through the channel (with noise if noise level &gt; 0)</p>
              <div className="mt-4 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeResult.chartPoints} margin={{ top: 8, right: 28, left: 12, bottom: 28 }}>
                    <CartesianGrid stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={formatTimeLabel}
                      label={{ value: "Time (s)", position: "insideBottom", offset: -16, fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      domain={["auto", "auto"]}
                      width={48}
                      label={{ value: "Amplitude (V)", angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#020617", borderColor: "#a78bfa", borderRadius: 8 }}
                      labelStyle={{ color: theme === "light" ? "#1e293b" : "#cbd5e1" }}
                      itemStyle={{ fontSize: 12 }}
                      labelFormatter={(v) => formatTimeLabel(Number(v))}
                    />
                    <Line type="monotone" dataKey="modulated" stroke="#a78bfa" strokeWidth={2} dot={false} name="Received signal" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* Recovered vs Original */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Recovered Message vs Original</h3>
              <p className="mt-1 text-xs text-slate-500">The demodulated output (green) should closely match the original message (blue dashed)</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeResult.chartPoints} margin={{ top: 8, right: 28, left: 12, bottom: 28 }}>
                    <CartesianGrid stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={formatTimeLabel}
                      label={{ value: "Time (s)", position: "insideBottom", offset: -16, fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      domain={["auto", "auto"]}
                      width={48}
                      label={{ value: "Amplitude (V)", angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#020617", borderColor: "#34d399", borderRadius: 8 }}
                      labelStyle={{ color: theme === "light" ? "#1e293b" : "#cbd5e1" }}
                      itemStyle={{ fontSize: 12 }}
                      labelFormatter={(v) => formatTimeLabel(Number(v))}
                    />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} />
                    <Line type="monotone" dataKey="original" stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Original message" />
                    <Line type="monotone" dataKey="recovered" stroke="#34d399" strokeWidth={2.5} dot={false} name="Recovered message" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* Error signal */}
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Demodulation Error</h3>
              <p className="mt-1 text-xs text-slate-500">Difference between recovered and original — smaller is better</p>
              <div className="mt-4 h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeResult.chartPoints} margin={{ top: 8, right: 28, left: 12, bottom: 28 }}>
                    <CartesianGrid stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={formatTimeLabel}
                      label={{ value: "Time (s)", position: "insideBottom", offset: -16, fill: "#64748b", fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      domain={["auto", "auto"]}
                      width={48}
                      label={{ value: "Error (V)", angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#020617", borderColor: "#f59e0b", borderRadius: 8 }}
                      labelStyle={{ color: theme === "light" ? "#1e293b" : "#cbd5e1" }}
                      itemStyle={{ fontSize: 12 }}
                      labelFormatter={(v) => formatTimeLabel(Number(v))}
                    />
                    <Line type="monotone" dataKey="error" stroke="#f59e0b" strokeWidth={2} dot={false} name="Error" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          </>
        ) : (
          /* Compare all three */
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">All Three Demodulation Methods — Side by Side</h3>
            <p className="mt-1 text-xs text-slate-500">Compare how AM, FM, and PM demodulation perform on the same received signal</p>
            <div className="mt-4 h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareData} margin={{ top: 8, right: 28, left: 12, bottom: 28 }}>
                  <CartesianGrid stroke={theme === "light" ? "#e2e8f0" : "#1e293b"} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    tickFormatter={formatTimeLabel}
                    label={{ value: "Time (s)", position: "insideBottom", offset: -16, fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    domain={["auto", "auto"]}
                    width={48}
                    label={{ value: "Amplitude (V)", angle: -90, position: "insideLeft", offset: 14, fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: theme === "light" ? "#ffffff" : "#020617", borderColor: "#475569", borderRadius: 8 }}
                    labelStyle={{ color: theme === "light" ? "#1e293b" : "#cbd5e1" }}
                    itemStyle={{ fontSize: 12 }}
                    labelFormatter={(v) => formatTimeLabel(Number(v))}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12, paddingBottom: 6 }} />
                  <Line type="monotone" dataKey="original" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Original" />
                  <Line type="monotone" dataKey="amRecovered" stroke="#38bdf8" strokeWidth={2} dot={false} name="AM recovered" />
                  <Line type="monotone" dataKey="fmRecovered" stroke="#34d399" strokeWidth={2} dot={false} name="FM recovered" />
                  <Line type="monotone" dataKey="pmRecovered" stroke="#a78bfa" strokeWidth={2} dot={false} name="PM recovered" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">AM Demodulation</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Envelope detection — sensitive to amplitude noise</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">FM Demodulation</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Frequency discrimination — more noise-resistant</p>
              </div>
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">PM Demodulation</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Phase detection — similar to FM, constant amplitude</p>
              </div>
            </div>
          </motion.section>
        )}
      </div>

      {/* Right sidebar — Quality metrics */}
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Quality Metrics</h3>
          <div className="mt-4 space-y-4">
            {/* AM metrics */}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
                <Activity size={16} />
                AM Demodulation
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RMSE:</span>
                  <span className="font-mono text-sky-200">{amResult.metrics.rmse.toFixed(4)} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correlation:</span>
                  <span className="font-mono text-sky-200">{amResult.metrics.correlation.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SNR:</span>
                  <span className="font-mono text-sky-200">{amResult.metrics.snrDb.toFixed(2)} dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Error:</span>
                  <span className="font-mono text-sky-200">{amResult.metrics.maxError.toFixed(4)} V</span>
                </div>
              </div>
            </div>

            {/* FM metrics */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <Radio size={16} />
                FM Demodulation
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RMSE:</span>
                  <span className="font-mono text-emerald-200">{fmResult.metrics.rmse.toFixed(4)} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correlation:</span>
                  <span className="font-mono text-emerald-200">{fmResult.metrics.correlation.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SNR:</span>
                  <span className="font-mono text-emerald-200">{fmResult.metrics.snrDb.toFixed(2)} dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Error:</span>
                  <span className="font-mono text-emerald-200">{fmResult.metrics.maxError.toFixed(4)} V</span>
                </div>
              </div>
            </div>

            {/* PM metrics */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
                <Waves size={16} />
                PM Demodulation
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">RMSE:</span>
                  <span className="font-mono text-violet-200">{pmResult.metrics.rmse.toFixed(4)} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correlation:</span>
                  <span className="font-mono text-violet-200">{pmResult.metrics.correlation.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SNR:</span>
                  <span className="font-mono text-violet-200">{pmResult.metrics.snrDb.toFixed(2)} dB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Error:</span>
                  <span className="font-mono text-violet-200">{pmResult.metrics.maxError.toFixed(4)} V</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Explanation panel */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Understanding the Metrics</h3>
          <div className="mt-4 space-y-3 text-xs leading-6 text-amber-100/90">
            <p><span className="font-semibold">RMSE</span> (Root Mean Square Error) — average magnitude of the error. Lower is better.</p>
            <p><span className="font-semibold">Correlation</span> — how closely the recovered signal matches the original. 1.0 = perfect match.</p>
            <p><span className="font-semibold">SNR</span> (Signal-to-Noise Ratio) — ratio of signal power to error power in dB. Higher is better.</p>
            <p><span className="font-semibold">Max Error</span> — largest single-point error. Shows worst-case deviation.</p>
          </div>
        </motion.section>

        {/* Tips panel */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200">Demo Tips</h3>
          <div className="mt-4 space-y-3 text-xs leading-6 text-emerald-100/90">
            <p>1. Start with noise level 0.02 (clean) to show perfect recovery.</p>
            <p>2. Increase noise to 0.15 and watch RMSE increase.</p>
            <p>3. Compare all three methods — FM and PM are more noise-resistant than AM.</p>
            <p>4. Use the "Compare All" tab to show judges all three side by side.</p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
