import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CountryStats } from "~/lib/api";

interface WorldMapProps {
  countryData: CountryStats[];
  className?: string;
}

export function WorldMap({ countryData, className }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    mapInstance.current = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstance.current);

    // Add country markers
    countryData.forEach((country) => {
      const coords = getCountryCoordinates(country.country_code);
      if (coords && mapInstance.current) {
        const marker = L.circleMarker(coords, {
          radius: Math.min(Math.max(country.clicks / 10, 5), 25),
          fillColor: getHeatColor(country.percentage),
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapInstance.current);

        marker.bindPopup(`
            <div class="text-center">
            <strong>${country.country_name}</strong><br>
            ${country.clicks} clicks (${country.percentage}%)<br>
            ${country.unique_visitors} unique visitors
            </div>
            `);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [countryData]);

  return <div ref={mapRef} className={className} />;
}

function getCountryCoordinates(countryCode: string): [number, number] | null {
  const coordinates: Record<string, [number, number]> = {
    US: [39.8283, -98.5795],
    GB: [55.3781, -3.436],
    CA: [56.1304, -106.3468],
    AU: [-25.2744, 133.7751],
    DE: [51.1657, 10.4515],
    FR: [46.6034, 1.8883],
    IT: [41.8719, 12.5674],
    ES: [40.4637, -3.7492],
    NL: [52.1326, 5.2913],
    BR: [-14.235, -51.9253],
    JP: [36.2048, 138.2529],
    CN: [35.8617, 104.1954],
    IN: [20.5937, 78.9629],
    MX: [23.6345, -102.5528],
    // Add more coordinates as needed
  };
  return coordinates[countryCode] || null;
}

function getHeatColor(percentage: number): string {
  if (percentage >= 20) return "#dc2626"; // red-600
  if (percentage >= 10) return "#ea580c"; // orange-600
  if (percentage >= 5) return "#d97706"; // amber-600
  if (percentage >= 2) return "#65a30d"; // lime-600
  return "#16a34a"; // green-600
}
