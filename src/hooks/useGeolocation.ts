"use client";

import { useCallback, useState } from "react";
import type { LocationAnswer } from "@/types/submission";

export type GeoStatus = "idle" | "requesting" | "success" | "error" | "denied" | "unsupported";

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [location, setLocation] = useState<LocationAnswer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      setErrorMessage("متصفحك لا يدعم خدمة تحديد الموقع الجغرافي");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: LocationAnswer = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        };
        setLocation(loc);
        setStatus("success");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          setErrorMessage("تم رفض إذن الوصول إلى الموقع الجغرافي. يرجى تفعيله من إعدادات المتصفح للمتابعة.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus("error");
          setErrorMessage("تعذر تحديد الموقع الجغرافي حالياً. تأكد من تفعيل خدمة الموقع في جهازك.");
        } else if (error.code === error.TIMEOUT) {
          setStatus("error");
          setErrorMessage("انتهت مهلة تحديد الموقع. الرجاء المحاولة مرة أخرى.");
        } else {
          setStatus("error");
          setErrorMessage("حدث خطأ غير متوقع أثناء تحديد الموقع.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setLocation(null);
    setErrorMessage(null);
  }, []);

  return { status, location, errorMessage, requestLocation, reset };
}
