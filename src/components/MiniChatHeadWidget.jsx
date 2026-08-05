"use client";

import React, { useState } from "react";
import {
  X,
  Minus,
  Maximize2,
  Send,
  Users,
  Smile,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";

const QUICK_EMOJIS = ["👍", "💜", "❤️", "😄", "🔥", "🎉"];

export default function MiniChatHeadWidget({
  chat,
  messages,
  currentUser,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onClose,
}) {
  const [inputText, setInputText] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEmojiSelectorMsgId, setShowEmojiSelectorMsgId] = useState(null);

  if (!chat) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage({ text: inputText });
    setInputText("");
  };

  const handleStartEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.content);
    setMenuOpenMsgId(null);
  };

  const handleSaveEdit = (msgId) => {
    if (!editText.trim()) return;
    if (onEditMessage) {
      onEditMessage(msgId, editText);
    }
    setEditingMsgId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditText("");
  };

  const handleSelectEmoji = (msgId, emoji) => {
    if (onAddReaction) {
      onAddReaction(msgId, emoji, chat.id);
    }
    setShowEmojiSelectorMsgId(null);
    setMenuOpenMsgId(null);
  };

  const isChannel = chat.type === "channel";

  return (
    <div className={`mini-chathead-container ${isMinimized ? "minimized" : ""}`}>
      {/* Mini Chathead Header */}
      <div className="mini-chathead-header">
        <div className="mini-chathead-title-group">
          <div className="mini-chathead-avatar">
            {isChannel ? (
              <Users size={16} color="white" />
            ) : (
              <img src={chat.avatar} alt={chat.name} className="avatar-img" style={{ width: "24px", height: "24px" }} />
            )}
          </div>
          <span className="mini-chathead-name">{chat.name}</span>
        </div>

        <div className="mini-chathead-actions">
          <button
            className="mini-head-action-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "ขยายแชทเฮด" : "ย่อแชทเฮด"}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minus size={13} />}
          </button>

          <button
            className="mini-head-action-btn close"
            onClick={onClose}
            title="ปิดแชทเฮด"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Mini Chathead Content (Visible when not minimized) */}
      {!isMinimized && (
        <>
          <div className="mini-chathead-messages">
            {(!messages || messages.length === 0) ? (
              <div style={{ textAlign: "center", padding: "20px 10px", fontSize: "12px", color: "var(--text-muted)" }}>
                💬 เริ่มแชทเล็กใน Chat Head ได้ทันที
              </div>
            ) : (
              messages.slice(-12).map((msg) => {
                const isMe =
                  currentUser &&
                  (msg.senderId === currentUser.id ||
                    msg.senderName === currentUser.name ||
                    (currentUser.email && msg.senderName === currentUser.email.split("@")[0]));

                const isMenuOpen = menuOpenMsgId === msg.id;
                const isEditingThis = editingMsgId === msg.id;
                const isEmojiOpen = showEmojiSelectorMsgId === msg.id;
                const reactions = msg.reactions || [];

                return (
                  <div
                    key={msg.id}
                    className={`mini-msg-clean-card ${isMe ? "sent" : "received"}`}
                  >
                    {/* Sent Message Layout: Bubble top, Time below */}
                    {isMe ? (
                      <div className="mini-sent-layout">
                        <div className="mini-bubble-action-row">
                          {/* 3 dots menu button on the left of sent message bubble */}
                          <div style={{ position: "relative" }}>
                            <button
                              className="mini-bubble-three-dots"
                              onClick={() => setMenuOpenMsgId(isMenuOpen ? null : msg.id)}
                            >
                              <MoreVertical size={14} />
                            </button>

                            {isMenuOpen && (
                              <div className="mini-msg-dropdown left-dropdown">
                                <button
                                  className="mini-dropdown-item"
                                  onClick={() => {
                                    setShowEmojiSelectorMsgId(isEmojiOpen ? null : msg.id);
                                    setMenuOpenMsgId(null);
                                  }}
                                >
                                  <Smile size={13} color="var(--purple-primary)" />
                                  <span>แสดงความรู้สึก</span>
                                </button>
                                <button
                                  className="mini-dropdown-item"
                                  onClick={() => handleStartEdit(msg)}
                                >
                                  <Edit2 size={13} color="var(--purple-primary)" />
                                  <span>แก้ไขข้อความ</span>
                                </button>
                                <button
                                  className="mini-dropdown-item danger"
                                  onClick={() => {
                                    if (onDeleteMessage) onDeleteMessage(msg.id);
                                    setMenuOpenMsgId(null);
                                  }}
                                >
                                  <Trash2 size={13} color="var(--status-busy)" />
                                  <span>ยกเลิกข้อความ</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Message bubble / Edit input */}
                          <div className="mini-msg-purple-pill">
                            {isEditingThis ? (
                              <div className="mini-inline-edit-box">
                                <input
                                  type="text"
                                  className="mini-inline-edit-input"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit(msg.id);
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                />
                                <button
                                  className="mini-edit-save-btn"
                                  onClick={() => handleSaveEdit(msg.id)}
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ) : (
                              <span>{msg.content}</span>
                            )}
                          </div>
                        </div>

                        {/* Emoji Quick Selector popover */}
                        {isEmojiOpen && (
                          <div className="mini-emoji-picker-popover">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className="mini-emoji-picker-btn"
                                onClick={() => handleSelectEmoji(msg.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reactions Row under sent bubble */}
                        {reactions.length > 0 && (
                          <div className="mini-reactions-row" style={{ alignSelf: "flex-end", marginRight: "6px" }}>
                            {reactions.map((r, idx) => (
                              <span
                                key={idx}
                                className="mini-reaction-badge"
                                onClick={() => onAddReaction && onAddReaction(msg.id, r.emoji, chat.id)}
                                style={{ marginRight: 0, marginLeft: "4px" }}
                              >
                                {r.emoji} {r.count}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mini-msg-time-tag">
                          {msg.timestamp || "เมื่อครู่นี้"}
                        </div>
                      </div>
                    ) : (
                      /* Received Message Layout: Avatar left + Bubble, Reaction below */
                      <div className="mini-received-layout">
                        <div className="mini-received-body">
                          <img
                            src={msg.senderAvatar || "/default-avatar.svg"}
                            alt={msg.senderName}
                            className="mini-msg-avatar"
                          />
                          <div className="mini-msg-purple-pill">
                            <span>{msg.content}</span>
                          </div>

                          {/* 3 dots menu button on the right of received message bubble */}
                          <div style={{ position: "relative" }}>
                            <button
                              className="mini-bubble-three-dots"
                              onClick={() => setMenuOpenMsgId(isMenuOpen ? null : msg.id)}
                            >
                              <MoreVertical size={14} />
                            </button>

                            {isMenuOpen && (
                              <div className="mini-msg-dropdown right-dropdown">
                                <button
                                  className="mini-dropdown-item"
                                  onClick={() => {
                                    setShowEmojiSelectorMsgId(isEmojiOpen ? null : msg.id);
                                    setMenuOpenMsgId(null);
                                  }}
                                >
                                  <Smile size={13} color="var(--purple-primary)" />
                                  <span>แสดงความรู้สึก</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Emoji Quick Selector popover */}
                        {isEmojiOpen && (
                          <div className="mini-emoji-picker-popover left-align">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className="mini-emoji-picker-btn"
                                onClick={() => handleSelectEmoji(msg.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reaction / Smiley Row under received bubble */}
                        <div className="mini-reactions-row">
                          {reactions.length > 0 ? (
                            reactions.map((r, idx) => (
                              <span
                                key={idx}
                                className="mini-reaction-badge"
                                onClick={() => onAddReaction && onAddReaction(msg.id, r.emoji, chat.id)}
                              >
                                {r.emoji} {r.count}
                              </span>
                            ))
                          ) : (
                            <Smile
                              size={14}
                              color="var(--text-muted)"
                              style={{ cursor: "pointer", marginLeft: "34px" }}
                              onClick={() => setShowEmojiSelectorMsgId(isEmojiOpen ? null : msg.id)}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Mini Input Form */}
          <form onSubmit={handleSend} className="mini-chathead-input-form">
            <input
              type="text"
              className="mini-chathead-input"
              placeholder="พิมพ์ข้อความในแชทเฮด..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className="mini-chathead-send-btn"
              disabled={!inputText.trim()}
            >
              <Send size={13} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
