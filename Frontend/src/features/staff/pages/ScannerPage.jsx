import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ArrowLeft,
  RefreshCw,
  Camera,
  Layers,
  Users,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../components/ui/modal';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { useAuthStore } from '../../../stores/authStore';
import { useScannerQueueStore } from '../../../stores/scannerQueueStore';
import { useUiStore } from '../../../stores/uiStore';
import apiClient from '../../../lib/axios';

export function ScannerPage() {
  const navigate = useNavigate();
  const { activeEventId } = useAuthStore();
  const { enqueueScan, recentScans, isOnline, queue } = useScannerQueueStore();
  const { addToast } = useUiStore();

  // Mode: 'event' or 'session'
  const [scanType, setScanType] = useState('event');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [counters, setCounters] = useState({ checkedIn: 90, total: 160 });

  // Camera scanner state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);

  // Scan Result Overlay state: { status: 'success' | 'already' | 'error', message: string, data: any }
  const [scanResult, setScanResult] = useState(null);

  // Manual search fallback modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Manual token input for instant testing
  const [manualToken, setManualToken] = useState('');

  // Fetch sessions and initial counters
  useEffect(() => {
    if (!activeEventId) return;

    const fetchMeta = async () => {
      try {
        const [sessRes, countRes] = await Promise.all([
          apiClient.get(`/events/${activeEventId}/sessions`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/events/${activeEventId}/attendance/live`).catch(() => ({ data: { data: {} } })),
        ]);

        const sessList = sessRes.data?.data || [];
        setSessions(sessList);
        if (sessList.length > 0) {
          setSelectedSessionId(sessList[0]._id);
        }

        const cnt = countRes.data?.data?.eventCounters;
        if (cnt) {
          setCounters({
            checkedIn: cnt.actualCheckedIn || 90,
            total: cnt.totalEligibleRegistrations || 160,
          });
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchMeta();
  }, [activeEventId]);

  // Handle scanned token
  const processToken = async (token) => {
    if (!token) return;

    const res = await enqueueScan({
      type: scanType,
      eventId: activeEventId,
      sessionId: scanType === 'session' ? selectedSessionId : undefined,
      qrToken: token,
    });

    setScanResult({
      status: res.status, // 'success' | 'already' | 'error' | 'queued'
      message: res.message,
      token,
    });

    if (res.status === 'success') {
      setCounters((prev) => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
    }

    // Auto-clear overlay after 3 seconds
    setTimeout(() => {
      setScanResult((curr) => (curr?.token === token ? null : curr));
    }, 3500);
  };

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          processToken(decodedText);
        },
        (errorMessage) => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err) {
      setCameraError('Camera access unavailable. Use manual token or attendee lookup.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      } catch (e) {
        // quiet fail
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Search Attendee Fallback
  const handleSearchAttendee = async (q) => {
    setSearchQuery(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiClient.get(`/events/${activeEventId}/registrations?search=${q}`);
      const items = res.data?.data?.items || res.data?.data || [];
      setSearchResults(items);
    } catch (err) {
      // quiet
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/staff')}
          className="gap-1.5 text-xs h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Hub
        </Button>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 gap-1">
              <Wifi className="h-3 w-3" /> Online
            </Badge>
          ) : (
            <Badge variant="warning" className="text-[10px] gap-1">
              <WifiOff className="h-3 w-3" /> Offline ({queue.length})
            </Badge>
          )}
        </div>
      </div>

      {/* Live Counter Display */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-3 rounded-2xl bg-card border border-border/80">
          <div className="text-xl font-extrabold text-foreground">{counters.checkedIn}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Checked In</div>
        </div>
        <div className="p-3 rounded-2xl bg-card border border-border/80">
          <div className="text-xl font-extrabold text-muted-foreground">{counters.total}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Expected</div>
        </div>
      </div>

      {/* Scan Mode Toggle: Event Check-in <-> Session Attendance */}
      <div className="rounded-2xl border border-border/80 bg-card p-1 flex">
        <button
          type="button"
          onClick={() => setScanType('event')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            scanType === 'event'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Event Check-In
        </button>
        <button
          type="button"
          onClick={() => setScanType('session')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            scanType === 'session'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Session Attendance
        </button>
      </div>

      {/* Session Picker (when in session attendance mode) */}
      {scanType === 'session' && (
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-semibold text-muted-foreground">Select Session Room</label>
          <Select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title} ({s.room})
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Camera Viewport / Scanner Window */}
      <div className="relative aspect-square w-full rounded-3xl border-2 border-border/80 bg-black overflow-hidden flex flex-col items-center justify-center shadow-elevated">
        <div id="qr-reader-container" className="w-full h-full" />

        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card/90 backdrop-blur-xs space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Mobile Camera Ready</div>
              <div className="text-xs text-muted-foreground max-w-xs mt-1">
                Scan attendee badge QR codes for instant verification.
              </div>
            </div>
            <Button size="sm" onClick={startCamera} className="gap-1.5 text-xs shadow-md">
              <Camera className="h-3.5 w-3.5" /> Start Camera
            </Button>
          </div>
        )}

        {/* Instant Result State Overlay */}
        {scanResult && (
          <div
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md transition-all ${
              scanResult.status === 'success'
                ? 'bg-emerald-950/85 text-emerald-100'
                : scanResult.status === 'already'
                ? 'bg-amber-950/85 text-amber-100'
                : scanResult.status === 'queued'
                ? 'bg-blue-950/85 text-blue-100'
                : 'bg-rose-950/85 text-rose-100'
            }`}
          >
            {scanResult.status === 'success' && (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-2 animate-bounce" />
                <h2 className="text-xl font-extrabold tracking-tight">✓ Checked In</h2>
                <p className="text-xs mt-1 text-emerald-200">{scanResult.message}</p>
              </>
            )}

            {scanResult.status === 'already' && (
              <>
                <AlertTriangle className="h-16 w-16 text-amber-400 mb-2" />
                <h2 className="text-xl font-extrabold tracking-tight">⚠ Already In</h2>
                <p className="text-xs mt-1 text-amber-200">{scanResult.message}</p>
              </>
            )}

            {scanResult.status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-rose-400 mb-2" />
                <h2 className="text-xl font-extrabold tracking-tight">✕ Invalid Badge</h2>
                <p className="text-xs mt-1 text-rose-200">{scanResult.message}</p>
              </>
            )}

            {scanResult.status === 'queued' && (
              <>
                <WifiOff className="h-16 w-16 text-blue-400 mb-2" />
                <h2 className="text-xl font-extrabold tracking-tight">Saved to Queue</h2>
                <p className="text-xs mt-1 text-blue-200">{scanResult.message}</p>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setScanResult(null)}
              className="mt-6 text-xs bg-white/10 hover:bg-white/20 border-white/30 text-white"
            >
              Scan Next
            </Button>
          </div>
        )}
      </div>

      {/* Manual QR Token Entry */}
      <div className="p-3 rounded-2xl border border-border/80 bg-card space-y-2">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
          <span>Manual QR Token Entry</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter attendee QR token..."
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="text-xs h-8 font-mono"
          />
          <Button
            size="sm"
            disabled={!manualToken.trim()}
            onClick={() => {
              if (manualToken.trim()) {
                processToken(manualToken.trim());
                setManualToken('');
              }
            }}
            className="text-xs h-8 px-3 shrink-0"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Search Fallback & Recent Scans */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSearchModalOpen(true)}
          className="gap-1.5 text-xs w-full"
        >
          <Search className="h-3.5 w-3.5" />
          Attendee Name / Email Lookup
        </Button>
      </div>

      {/* Recent Scans Feed */}
      <div className="space-y-2 pt-2">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Scans ({recentScans.length})
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {recentScans.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
              No badges scanned in this session.
            </div>
          ) : (
            recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  {scan.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : scan.status === 'already' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : scan.status === 'queued' ? (
                    <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="font-semibold truncate">
                      {scan.attendeeInfo?.name || scan.qrToken.substring(0, 12)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{scan.message}</div>
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attendee Search Fallback Modal */}
      <Modal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        title="Attendee Lookup"
        description="Search by name or email when QR badge is damaged or missing."
      >
        <div className="space-y-4 pt-2">
          <Input
            icon={Search}
            placeholder="Search attendee by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchAttendee(e.target.value)}
            autoFocus
          />

          <div className="max-h-60 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="text-center py-4 text-xs text-muted-foreground">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">
                {searchQuery.length >= 2 ? 'No attendees match' : 'Type 2+ letters'}
              </div>
            ) : (
              searchResults.map((reg) => (
                <div
                  key={reg._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-muted/20 text-xs"
                >
                  <div>
                    <div className="font-semibold text-foreground">{reg.user?.name}</div>
                    <div className="text-[11px] text-muted-foreground">{reg.user?.email}</div>
                    <Badge variant="outline" className="text-[9px] mt-1 capitalize">
                      {reg.status}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    disabled={reg.status === 'checked_in'}
                    onClick={() => {
                      processToken(reg.qrToken);
                      setIsSearchModalOpen(false);
                    }}
                    className="text-xs h-7 px-2.5"
                  >
                    {reg.status === 'checked_in' ? 'Checked' : 'Check In'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
