"use client";

import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Move } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Button } from "@/components/ui/button";
import { LocationPickerMap } from "@/components/maps/location-picker";
import type { LocationAnswer } from "@/types/submission";

export function LocationField({
  value,
  onChange,
}: {
  value: LocationAnswer | null;
  onChange: (v: LocationAnswer | null) => void;
}) {
  const { status, location, errorMessage, requestLocation, reset } = useGeolocation();
  const [adjusted, setAdjusted] = useState(false);

  const current = value ?? (status === "success" ? location : null);

  function handleRequest() {
    setAdjusted(false);
    requestLocation();
  }

  // Propager vers le parent dès que la géolocalisation réussit
  if (status === "success" && location && (!value || value.capturedAt !== location.capturedAt)) {
    onChange(location);
  }

  function handleReset() {
    reset();
    setAdjusted(false);
    onChange(null);
  }

  function handlePositionChange(lat: number, lng: number) {
    if (!current) return;
    setAdjusted(true);
    onChange({ ...current, latitude: lat, longitude: lng });
  }

  if (current) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <div>
            <p className="font-medium">
              {adjusted ? "تم تعديل الموقع يدوياً" : "تم تحديد موقعك بنجاح"}
            </p>
            <p dir="ltr" className="mt-0.5 text-xs text-emerald-600">
              {current.latitude.toFixed(6)}, {current.longitude.toFixed(6)}
              {!adjusted && ` — دقة ~${Math.round(current.accuracy)}م`}
            </p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Move className="h-3.5 w-3.5 shrink-0" />
          إذا لم يكن الموقع دقيقاً، اسحب العلامة على الخريطة إلى الموقع الصحيح
        </p>
        <LocationPickerMap
          latitude={current.latitude}
          longitude={current.longitude}
          accuracy={current.accuracy}
          draggable
          onPositionChange={handlePositionChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> إعادة تحديد الموقع
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        سنستخدم موقعك الجغرافي فقط لغرض تسجيل هذا الرد. لن تتم مشاركته مع أي طرف آخر.
      </p>

      {(status === "error" || status === "denied" || status === "unsupported") && errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
          {errorMessage}
        </div>
      )}

      <Button type="button" onClick={handleRequest} loading={status === "requesting"} variant="outline">
        {status === "requesting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحديد الموقع...
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" /> تحديد موقعي
          </>
        )}
      </Button>
    </div>
  );
}
