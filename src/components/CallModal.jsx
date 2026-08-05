"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Phone, Volume2, VolumeX, Maximize2, Minimize2, User
} from "lucide-react";

export default function CallModal({
  isOpen,
  callType,        // "voice" | "video"
  callerName,
  callerAvatar,
  currentUser,
  onClose,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState("calling"); // "calling" | "connected" | "ended"

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Auto-connect after 2s (simulated peer answer)
  useEffect(() => {
    if (!isOpen) return;
    setCallStatus("calling");
    setCallSeconds(0);

    const connectTimer = setTimeout(() => {
      setCallStatus("connected");
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Cleanup timer on close
  useEffect(() => {
    if (!isOpen) {
      clearInterval(timerRef.current);
      setCallSeconds(0);
      setCallStatus("calling");
    }
  }, [isOpen]);

  // Request camera/mic if video call
  useEffect(() => {
    if (!isOpen || callType !== "video") return;

    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => {});

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, callType]);

  const toggleMic = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  };

  const toggleCam = () => {
    setIsCamOff((prev) => {
      const next = !prev;
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  };

  const handleHangup = useCallback(() => {
    clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCallStatus("ended");
    setTimeout(onClose, 800);
  }, [onClose]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 1100,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        }}
        onClick={handleHangup}
      />

      {/* Call Window */}
      <div
        style={{
          position: "fixed",
          zIndex: 1101,
          top: isFullscreen ? 0 : "50%",
          left: isFullscreen ? 0 : "50%",
          transform: isFullscreen ? "none" : "translate(-50%, -50%)",
          width: isFullscreen ? "100vw" : (callType === "video" ? "520px" : "360px"),
          height: isFullscreen ? "100vh" : (callType === "video" ? "420px" : "340px"),
          background: "linear-gradient(160deg, #1a0a3d 0%, #0d0420 100%)",
          borderRadius: isFullscreen ? 0 : "24px",
          boxShadow: "0 30px 80px rgba(110,86,207,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 24px 24px",
          overflow: "hidden",
          transition: "all 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- Top bar --- */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
            {callType === "video" ? "🎥 วิดีโอคอล" : "📞 โทรศัพท์"}
          </span>
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", padding: "6px", color: "#fff", cursor: "pointer" }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        {/* --- Caller info / video area --- */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", flex: 1, justifyContent: "center", width: "100%" }}>

          {callType === "video" ? (
            <div style={{ position: "relative", width: "100%", height: isFullscreen ? "calc(100vh - 220px)" : "200px", borderRadius: "16px", overflow: "hidden", background: "#0a0015" }}>
              {/* Remote user placeholder */}
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {callerAvatar && callerAvatar !== "/default-avatar.svg" ? (
                  <img src={callerAvatar} alt={callerName} style={{ width: "80px", height: "80px", borderRadius: "50%", opacity: 0.7 }} />
                ) : (
                  <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #6e56cf, #9b59b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={36} color="#fff" />
                  </div>
                )}
              </div>

              {/* Self preview (bottom-right) */}
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  position: "absolute", bottom: "10px", right: "10px",
                  width: "90px", height: "68px", borderRadius: "10px",
                  objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)",
                  background: "#1a0a3d",
                  display: isCamOff ? "none" : "block",
                }}
              />
              {isCamOff && (
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "90px", height: "68px", borderRadius: "10px", background: "#1a0a3d", border: "2px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <VideoOff size={18} color="rgba(255,255,255,0.4)" />
                </div>
              )}
            </div>
          ) : (
            /* Voice call avatar */
            <div
              style={{
                width: "90px", height: "90px", borderRadius: "50%",
                background: "linear-gradient(135deg, #6e56cf 0%, #9b59b6 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: callStatus === "connected" ? "0 0 0 8px rgba(110,86,207,0.25), 0 0 0 16px rgba(110,86,207,0.1)" : "none",
                transition: "box-shadow 0.4s ease",
                animation: callStatus === "connected" ? "callPulse 2s ease-in-out infinite" : "none",
              }}
            >
              {callerAvatar && callerAvatar !== "/default-avatar.svg" ? (
                <img src={callerAvatar} alt={callerName} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <User size={38} color="#fff" />
              )}
            </div>
          )}

          {/* Name & Status */}
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "6px" }}>
              {callerName || "ผู้ใช้งาน"}
            </div>
            <div style={{ color: callStatus === "connected" ? "#a78bfa" : "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 500 }}>
              {callStatus === "calling" && (
                <span>กำลังโทร<span className="call-dots">...</span></span>
              )}
              {callStatus === "connected" && `⏱ ${formatTime(callSeconds)}`}
              {callStatus === "ended" && "วางสายแล้ว"}
            </div>
          </div>
        </div>

        {/* --- Controls --- */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>

          {/* Mic toggle */}
          <button onClick={toggleMic} title={isMuted ? "เปิดไมค์" : "ปิดไมค์"} style={ctrlStyle(isMuted)}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Speaker toggle */}
          <button onClick={() => setIsSpeakerOff((p) => !p)} title={isSpeakerOff ? "เปิดลำโพง" : "ปิดเสียง"} style={ctrlStyle(isSpeakerOff)}>
            {isSpeakerOff ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Camera toggle (video only) */}
          {callType === "video" && (
            <button onClick={toggleCam} title={isCamOff ? "เปิดกล้อง" : "ปิดกล้อง"} style={ctrlStyle(isCamOff)}>
              {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          {/* Hang-up */}
          <button
            onClick={handleHangup}
            title="วางสาย"
            style={{
              width: "58px", height: "58px", borderRadius: "50%",
              background: "linear-gradient(135deg, #e74c3c, #c0392b)",
              border: "none", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(231,76,60,0.5)",
              transform: "scale(1.05)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          >
            <PhoneOff size={22} />
          </button>
        </div>

        <style>{`
          @keyframes callPulse {
            0%, 100% { box-shadow: 0 0 0 8px rgba(110,86,207,0.25), 0 0 0 16px rgba(110,86,207,0.1); }
            50% { box-shadow: 0 0 0 14px rgba(110,86,207,0.2), 0 0 0 28px rgba(110,86,207,0.07); }
          }
          @keyframes dotsFade {
            0%,100% { opacity: 0.3; } 50% { opacity: 1; }
          }
          .call-dots { animation: dotsFade 1.2s ease infinite; }
        `}</style>
      </div>
    </>
  );
}

function ctrlStyle(isActive) {
  return {
    width: "46px", height: "46px", borderRadius: "50%",
    background: isActive ? "rgba(231,76,60,0.25)" : "rgba(255,255,255,0.12)",
    border: isActive ? "1.5px solid rgba(231,76,60,0.6)" : "1.5px solid rgba(255,255,255,0.2)",
    color: isActive ? "#e74c3c" : "#fff",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
  };
}
