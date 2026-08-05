"use client";

import React, { useState } from "react";
import { X, MessageSquare, Send, CornerDownRight } from "lucide-react";
import { currentUser } from "../data/mockData";

export default function ThreadReplyModal({
  isOpen,
  onClose,
  parentMessage,
  threadReplies = [],
  onSendReply,
}) {
  const [inputText, setInputText] = useState("");

  if (!isOpen || !parentMessage) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (onSendReply) {
      onSendReply(parentMessage.id, inputText.trim());
    }
    setInputText("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "560px", height: "80vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <MessageSquare size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">สายการสนทนาโต้ตอบ (Message Thread)</h3>
              <p className="modal-subtitle">
                ตอบกลับข้อความของ {parentMessage.senderName}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Parent Message + Thread Replies */}
        <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {/* Parent Message Highlight Card */}
          <div
            style={{
              padding: "12px 14px",
              background: "var(--purple-primary-light)",
              border: "1px solid var(--purple-border)",
              borderRadius: "12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <img
                src={parentMessage.senderAvatar}
                alt={parentMessage.senderName}
                style={{ width: "24px", height: "24px", borderRadius: "50%" }}
              />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--purple-primary)" }}>
                {parentMessage.senderName}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                {parentMessage.timestamp}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>
              {parentMessage.content}
            </p>
          </div>

          {/* Replies Thread Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {threadReplies.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                }}
              >
                ยังไม่มีการตอบกลับ พิมพ์ข้อความด้านล่างเพื่อเริ่มการโต้ตอบ
              </div>
            ) : (
              threadReplies.map((reply) => {
                const isMe = reply.senderId === currentUser.id;
                return (
                  <div
                    key={reply.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                    }}
                  >
                    {!isMe && (
                      <img
                        src={reply.senderAvatar}
                        alt={reply.senderName}
                        style={{ width: "28px", height: "28px", borderRadius: "50%" }}
                      />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          textAlign: isMe ? "right" : "left",
                        }}
                      >
                        {reply.senderName} • {reply.timestamp}
                      </div>
                      <div
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          background: isMe
                            ? "var(--purple-primary)"
                            : "var(--bg-canvas)",
                          color: isMe ? "white" : "var(--text-main)",
                          border: isMe ? "none" : "1px solid var(--border-color)",
                        }}
                      >
                        {reply.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer Input Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-card)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={`พิมพ์ข้อความตอบกลับถึง ${parentMessage.senderName}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ borderRadius: "20px" }}
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!inputText.trim()}
            style={{ borderRadius: "20px", padding: "8px 16px" }}
          >
            <Send size={14} />
            <span>ตอบกลับ</span>
          </button>
        </form>
      </div>
    </div>
  );
}
