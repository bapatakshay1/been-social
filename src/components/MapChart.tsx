import { Tooltip } from "react-tooltip";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapChartProps {
    visitedCountries: string[];
    friendVisitedCountries: string[] | null;
    onCountryClick: (countryName: string) => void;
}

export function MapChart({ visitedCountries, friendVisitedCountries, onCountryClick }: MapChartProps) {
    return (
        <div className="w-full h-full bg-blue-950/20 overflow-hidden relative rounded-2xl border border-zinc-800">
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 120 }}>
                <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={5}>
                    <Geographies geography={geoUrl}>
                        {({ geographies }: { geographies: any[] }) =>
                            geographies.map((geo: any) => {
                                const countryName = geo.properties.name;

                                const isVisited = visitedCountries.includes(countryName);
                                const isFriendVisited = friendVisitedCountries?.includes(countryName);

                                let fillColor = "#27272a"; // Default: unvisited in solo mode

                                if (friendVisitedCountries) {
                                    // Comparison mode — 4 states
                                    if (isVisited && isFriendVisited) {
                                        fillColor = "#2dd4bf"; // Teal — both visited
                                    } else if (isVisited) {
                                        fillColor = "#fbbf24"; // Amber — only you
                                    } else if (isFriendVisited) {
                                        fillColor = "#f472b6"; // Hot pink — only them
                                    } else {
                                        fillColor = "#1e293b"; // Deep slate — neither yet
                                    }
                                } else if (isVisited) {
                                    fillColor = "#fbbf24"; // Yellow — visited
                                }

                                return (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill={fillColor}
                                        stroke="#18181b"
                                        strokeWidth={0.5}
                                        onClick={() => onCountryClick(countryName)}
                                        data-tooltip-id="map-tooltip"
                                        data-tooltip-content={countryName}
                                        style={{
                                            default: { outline: "none", transition: "all 250ms" },
                                            hover: { fill: "#f59e0b", outline: "none", cursor: "pointer" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                );
                            })
                        }
                    </Geographies>
                </ZoomableGroup>
            </ComposableMap>
            <Tooltip id="map-tooltip" style={{ backgroundColor: '#18181b', color: '#fff', borderRadius: '8px', zIndex: 100, border: '1px solid #3f3f46' }} />
        </div>
    );
}
