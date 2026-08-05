"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

const TOAST_DURATION = 60000; // 1 minute (60,000 ms)

export default function NotificationToast({ toast, toasts = [], onClose, onCloseToast, onClickToast }) {
  // Normalize toasts prop to an array
  let toastList = [];
  if (Array.isArray(toasts) && toasts.length > 0) {
    toastList = toasts;
  } else if (toast) {
    toastList = [toast];
  }

  const handleClose = (chatId) => {
    if (onCloseToast) onCloseToast(chatId);
    if (onClose) onClose();
  };

  if (toastList.length === 0) return null;

  return (
    <div
      className="notification-toast-stack"
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "350px",
        pointerEvents: "none",
      }}
    >
      {toastList.map((t) => (
        <ToastItem
          key={t.chatId || t.id || Math.random()}
          toast={t}
          onClose={() => handleClose(t.chatId || t.id)}
          onClick={() => onClickToast && onClickToast(t.chatId)}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose, onClick }) {
  useEffect(() => {
    // Each toast stays for 60 seconds (1 minute) unless closed manually
    const timer = setTimeout(() => {
      onClose();
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.updatedAt, toast.chatId, onClose]);

  return (
    <div
      onClick={() => {
        if (onClick && toast.chatId) {
          onClick(toast.chatId);
        }
      }}
      style={{
        pointerEvents: "auto",
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--purple-border, #e2d9fc)",
        borderRadius: "14px",
        padding: "12px 16px",
        boxShadow: "0 10px 30px rgba(110, 86, 207, 0.25)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        width: "320px",
        animation: "slideInToast 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        transition: "all 0.2s ease",
      }}
    >
      <img
        src={toast.avatar || "/default-avatar.svg"}
        alt={toast.senderName || "ผู้ส่ง"}
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--purple-primary, #6e56cf)",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-main, #1e1b4b)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {toast.senderName || "ผู้ส่ง"}
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--purple-primary, #6e56cf)",
              fontWeight: 600,
              background: "rgba(110, 86, 207, 0.1)",
              padding: "2px 6px",
              borderRadius: "10px",
            }}
          >
            {toast.channelName || "ข้อความใหม่"}
          </span>
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-secondary, #475569)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: "3px",
            lineHeight: "1.3",
          }}
        >
          {toast.content}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="ปิดการแจ้งเตือนสำหรับแชทนี้"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-tertiary, #94a3b8)",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          borderRadius: "50%",
          transition: "color 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e74c3c")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary, #94a3b8)")}
      >
        <X size={15} />
      </button>
    </div>
  );
}
