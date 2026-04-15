import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { source, destination } = await req.json();

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing API Key" },
        { status: 500 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      source
    )}&destination=${encodeURIComponent(
      destination
    )}&alternatives=true&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: data.status },
        { status: 400 }
      );
    }

    const currentHour = new Date().getHours();

    const routes = data.routes.map((route: any, index: number) => {
      const leg = route.legs[0];

      const durationValue = leg.duration.value;

      // 🧠 Simulated Risk Factors
      const randomRisk = Math.floor(Math.random() * 30); // 0–30
      const nightRisk = currentHour >= 20 || currentHour <= 5 ? 20 : 0;
      const timeRisk = Math.min(durationValue / 60, 30);

      // 🧠 Safety Score Calculation
      const safetyScore = Math.max(
        100 - (randomRisk + nightRisk + timeRisk),
        10
      );

      return {
        id: index,
        distance: leg.distance.text,
        duration: leg.duration.text,
        durationValue,
        safetyScore: Math.round(safetyScore),

        // 🔥 IMPORTANT (for map routing fix)
        polyline: route.overview_polyline.points,

        // Optional (future upgrades)
        startLocation: leg.start_location,
        endLocation: leg.end_location,
      };
    });

    return NextResponse.json({ routes });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}