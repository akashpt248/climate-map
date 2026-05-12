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
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4f0" />
            <XAxis dataKey="recordedAt" tick={{ fill: "#456" }} />
            <YAxis yAxisId="left" tick={{ fill: "#456" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#456" }} />
            <Tooltip />
            <Legend />
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
