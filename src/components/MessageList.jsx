"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { getRegisteredNameAndAvatar, sortMessagesChronologically } from "../utils/friendUtils";
import {
  FileText,
  Eye,
  Play,
  Pause,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  Smile,
  History,
  Check,
  X,
  Pin,
  MessageCircle,
  Reply,
  ExternalLink,
} from "lucide-react";

import DocumentViewerModal from "./DocumentViewerModal";

const QUICK_EMOJIS = ["👍", "💜", "❤️", "😄", "🔥", "🎉"];

export default function MessageList({
  messages,
  isTyping,
  typingUsers = [],
  currentUser,
  activeId,
  activeChat,
  onOpenPhotoViewer,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onTogglePinMessage,
  onOpenThreadReply,
  threadsState = {},
}) {
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null);
  const [showingHistoryMsgId, setShowingHistoryMsgId] = useState(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [activeDocAttachment, setActiveDocAttachment] = useState(null);
  const [nowTime, setNowTime] = useState(Date.now());

  // 1-second ticker for real-time status updates (3s sent status -> 1mเมื่อสักครู่ -> auto hide)
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMessageAgeSeconds = (msg) => {
    let sentTime = 0;
    if (msg._dbCreatedAt) {
      sentTime = new Date(msg._dbCreatedAt).getTime();
    } else if (msg.sentAt) {
      sentTime = msg.sentAt;
    } else if (msg.id && typeof msg.id === "string" && msg.id.includes("-")) {
      const parts = msg.id.split("-");
      const ts = parseInt(parts[1], 10);
      if (!isNaN(ts) && ts > 1000000000000) sentTime = ts;
    }
    if (!sentTime) return 0;
    return Math.max(0, Math.floor((nowTime - sentTime) / 1000));
  };
  
  // Calculate map of readerKey -> ID of the LATEST message they have read
  const latestMessageIdPerReader = useMemo(() => {
    const map = new Map();
    if (!messages || !Array.isArray(messages)) return map;

    messages.forEach((m) => {
      if (m && m.readBy && Array.isArray(m.readBy)) {
        m.readBy.forEach((r) => {
          const key = typeof r === "object" ? (r.id || r.name || r.email) : r;
          if (key) {
            map.set(key, m.id);
          }
        });
      }
    });

    return map;
  }, [messages]);

  const feedRef = useRef(null);
  const bottomRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);

  // 1. When activeId (chat room) changes, scroll to bottom immediately & reset popovers
  useEffect(() => {
    isUserScrolledUpRef.current = false;
    setShowScrollDownBtn(false);
    setMenuOpenMsgId(null);
    setEmojiPickerMsgId(null);
    setShowingHistoryMsgId(null);
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [activeId]);

  // 2. Close any open context menu / emoji popover / history popover when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        e.target.closest(".msg-context-menu") ||
        e.target.closest(".quick-emoji-popover") ||
        e.target.closest(".hover-icon-btn") ||
        e.target.closest(".original-history-popover")
      ) {
        return;
      }
      setMenuOpenMsgId(null);
      setEmojiPickerMsgId(null);
      setShowingHistoryMsgId(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Only auto-scroll to bottom if user has NOT manually scrolled up to read past history
  useEffect(() => {
    if (!isUserScrolledUpRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Handle scroll event on message feed container
  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

    // If user scrolled up more than 120px from bottom, allow reading history freely
    if (distanceToBottom > 120) {
      isUserScrolledUpRef.current = true;
      setShowScrollDownBtn(true);
    } else {
      isUserScrolledUpRef.current = false;
      setShowScrollDownBtn(false);
    }
  };

  const scrollToBottom = () => {
    isUserScrolledUpRef.current = false;
    setShowScrollDownBtn(false);
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const togglePlayVoice = (id) => {
    if (playingVoiceId === id) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(id);
      setTimeout(() => {
        setPlayingVoiceId(null);
      }, 3000);
    }
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

  const handleAddEmojiReaction = (msgId, emoji) => {
    if (onAddReaction) {
      onAddReaction(msgId, emoji);
    }
    setMenuOpenMsgId(null);
  };

  const sortedMessages = useMemo(() => {
    return sortMessagesChronologically(messages);
  }, [messages]);

  const isEmpty = !sortedMessages || sortedMessages.length === 0;
  const pinnedMessages = sortedMessages ? sortedMessages.filter((m) => m.isPinned) : [];

  return (
    <div className="message-feed" ref={feedRef} onScroll={handleScroll} style={{ position: "relative" }}>
      {/* Pinned Messages Top Announcement Banner */}
      {pinnedMessages.length > 0 && (
        <div className="pinned-messages-top-banner">
          <div className="pinned-banner-left">
            <Pin size={14} color="var(--purple-primary)" />
            <span className="pinned-banner-title">
              ข้อความที่ปักหมุด ({pinnedMessages.length}):
            </span>
            <span className="pinned-banner-content">
              "{pinnedMessages[pinnedMessages.length - 1].content}"
            </span>
          </div>
          <button
            className="pinned-banner-unpin-btn"
            onClick={() => {
              if (onTogglePinMessage) {
                onTogglePinMessage(pinnedMessages[pinnedMessages.length - 1].id);
              }
            }}
          >
            ยกเลิกปักหมุด
          </button>
        </div>
      )}

      {isEmpty ? (
        <div className="empty-messages-placeholder">
          <div className="empty-messages-icon">
            <MessageSquare size={32} color="var(--purple-primary)" />
          </div>
          <h3 className="empty-messages-title">ยังไม่มีข้อความในการสนทนานี้</h3>
          <p className="empty-messages-subtitle">
            เริ่มต้นการพูดคุยด้วยการพิมพ์ข้อความด้านล่างได้เลย
          </p>
        </div>
      ) : (
        <>
          <div className="chat-date-divider">
            <span>{sortedMessages[0]?.timestamp || "09:19 น."}</span>
          </div>

          {sortedMessages.map((msg) => {
            const isSystemMsg =
              msg.isSystem ||
              msg.role === "system" ||
              msg.sender === "System" ||
              msg.senderName === "System" ||
              (typeof msg.content === "string" && (
                msg.content.includes("ออกจากกลุ่ม") ||
                msg.content.includes("เข้าร่วมกลุ่ม") ||
                msg.content.includes("เพิ่มสมาชิก") ||
                msg.content.includes("เข้ากลุ่ม") ||
                msg.content.includes("สร้างกลุ่ม")
              ));

            if (isSystemMsg) {
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "16px 0",
                    width: "100%",
                    animation: "fadeInUp 0.25s ease",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(70, 85, 110, 0.55)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      borderRadius: "16px",
                      padding: "8px 24px",
                      textAlign: "center",
                      maxWidth: "85%",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255, 255, 255, 0.75)",
                        fontWeight: 500,
                        marginBottom: "2px",
                        letterSpacing: "0.4px",
                      }}
                    >
                      {msg.timestamp || "เมื่อครู่นี้"}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#ffffff",
                        fontWeight: 600,
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                      }}
                    >
                      {(() => {
                        let text = msg.content || "";
                        if (text.includes("👥 เพิ่มสมาชิกใหม่เข้าร่วมกลุ่ม:")) {
                          const names = text.split("👥 เพิ่มสมาชิกใหม่เข้าร่วมกลุ่ม:")[1]?.trim();
                          const sender = (msg.sender && msg.sender !== "System") ? msg.sender : (msg.senderName && msg.senderName !== "System") ? msg.senderName : "สมาชิก";
                          return `${sender} ได้เพิ่ม ${names} เข้าร่วมกลุ่ม`;
                        }
                        return text;
                      })()}
                    </div>
                  </div>
                </div>
              );
            }

            const isSentByMe =
              currentUser &&
              (msg.senderId === currentUser.id ||
                msg.senderName === currentUser.name ||
                (currentUser.email && msg.senderName === currentUser.email.split("@")[0]));

            const isVoiceMsg = msg.voiceDuration || msg.content?.includes("ข้อความเสียง");
            const isEditingThis = editingMsgId === msg.id;
            const isMenuOpen = menuOpenMsgId === msg.id;
            const isShowingHistory = showingHistoryMsgId === msg.id;
            const repliesList = threadsState[msg.id] || [];
            const allReadByList = msg.readBy || [];
            const readByList = allReadByList.filter((r) => {
              const key = typeof r === "object" ? (r.id || r.name || r.email) : r;
              return latestMessageIdPerReader.get(key) === msg.id;
            });
            const isGroupChat = activeChat?.type === "group" || activeChat?.type === "channel" || (activeId && (activeId.startsWith("c-") || activeId.startsWith("g-")));

            const resolvedSender = isSentByMe
              ? { name: currentUser.name, avatar: currentUser.avatar || msg.senderAvatar }
              : getRegisteredNameAndAvatar(msg.senderEmail || msg.senderName, msg.senderName);

            return (
              <div
                key={msg.id}
                className={`message-item-card ${isSentByMe ? "sent" : "received"} ${
                  msg.isPinned ? "is-pinned-msg" : ""
                }`}
              >
                {/* Bubble & Options Row */}
                <div className="message-bubble-row">
                  {/* Circle Avatar to the Left of Received Messages matching sample screenshot */}
                  {!isSentByMe && (
                    <img
                      src={resolvedSender.avatar || msg.senderAvatar || "/default-avatar.svg"}
                      alt={resolvedSender.name}
                      className="message-header-avatar"
                    />
                  )}

                  {/* Hover Action Toolbar on Left for Sent Messages matching sample screenshot: ⋮ ↵ ☺ */}
                  {isSentByMe && (
                    <div className={`message-hover-actions ${isMenuOpen || emojiPickerMsgId === msg.id ? "active" : ""}`}>
                      {/* 1. ⋮ Three Dots Options */}
                      <div style={{ position: "relative" }}>
                        <button
                          className="hover-icon-btn"
                          onClick={() => setMenuOpenMsgId(isMenuOpen ? null : msg.id)}
                          title="ตัวเลือกเพิ่มเติม"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div className="msg-context-menu right-side">
                            <button
                              className="context-menu-item"
                              onClick={() => {
                                if (onTogglePinMessage) onTogglePinMessage(msg.id);
                                setMenuOpenMsgId(null);
                              }}
                            >
                              <Pin size={13} color="var(--purple-primary)" />
                              <span>{msg.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดข้อความ"}</span>
                            </button>
                            <button
                              className="context-menu-item"
                              onClick={() => handleStartEdit(msg)}
                            >
                              <Edit2 size={13} color="var(--purple-primary)" />
                              <span>แก้ไขข้อความ</span>
                            </button>
                            <button
                              className="context-menu-item danger"
                              onClick={() => {
                                if (onDeleteMessage) onDeleteMessage(msg.id);
                                setMenuOpenMsgId(null);
                              }}
                            >
                              <Trash2 size={13} color="var(--status-busy)" />
                              <span>ยกเลิกข้อความ / ลบ</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. ↵ Reply Button */}
                      <button
                        className="hover-icon-btn"
                        onClick={() => {
                          if (onOpenThreadReply) onOpenThreadReply(msg);
                        }}
                        title="ตอบกลับข้อความ"
                      >
                        <Reply size={16} />
                      </button>

                      {/* 3. ☺ Quick Emoji Reactions */}
                      <div style={{ position: "relative" }}>
                        <button
                          className="hover-icon-btn"
                          onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                          title="ใส่ปฏิกิริยา"
                        >
                          <Smile size={16} />
                        </button>

                        {emojiPickerMsgId === msg.id && (
                          <div className="quick-emoji-popover">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className="emoji-popover-btn"
                                onClick={() => {
                                  if (onAddReaction) onAddReaction(msg.id, emoji);
                                  setEmojiPickerMsgId(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble Content */}
                  {(() => {
                    const hasCleanText =
                      msg.content &&
                      typeof msg.content === "string" &&
                      msg.content.trim() !== "" &&
                      !msg.content.startsWith("ไฟล์แนบ:");

                    const shouldShowBubble = isEditingThis || isVoiceMsg || hasCleanText;
                    if (!shouldShowBubble) return null;

                    return (
                      <div className="message-pill-bubble">
                        {isEditingThis ? (
                          <div className="inline-message-edit-box">
                            <input
                              type="text"
                              className="inline-edit-input"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit(msg.id);
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                            />
                            <div className="inline-edit-actions">
                              <button
                                className="inline-edit-btn save"
                                onClick={() => handleSaveEdit(msg.id)}
                                title="บันทึกการแก้ไข"
                              >
                                <Check size={14} />
                                <span>บันทึก</span>
                              </button>
                              <button
                                className="inline-edit-btn cancel"
                                onClick={handleCancelEdit}
                                title="ยกเลิก"
                              >
                                <X size={14} />
                                <span>ยกเลิก</span>
                              </button>
                            </div>
                          </div>
                        ) : isVoiceMsg ? (
                          <div className="voice-message-bubble">
                            <button
                              className="voice-play-btn"
                              onClick={() => togglePlayVoice(msg.id)}
                            >
                              {playingVoiceId === msg.id ? (
                                <Pause size={14} />
                              ) : (
                                <Play size={14} style={{ marginLeft: "2px" }} />
                              )}
                            </button>
                            <div className="voice-waveform">
                              <span className={`wave-bar ${playingVoiceId === msg.id ? "animating" : ""}`} />
                              <span className={`wave-bar ${playingVoiceId === msg.id ? "animating" : ""}`} />
                              <span className={`wave-bar ${playingVoiceId === msg.id ? "animating" : ""}`} />
                              <span className={`wave-bar ${playingVoiceId === msg.id ? "animating" : ""}`} />
                            </div>
                            <span className="voice-duration">{msg.voiceDuration || "0:12"}</span>
                          </div>
                        ) : (
                          <span>{msg.content}</span>
                        )}

                        {/* Edited Indicator */}
                        {msg.isEdited && (
                          <div className="edited-indicator-wrapper">
                            <span className="edited-tag">(แก้ไขแล้ว)</span>
                            <button
                              className="view-original-history-btn"
                              onClick={() =>
                                setShowingHistoryMsgId(isShowingHistory ? null : msg.id)
                              }
                            >
                              <History size={11} />
                              <span>{isShowingHistory ? "ซ่อนประวัติ" : "ดูข้อความเดิม"}</span>
                            </button>
                          </div>
                        )}

                        {/* Reaction Badges on Message Bubble */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="message-reactions-row">
                            {msg.reactions.map((r, i) => {
                              const currentUserId = currentUser?.id || currentUser?.name || "u-current";
                              const hasMyReaction = (r.users || []).includes(currentUserId);
                              return (
                                <button
                                  key={i}
                                  className={`message-reaction-pill ${hasMyReaction ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAddReaction) onAddReaction(msg.id, r.emoji);
                                  }}
                                  title={hasMyReaction ? "คลิกเพื่อยกเลิกปฏิกิริยา" : "คลิกเพื่อใส่ปฏิกิริยาเพิ่ม"}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="reaction-count">{r.count}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Attachments inside message-bubble-row */}
                  {msg.imageAttachment && msg.imageAttachment.url && (
                    <div
                      className="message-image-wrapper"
                      onClick={() => onOpenPhotoViewer(msg.imageAttachment)}
                    >
                      <img
                        src={msg.imageAttachment.url}
                        alt={msg.imageAttachment.fileName || "รูปภาพ"}
                        className="message-attached-img"
                      />
                    </div>
                  )}

                  {msg.attachment && (() => {
                    const ext = (msg.attachment.fileType || msg.attachment.fileName?.split(".").pop() || "").toLowerCase();
                    const isPdf = ext === "pdf";
                    const isWord = ["doc", "docx"].includes(ext);
                    const isExcel = ["xls", "xlsx"].includes(ext);
                    const isPpt = ["ppt", "pptx"].includes(ext);

                    // Can browser open natively? PDF yes, others download
                    const canPreview = isPdf;

                    // Choose icon color & label per type
                    const fileColor = isPdf ? "#E53935" : isWord ? "#1565C0" : isExcel ? "#2E7D32" : isPpt ? "#E64A19" : "#6E56CF";
                    const fileBg = isPdf ? "#FFEBEE" : isWord ? "#E3F2FD" : isExcel ? "#E8F5E9" : isPpt ? "#FBE9E7" : "#EDE9FF";
                    const fileLabel = isPdf ? "PDF" : isWord ? "DOC" : isExcel ? "XLS" : isPpt ? "PPT" : ext.toUpperCase() || "FILE";

                    const handleOpen = (e) => {
                      e?.stopPropagation();
                      setActiveDocAttachment(msg.attachment);
                    };

                    return (
                      <div
                        className="attachment-file-card"
                        onClick={handleOpen}
                        title={canPreview ? `เปิดดู ${msg.attachment.fileName}` : `ดาวน์โหลด ${msg.attachment.fileName}`}
                      >
                        {/* File Type Badge Icon */}
                        <div className="attachment-file-icon-wrap" style={{ background: fileBg }}>
                          <div className="attachment-file-ext-badge" style={{ color: fileColor }}>
                            <FileText size={22} color={fileColor} />
                          </div>
                        </div>

                        {/* File Info */}
                        <div className="attachment-file-info">
                          <span className="attachment-file-name">{msg.attachment.fileName}</span>
                          <div className="attachment-file-meta">
                            <span className="attachment-file-type-pill" style={{ background: fileBg, color: fileColor }}>
                              {fileLabel}
                            </span>
                            <span className="attachment-file-size">{msg.attachment.fileSize}</span>
                          </div>
                        </div>

                        {/* Open / Download icon */}
                        {msg.attachment.url && (
                          <div className="attachment-open-icon">
                            <ExternalLink size={14} color="#8E8A9F" />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Hover Action Toolbar on Right for Received Messages matching sample screenshot: ⋮ ↵ ☺ */}
                  {!isSentByMe && (
                    <div className={`message-hover-actions ${isMenuOpen || emojiPickerMsgId === msg.id ? "active" : ""}`}>
                      {/* 1. ⋮ Three Dots Options */}
                      <div style={{ position: "relative" }}>
                        <button
                          className="hover-icon-btn"
                          onClick={() => setMenuOpenMsgId(isMenuOpen ? null : msg.id)}
                          title="ตัวเลือกเพิ่มเติม"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <div className="msg-context-menu left-side">
                            <button
                              className="context-menu-item"
                              onClick={() => {
                                if (onTogglePinMessage) onTogglePinMessage(msg.id);
                                setMenuOpenMsgId(null);
                              }}
                            >
                              <Pin size={13} color="var(--purple-primary)" />
                              <span>{msg.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดข้อความ"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. ↵ Reply Button */}
                      <button
                        className="hover-icon-btn"
                        onClick={() => {
                          if (onOpenThreadReply) onOpenThreadReply(msg);
                        }}
                        title="ตอบกลับข้อความ"
                      >
                        <Reply size={16} />
                      </button>

                      {/* 3. ☺ Quick Emoji Reactions */}
                      <div style={{ position: "relative" }}>
                        <button
                          className="hover-icon-btn"
                          onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)}
                          title="ใส่ปฏิกิริยา"
                        >
                          <Smile size={16} />
                        </button>

                        {emojiPickerMsgId === msg.id && (
                          <div className="quick-emoji-popover">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                className="emoji-popover-btn"
                                onClick={() => {
                                  if (onAddReaction) onAddReaction(msg.id, emoji);
                                  setEmojiPickerMsgId(null);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sent Message Read By Status Row */}
                {isSentByMe && (
                  <div className="message-read-status-row">
                    {readByList.length > 0 ? (
                      isGroupChat ? (
                        /* Group Chat: Show circular profile picture avatars of readers */
                        <div
                          className="read-by-avatars-container"
                          title={`อ่านแล้วโดย (${readByList.length} คน):\n${readByList.map((r) => (typeof r === "object" ? r.name || r.email : r)).join("\n")}`}
                        >
                          <div className="read-by-avatars-group">
                            {readByList.slice(0, 3).map((reader, idx) => {
                              const rName = typeof reader === "object" ? (reader.name || reader.email) : reader;
                              const rAvatar = (typeof reader === "object" ? reader.avatar : null) || getRegisteredNameAndAvatar(rName, rName).avatar || "/default-avatar.svg";

                              return (
                                <img
                                  key={reader.id || idx}
                                  src={rAvatar}
                                  alt={rName || "สมาชิก"}
                                  className="read-by-avatar-img"
                                  title={`อ่านแล้วโดย: ${rName}`}
                                />
                              );
                            })}
                            {readByList.length > 3 && (
                              <span
                                className="read-by-more-badge"
                                title={`และคนอื่นๆ อีก ${readByList.length - 3} คน:\n${readByList.slice(3).map((r) => (typeof r === "object" ? r.name || r.email : r)).join("\n")}`}
                              >
                                +{readByList.length - 3} อื่นๆ
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* DM Chat: Show "เพิ่งเห็น" when recipient reads the message */
                        <span className="read-status-sent-text read-done" title="อ่านแล้ว">
                          เพิ่งเห็น
                        </span>
                      )
                    ) : (
                      (() => {
                        const ageSec = getMessageAgeSeconds(msg);
                        if (ageSec <= 1) {
                          return (
                            <span className="read-status-sent-text" title="ส่งข้อความแล้ว">
                              ✓ ส่งแล้ว
                            </span>
                          );
                        } else if (ageSec < 60) {
                          return (
                            <span className="read-status-sent-text" title="เมื่อสักครู่">
                              เมื่อสักครู่
                            </span>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                )}

                {/* Emoji Reactions Row */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="reactions-container-row">
                    {msg.reactions.map((reaction, idx) => (
                      <span
                        key={idx}
                        className="reaction-pill-badge"
                        onClick={() => onAddReaction && onAddReaction(msg.id, reaction.emoji)}
                      >
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                )}

                {/* Thread Replies Counter Badge Button */}
                {repliesList.length > 0 && (
                  <button
                    className="thread-replies-badge-btn"
                    onClick={() => onOpenThreadReply && onOpenThreadReply(msg)}
                    title="คลิกเพื่อดูและตอบกลับสายการสนทนานี้"
                  >
                    <MessageCircle size={13} />
                    <span>{repliesList.length} ข้อความตอบกลับ</span>
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Typing Indicator – matching user sample screenshot with actual user avatar */}
      {isTyping && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 20px 4px",
            animation: "fadeInUp 0.25s ease",
          }}
        >
          {/* Real Avatar image of the person currently typing */}
          {(() => {
            const typingUserName = (typingUsers && typingUsers.length > 0)
              ? typingUsers[0]
              : (activeChat?.name || null);
            const typingUserObj = typingUserName
              ? getRegisteredNameAndAvatar(typingUserName)
              : { name: "สมาชิก", avatar: "/default-avatar.svg" };

            return (
              <img
                src={typingUserObj.avatar || "/default-avatar.svg"}
                alt={typingUserObj.name || "กำลังพิมพ์"}
                className="message-header-avatar"
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              />
            );
          })()}

          {/* Bubble with 3 bouncing dots matching screenshot */}
          <div
            style={{
              background: "var(--purple-primary-light, #f0eefb)",
              border: "1px solid var(--purple-border, #E6E3F0)",
              borderRadius: "18px 18px 18px 4px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--purple-primary, #6E56CF)",
                  animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Italic text "กำลังพิมพ์..." matching screenshot */}
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #6E6A82)",
              fontStyle: "italic",
              fontWeight: 500,
            }}
          >
            กำลังพิมพ์...
          </span>
        </div>
      )}

      {/* Floating Scroll to Bottom Button when scrolled up */}
      {showScrollDownBtn && (
        <button
          onClick={scrollToBottom}
          title="เลื่อนลงไปยังข้อความล่าสุด"
          style={{
            position: "sticky",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "var(--purple-primary, #6e56cf)",
            color: "#ffffff",
            border: "none",
            borderRadius: "20px",
            padding: "8px 18px",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(110, 86, 207, 0.45)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "0 auto",
            animation: "fadeInUp 0.25s ease",
            backdropFilter: "blur(4px)",
          }}
        >
          <span>↓ ข้อความล่าสุด</span>
        </button>
      )}

      {/* Invisible anchor for auto-scroll */}
      <div ref={bottomRef} style={{ height: 1 }} />

      {/* Document Viewer Modal Overlay */}
      <DocumentViewerModal
        isOpen={!!activeDocAttachment}
        attachment={activeDocAttachment}
        onClose={() => setActiveDocAttachment(null)}
      />

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
