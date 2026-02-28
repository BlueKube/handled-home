import { useCallback, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { ProviderJob } from "@/hooks/useProviderJobs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Navigation, MapPin, AlertTriangle } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "";

interface ProviderMapViewProps {
  jobs: ProviderJob[];
  selectedJobId?: string | null;
  onSelectJob?: (jobId: string | null) => void;
  readOnly?: boolean;
}

function getNavigateUrl(lat: number, lng: number, label?: string) {
  const encoded = encodeURIComponent(label ?? `${lat},${lng}`);
  // Apple Maps on iOS, Google Maps everywhere else
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return `maps://maps.apple.com/?daddr=${lat},${lng}&q=${encoded}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function getNextStop(jobs: ProviderJob[]): ProviderJob | null {
  return jobs.find(
    (j) => !["COMPLETED", "CANCELED"].includes(j.status) && j.status !== "IN_PROGRESS"
  ) ?? jobs.find((j) => j.status === "IN_PROGRESS") ?? null;
}

export function ProviderMapView({ jobs, selectedJobId, onSelectJob, readOnly }: ProviderMapViewProps) {
  const mapRef = useRef<any>(null);
  const [popupJob, setPopupJob] = useState<ProviderJob | null>(null);

  const mappableJobs = useMemo(
    () => jobs.filter((j) => j.property?.lat != null && j.property?.lng != null),
    [jobs]
  );

  const unmappableCount = jobs.length - mappableJobs.length;

  const bounds = useMemo(() => {
    if (mappableJobs.length === 0) return null;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    for (const j of mappableJobs) {
      const lat = j.property!.lat!;
      const lng = j.property!.lng!;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [mappableJobs]);

  const initialViewState = useMemo(() => {
    if (!bounds) return { latitude: 39.8283, longitude: -98.5795, zoom: 4 };
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    let zoom = 13;
    if (maxDiff > 0.5) zoom = 10;
    else if (maxDiff > 0.2) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    return { latitude: centerLat, longitude: centerLng, zoom };
  }, [bounds]);

  const handleMarkerClick = useCallback(
    (job: ProviderJob) => {
      setPopupJob(job);
      onSelectJob?.(job.id);
      mapRef.current?.flyTo({
        center: [job.property!.lng!, job.property!.lat!],
        duration: 500,
      });
    },
    [onSelectJob]
  );

  const nextStop = getNextStop(jobs);

  if (!MAPBOX_TOKEN) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" />
        <p className="text-sm font-medium">Map unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">
          Mapbox access token not configured.
        </p>
      </Card>
    );
  }

  if (mappableJobs.length === 0) {
    return (
      <Card className="p-6 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-medium">Map unavailable</p>
        <p className="text-xs text-muted-foreground mt-1">
          {jobs.length === 0
            ? "No jobs to display"
            : "No geocoded addresses available for today's stops."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {unmappableCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {unmappableCount} stop{unmappableCount > 1 ? "s" : ""} missing address coordinates — showing in list only
        </div>
      )}

      {!readOnly && nextStop && nextStop.property?.lat != null && (
        <Button
          className="w-full"
          onClick={() =>
            window.open(
              getNavigateUrl(
                nextStop.property!.lat!,
                nextStop.property!.lng!,
                nextStop.property!.street_address
              ),
              "_blank"
            )
          }
        >
          <Navigation className="h-4 w-4 mr-2" />
          Navigate to next stop
        </Button>
      )}

      <div className="rounded-xl overflow-hidden border border-border" style={{ height: 360 }}>
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {mappableJobs.map((job, idx) => {
            const isSelected = job.id === selectedJobId || job.id === popupJob?.id;
            const isCompleted = job.status === "COMPLETED";
            const isInProgress = job.status === "IN_PROGRESS";
            const isNext = job.id === nextStop?.id;

            return (
              <Marker
                key={job.id}
                latitude={job.property!.lat!}
                longitude={job.property!.lng!}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(job);
                }}
              >
                <div
                  className={`
                    flex items-center justify-center rounded-full text-xs font-bold cursor-pointer
                    transition-all duration-200 shadow-md
                    ${isCompleted
                      ? "bg-muted text-muted-foreground w-7 h-7"
                      : isInProgress
                        ? "bg-warning text-warning-foreground w-9 h-9 ring-2 ring-warning/40"
                        : isNext
                          ? "bg-accent text-accent-foreground w-9 h-9 ring-2 ring-accent/40"
                          : isSelected
                            ? "bg-primary text-primary-foreground w-9 h-9 ring-2 ring-primary/40"
                            : "bg-primary text-primary-foreground w-8 h-8"
                    }
                  `}
                >
                  {idx + 1}
                </div>
              </Marker>
            );
          })}

          {popupJob && popupJob.property?.lat != null && (
            <Popup
              latitude={popupJob.property.lat}
              longitude={popupJob.property.lng!}
              anchor="bottom"
              offset={20}
              closeOnClick={false}
              onClose={() => {
                setPopupJob(null);
                onSelectJob?.(null);
              }}
              className="[&_.mapboxgl-popup-content]:rounded-xl [&_.mapboxgl-popup-content]:p-0 [&_.mapboxgl-popup-content]:shadow-lg"
            >
              <div className="p-3 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
                    #{mappableJobs.indexOf(popupJob) + 1}
                  </span>
                  <StatusBadge status={popupJob.status.toLowerCase()} />
                </div>
                <p className="text-sm font-semibold mt-1">
                  {popupJob.property?.street_address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {popupJob.job_skus?.map((s) => s.sku_name_snapshot).filter(Boolean).join(", ") || "No services"}
                </p>
                {!readOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full text-xs"
                    onClick={() =>
                      window.open(
                        getNavigateUrl(
                          popupJob.property!.lat!,
                          popupJob.property!.lng!,
                          popupJob.property!.street_address
                        ),
                        "_blank"
                      )
                    }
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                )}
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
}
