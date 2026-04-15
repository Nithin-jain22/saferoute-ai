"use client";

import { useState } from "react";
import polyline from "@mapbox/polyline";

export default function Home() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [bestRoute, setBestRoute] = useState<any>(null);
  const [mapUrl, setMapUrl] = useState("");

  // 🧠 Risk level logic
  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: "Low Risk", color: "text-green-400" };
    if (score >= 50) return { label: "Medium Risk", color: "text-yellow-400" };
    return { label: "High Risk", color: "text-red-400" };
  };

  // 📊 % safer logic
  const getSaferPercentage = () => {
    if (!routes.length || !bestRoute) return 0;

    const fastest = [...routes].sort(
      (a, b) => a.durationValue - b.durationValue
    )[0];

    const diff = bestRoute.safetyScore - fastest.safetyScore;

    return Math.max(diff, 0);
  };

  const handleSearch = async () => {
    if (!source || !destination) {
      alert("Enter both locations");
      return;
    }

    if (source === destination) {
      alert("Source and destination cannot be the same");
      return;
    }

    setLoading(true);
    setRoutes([]);
    setBestRoute(null);

    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        body: JSON.stringify({ source, destination }),
      });

      const data = await res.json();

      if (data.routes) {
        setRoutes(data.routes);

        // 🧠 Find safest route
        const sorted = [...data.routes].sort(
          (a, b) => b.safetyScore - a.safetyScore
        );

        const best = sorted[0];
        setBestRoute(best);

        // 📍 Fix location ambiguity
        const city = "Bengaluru, Karnataka";

        // 🧠 Decode polyline → get midpoint
        let waypoint = "";

        try {
          const coords = polyline.decode(best.polyline);
          const mid = coords[Math.floor(coords.length / 2)];
          waypoint = `${mid[0]},${mid[1]}`;
        } catch (e) {
          console.error("Polyline decode failed");
        }

        // 🗺 Map with waypoint
        const mapEmbed = `https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=${encodeURIComponent(
          source + ", " + city
        )}&destination=${encodeURIComponent(
          destination + ", " + city
        )}${waypoint ? `&waypoints=${waypoint}` : ""}&mode=driving`;

        setMapUrl(mapEmbed);
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching routes");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">

        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">
          🚦 SafeRoute AI
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Intelligent & Safe Route Recommendations
        </p>

        {/* Inputs */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="📍 Enter Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />

          <input
            type="text"
            placeholder="🏁 Enter Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 p-4 rounded-xl font-semibold text-lg transition shadow-lg"
          >
            {loading ? "🔍 AI Analyzing Safest Route..." : "Find Safest Route"}
          </button>
        </div>

        {/* 🗺 Map */}
        {mapUrl && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-white/10">
            <iframe
              src={mapUrl}
              width="100%"
              height="320"
              style={{ border: 0 }}
              loading="lazy"
            ></iframe>
          </div>
        )}

        {/* ⭐ Recommended Route */}
        {bestRoute && (
          <div className="mt-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-400/30 shadow-lg">
            <p className="text-xl font-semibold text-amber-300">
              ⭐ Recommended Route
            </p>

            <p className="text-sm text-gray-300 mt-2">
              This route minimizes risk while keeping travel time efficient.
            </p>

            <div className="mt-3 space-y-1">
              <p>🛣 {bestRoute.distance}</p>
              <p>⏱ {bestRoute.duration}</p>

              <p className="text-amber-300 font-semibold">
                🛡 Safety Score: {bestRoute.safetyScore}/100
              </p>

              {/* Risk Badge */}
              <p className={`font-semibold ${getRiskLevel(bestRoute.safetyScore).color}`}>
                {getRiskLevel(bestRoute.safetyScore).label}
              </p>

              {/* % Safer */}
              <p className="text-yellow-300">
                ⭐ {getSaferPercentage()}% safer than fastest route
              </p>
            </div>
          </div>
        )}

        {/* 🔁 All Routes */}
        <div className="mt-6 space-y-4">
          {routes.map((route, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border transition ${
                bestRoute?.id === route.id
                  ? "bg-amber-500/20 border-amber-400 scale-[1.02]"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <p className="font-semibold text-lg">Route {index + 1}</p>

              <div className="text-sm text-gray-300 mt-1">
                <p>Distance: {route.distance}</p>
                <p>Time: {route.duration}</p>
              </div>

              <p className="mt-2 text-amber-300 font-semibold">
                Safety: {route.safetyScore}/100
              </p>

              <p className={`text-sm ${getRiskLevel(route.safetyScore).color}`}>
                {getRiskLevel(route.safetyScore).label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}