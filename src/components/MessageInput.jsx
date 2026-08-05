"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, Mic, Send, X, Play, Pause, Square, AlertCircle } from "lucide-react";

const EMOJI_LIST = [
  "👍", "❤️", "💜", "🚀", "😊", "🎉", "💯", "📊", 
  "📄", "📁", "🔥", "✨", "👏", "😂", "🙏", "✅"
];

export default function MessageInput({ onSendMessage, activeChatName, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [limitWarning, setLimitWarning] = useState("");
  const warningTimerRef = useRef(null);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Voice Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const showLimitWarningPopup = () => {
    setLimitWarning("ไม่สามารถอัพเกิน 5 รูปได้");
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setLimitWarning("");
    }, 5000);
  };

  const handleSend = () => {
    if (!text.trim() && pendingAttachments.length === 0) return;
    
    if (onStopTyping) onStopTyping();

    if (pendingAttachments.length > 0) {
      pendingAttachments.forEach((att, idx) => {
        onSendMessage({
          text: idx === 0 ? text.trim() : "",
          attachment: att,
        });
      });
    } else {
      onSendMessage({
        text: text.trim(),
        attachment: null,
      });
    }

    setText("");
    setPendingAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 1. Paperclip File Selection
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (pendingAttachments.length >= 5 || files.length > 5 || pendingAttachments.length + files.length > 5) {
      showLimitWarningPopup();
    }

    const availableSlots = 5 - pendingAttachments.length;
    if (availableSlots <= 0) {
      e.target.value = "";
      return;
    }

    const allowedFiles = files.slice(0, availableSlots);
    allowedFiles.forEach((file) => {
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const MAX_W = 800;
            let w = img.width;
            let h = img.height;
            if (w > MAX_W) {
              h = Math.round((h * MAX_W) / w);
              w = MAX_W;
            }
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
            setPendingAttachments((prev) => {
              if (prev.length >= 5) return prev;
              return [
                ...prev,
                {
                  id: `att-${Date.now()}-${Math.random()}`,
                  file,
                  url: compressedDataUrl,
                  fileName: file.name,
                  fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                  isImage: true,
                },
              ];
            });
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        const docReader = new FileReader();
        docReader.onload = (ev) => {
          setPendingAttachments((prev) => {
            if (prev.length >= 5) return prev;
            return [
              ...prev,
              {
                id: `att-${Date.now()}-${Math.random()}`,
                file,
                url: ev.target.result,
                fileName: file.name,
                fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                isImage: false,
              },
            ];
          });
        };
        docReader.readAsDataURL(file);
      }
    });

    e.target.value = "";
  };

  const handleRemovePendingAttachment = (idToRemove) => {
    setPendingAttachments((prev) => prev.filter((a, idx) => a.id !== idToRemove && idx !== idToRemove));
  };

  // 2. Emoji Insertion
  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
  };

  // 3. Voice Recording Trigger
  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSendVoiceMessage = () => {
    const duration = formatTime(recordingSeconds);
    onSendMessage({
      text: `🎤 ข้อความเสียง (${duration})`,
      voiceDuration: duration,
    });
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="chat-input-container">
      {/* Hidden File Input for Paperclip */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*,.pdf,.doc,.docx,.png,.jpg"
        multiple
        onChange={handleFileChange}
      />

      {/* Pop-up Alert when selecting more than 5 images (auto disappears after 5s) */}
      {limitWarning && (
        <div
          style={{
            position: "absolute",
            bottom: "85px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(220, 38, 38, 0.95)",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 10px 25px rgba(220, 38, 38, 0.35)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <AlertCircle size={18} color="#FFFFFF" />
          <span>{limitWarning}</span>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="emoji-picker-popover">
          <div className="emoji-picker-header">
            <span>เลือก Emoji</span>
            <button
              className="modal-close-btn"
              onClick={() => setShowEmojiPicker(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div className="emoji-grid">
            {EMOJI_LIST.map((emoji, index) => (
              <button
                key={index}
                className="emoji-item-btn"
                onClick={() => handleSelectEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending Attachments Preview Banner Group */}
      {pendingAttachments.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "8px 12px", background: "var(--bg-canvas)", borderTop: "1px solid var(--border-color)" }}>
          {pendingAttachments.map((att, idx) => (
            <div key={att.id || idx} className="pending-attachment-banner" style={{ margin: 0 }}>
              {att.isImage ? (
                <img
                  src={att.url}
                  alt="รูปภาพแนบ"
                  className="pending-thumb-img"
                />
              ) : (
                <>
                  <div className="pending-file-icon">📄</div>
                  <div className="pending-file-info">
                    <div className="pending-file-name">{att.fileName}</div>
                    <div className="pending-file-size">{att.fileSize}</div>
                  </div>
                </>
              )}
              <button
                className="tool-btn"
                onClick={() => handleRemovePendingAttachment(att.id || idx)}
                title="ยกเลิกไฟล์แนบ"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box or Recording Mode */}
      <div className="chat-input-box">
        {isRecording ? (
          <div className="voice-recording-box">
            <div className="recording-status">
              <span className="rec-dot" />
              <span>กำลังบันทึกเสียง ({formatTime(recordingSeconds)})</span>
              <div className="waveform-pulse">
                <span /><span /><span /><span />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={handleCancelRecording}
              >
                ยกเลิก
              </button>
              <button
                className="btn-primary"
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={handleSendVoiceMessage}
              >
                ส่งข้อความเสียง
              </button>
            </div>
          </div>
        ) : (
          <>
            <textarea
              className="input-textarea"
              rows={2}
              placeholder={`ส่งข้อความใน ${activeChatName || "ห้องแชท"}... (กด Enter เพื่อส่ง)`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim() && onTyping) onTyping();
              }}
              onBlur={() => { if (onStopTyping) onStopTyping(); }}
              onKeyDown={handleKeyDown}
            />

            <div className="input-actions-bar">
              <div className="input-tools">
                {/* 1. Paperclip Icon Button */}
                <button
                  className="tool-btn"
                  onClick={handleTriggerFileInput}
                  title="แนบไฟล์เอกสาร/รูปภาพ"
                >
                  <Paperclip size={18} />
                </button>

                {/* 2. Emoji Face Icon Button */}
                <button
                  className={`tool-btn ${showEmojiPicker ? "active" : ""}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="แทรก Emoji"
                >
                  <Smile size={18} />
                </button>

                {/* 3. Microphone Icon Button */}
                <button
                  className="tool-btn"
                  onClick={handleStartRecording}
                  title="บันทึกข้อความเสียง"
                >
                  <Mic size={18} />
                </button>
              </div>

              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!text.trim() && !pendingAttachment}
              >
                <span>ส่งข้อความ</span>
                <Send size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
