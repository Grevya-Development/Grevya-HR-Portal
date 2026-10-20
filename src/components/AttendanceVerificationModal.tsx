import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, RefreshCw, X, AlertTriangle, ShieldCheck, Check, Navigation, AlertCircle, Info, ExternalLink, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../services/store';

interface AttendanceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'check_in' | 'check_out';
  workMode?: 'office' | 'remote' | 'hybrid';
  notes?: string;
  onSuccess: (data: {
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    exceptionReason?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export default function AttendanceVerificationModal({
  isOpen,
  onClose,
  action,
  workMode = 'office',
  notes = '',
  onSuccess,
}: AttendanceVerificationModalProps) {
  const { currentUser } = useStore();

  const [step, setStep] = useState<'capture' | 'preview' | 'exception' | 'submitting' | 'success'>('capture');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{ time: string; msg: string } | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Exception fallback state
  const [exceptionReason, setExceptionReason] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize camera & location when opened
  useEffect(() => {
    if (isOpen) {
      setStep('capture');
      setPhotoBlob(null);
      setPhotoPreview(null);
      setSuccessDetails(null);
      setCameraError(null);
      setGeoError(null);
      setSubmitError(null);
      setExceptionReason('');
      startCamera();
      acquireLocation();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera hardware or browser MediaDevices API is not supported.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      let msg = 'Camera access was denied or is unavailable on this device.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser settings to verify attendance.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device was detected on your computer.';
      }
      setCameraError(msg);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const acquireLocation = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracyMeters = Math.round(pos.coords.accuracy);

        // Validate geographic bounds
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          setGeoError('Device returned invalid geographic coordinates.');
          setGeoLoading(false);
          return;
        }

        setCoords({
          latitude: lat,
          longitude: lng,
          accuracy: accuracyMeters,
        });
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation capture failed:', err);
        let msg = 'Unable to acquire location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location permissions in your browser to verify attendance.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'GPS location is currently unavailable. Ensure device location is turned on.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS location acquisition timed out. Please try refreshing location.';
        }
        setGeoError(msg);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0, // Force fresh position; do not use cached coordinates
      }
    );
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw single still video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to JPEG blob - explicitly a single still photo
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          const previewUrl = URL.createObjectURL(blob);
          setPhotoPreview(previewUrl);
          stopCamera();
          setStep('preview');
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const retakePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    setPhotoBlob(null);
    setStep('capture');
    startCamera();
  };

  const handleConfirm = async () => {
    setSubmitError(null);
    setStep('submitting');

    let uploadedPath: string | null = null;

    try {
      let photoUrl: string | undefined = undefined;

      // 1. Upload still photo to private Supabase storage if captured
      if (photoBlob && currentUser?.id) {
        const timestamp = Date.now();
        const fileExt = 'jpg';
        const fileName = `${currentUser.id}/${action}_${timestamp}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attendance-photos')
          .upload(fileName, photoBlob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Photo upload failed: ${uploadError.message}. Please retry or submit an exception.`);
        }

        uploadedPath = uploadData?.path || fileName;
        photoUrl = uploadedPath;
      }

      // 2. Submit attendance with coordinates, accuracy, and photoUrl
      const result = await onSuccess({
        photoUrl,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        accuracy: coords?.accuracy,
        exceptionReason: undefined,
      });

      if (!result.success) {
        // Clean up orphaned upload if attendance RPC fails!
        if (uploadedPath) {
          try {
            await supabase.storage.from('attendance-photos').remove([uploadedPath]);
          } catch (cleanErr) {
            console.warn('Failed to clean up orphaned attendance photo:', cleanErr);
          }
        }
        throw new Error(result.error || 'Attendance verification failed');
      }

      const punchTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      setSuccessDetails({
        time: punchTime,
        msg: action === 'check_in' ? `Clock-in successful at ${punchTime}` : `Clock-out successful at ${punchTime}`,
      });
      setStep('success');

      // Auto close after brief acknowledgment
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Attendance submission error:', err);
      setSubmitError(err.message || 'Verification submission failed');
      setStep('preview');
    }
  };

  const handleExceptionSubmit = async () => {
    if (!exceptionReason.trim()) {
      setSubmitError('A documented reason is required to submit an attendance exception.');
      return;
    }

    setSubmitError(null);
    setStep('submitting');

    try {
      const result = await onSuccess({
        photoUrl: undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        accuracy: coords?.accuracy,
        exceptionReason: exceptionReason.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Exception submission failed');
      }

      const punchTime = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      setSuccessDetails({
        time: punchTime,
        msg: `${action === 'check_in' ? 'Clock-in' : 'Clock-out'} exception request logged at ${punchTime}`,
      });
      setStep('success');

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Exception submission error:', err);
      setSubmitError(err.message || 'Exception submission failed');
      setStep('exception');
    }
  };

  if (!isOpen) return null;

  const isCheckIn = action === 'check_in';
  const hasHardwareIssues = Boolean(cameraError || geoError);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isCheckIn ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                {isCheckIn ? 'Capture Clock-In Photo & Location' : 'Capture Clock-Out Photo & Location'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Live still photograph & authoritative server timestamp verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Privacy Notice Banner */}
          <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Still Photograph Verification:</span> A single still photo is taken from your camera when you click capture. No video or audio is ever recorded or uploaded. Physical GPS coordinates confirm your location. All media is securely stored in a private Supabase bucket accessible only to you and authorized HR managers.
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {step === 'success' ? (
            /* Success Confirmation View */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {successDetails?.msg}
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xs">
                Verified with still photograph, authoritative server timestamp, and GPS coordinates.
              </p>
              <div className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 rounded-lg text-xs font-mono text-slate-700 dark:text-zinc-300">
                Time: {successDetails?.time}
              </div>
            </div>
          ) : step === 'exception' ? (
            /* Exception Fallback Form */
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Request Attendance Verification Exception
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  If your device camera is broken, hardware is unavailable, or GPS signal cannot be acquired, you may request an exception. All exceptions are logged with your documented reason and require explicit HR/Admin approval.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Detailed Reason for Exception <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="e.g., Working on client desktop without webcam; or mobile GPS unable to fix signal inside high-rise building."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('capture')}
                  className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700 transition-colors"
                >
                  Back to Camera
                </button>
                <button
                  type="button"
                  onClick={handleExceptionSubmit}
                  disabled={!exceptionReason.trim()}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                >
                  Submit with Exception
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Photo Capture / Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    1. Live Camera Viewfinder (Still photo only, no video recording)
                  </label>
                  {step === 'preview' && (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retake
                    </button>
                  )}
                </div>

                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-zinc-700 flex items-center justify-center">
                  {cameraLoading && (
                    <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                      <span>Starting camera...</span>
                    </div>
                  )}

                  {cameraError && (
                    <div className="p-4 text-center space-y-2">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Camera
                      </button>
                    </div>
                  )}

                  {!cameraLoading && !cameraError && step === 'capture' && (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-white/90 hover:bg-white text-slate-900 font-semibold text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                      >
                        <Camera className="w-4 h-4 text-indigo-600" />
                        {isCheckIn ? 'Capture Clock-In Photo' : 'Capture Clock-Out Photo'}
                      </button>
                    </>
                  )}

                  {step === 'preview' && photoPreview && (
                    <div className="relative w-full h-full">
                      <img
                        src={photoPreview}
                        alt="Captured attendance verification"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-600/90 text-white text-[11px] font-medium rounded-full flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3" /> Photo Captured
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Location Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    2. Physical GPS Location
                  </label>
                  <button
                    type="button"
                    onClick={acquireLocation}
                    disabled={geoLoading}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${geoLoading ? 'animate-spin' : ''}`} />
                    Refresh GPS
                  </button>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-xl space-y-1.5 text-xs">
                  {geoLoading ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 py-1">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Acquiring satellite GPS coordinates...</span>
                    </div>
                  ) : geoError ? (
                    <div className="text-amber-600 dark:text-amber-400 flex items-start gap-2 py-1">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>{geoError}</div>
                    </div>
                  ) : coords ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Position:</span>
                        <span className="font-mono font-medium text-slate-800 dark:text-zinc-200">
                          {coords.latitude.toFixed(6)}° N, {coords.longitude.toFixed(6)}° E
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-zinc-400">Signal Accuracy:</span>
                        <span
                          className={`font-semibold ${
                            coords.accuracy <= 100
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : coords.accuracy <= 500
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          ±{coords.accuracy >= 1000 ? `${(coords.accuracy / 1000).toFixed(1)} km` : `${coords.accuracy} m`}
                          {coords.accuracy <= 100
                            ? ' (Satellite GPS)'
                            : coords.accuracy <= 500
                            ? ' (Wi-Fi/Cell)'
                            : ' (Network/IP Estimate)'}
                        </span>
                      </div>
                      {coords.accuracy > 500 && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-[11px] text-amber-700 dark:text-amber-300">
                          Notice: Device is reporting a regional network/Wi-Fi estimate rather than high-precision satellite GPS. If you are in office or remote, this location is logged as captured.
                        </div>
                      )}
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Order: Lat, Long</span>
                        <a
                          href={`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Navigation className="w-3 h-3" />
                          View on Google Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 py-1">Waiting for location permission...</div>
                  )}
                </div>
              </div>

              {/* Exception link if hardware issues exist */}
              {hasHardwareIssues && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('exception')}
                    className="w-full py-2 px-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Camera or GPS unavailable? Request Attendance Exception
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {step !== 'exception' && step !== 'success' && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={step === 'submitting'}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={step === 'submitting' || !photoBlob || !coords}
              className={`px-5 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all flex items-center gap-2 ${
                isCheckIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-zinc-800'
              } disabled:cursor-not-allowed`}
            >
              {step === 'submitting' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving Verification...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {isCheckIn ? 'Confirm & Clock In' : 'Confirm & Clock Out'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
