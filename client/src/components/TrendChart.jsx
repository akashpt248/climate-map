import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function TrendChart({ history }) {
  const data = history.map((entry) => ({
    recordedAt: new Date(entry.recordedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    }),
    temperature: entry.weather?.temperature,
    aqi: entry.airQuality?.aqi
  }));

  return (
    <div className="chart-card">
      <div className="section-title">7-Day Trend</div>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="recordedAt" tick={{ fill: "#cbd5e1" }} />
            <YAxis yAxisId="left" tick={{ fill: "#cbd5e1" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#cbd5e1" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "1px solid rgba(148, 163, 184, 0.4)",
                borderRadius: "12px",
                color: "#e2e8f0"
              }}
            />
            <Legend wrapperStyle={{ color: "#e2e8f0" }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temperature"
              stroke="#0f766e"
              strokeWidth={3}
              dot={false}
              name="Temperature °C"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="aqi"
              stroke="#ea580c"
              strokeWidth={3}
              dot={false}
              name="AQI"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
