"use client";

import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Smile, Mic, Send, X, Play, Pause, Square } from "lucide-react";

const EMOJI_LIST = [
  "👍", "❤️", "💜", "🚀", "😊", "🎉", "💯", "📊", 
  "📄", "📁", "🔥", "✨", "👏", "😂", "🙏", "✅"
];

export default function MessageInput({ onSendMessage, activeChatName, onTyping, onStopTyping }) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  
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

  const handleSend = () => {
    if (!text.trim() && !pendingAttachment) return;
    
    if (onStopTyping) onStopTyping();
    onSendMessage({
      text: text.trim(),
      attachment: pendingAttachment,
    });

    setText("");
    setPendingAttachment(null);
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
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Compress image via canvas (max 800px wide, JPEG quality 0.72)
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
          setPendingAttachment({
            file,
            url: compressedDataUrl,
            fileName: file.name,
            fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            isImage: true,
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      // Read document files as base64 DataURL so they can be shared via Supabase
      const docReader = new FileReader();
      docReader.onload = (ev) => {
        setPendingAttachment({
          file,
          url: ev.target.result,
          fileName: file.name,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          isImage: false,
        });
      };
      docReader.readAsDataURL(file);
    }
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
        onChange={handleFileChange}
      />

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

      {/* Pending Attachment Preview Banner */}
      {pendingAttachment && (
        <div className="pending-attachment-banner">
          {pendingAttachment.isImage ? (
            <img
              src={pendingAttachment.url}
              alt={pendingAttachment.fileName}
              className="pending-thumb-img"
            />
          ) : (
            <div className="pending-file-icon">📄</div>
          )}
          <div className="pending-file-info">
            <div className="pending-file-name">{pendingAttachment.fileName}</div>
            <div className="pending-file-size">{pendingAttachment.fileSize}</div>
          </div>
          <button
            className="tool-btn"
            onClick={() => setPendingAttachment(null)}
            title="ยกเลิกไฟล์แนบ"
          >
            <X size={16} />
          </button>
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
