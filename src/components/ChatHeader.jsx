"use client";

import React from "react";
import {
  Menu,
  Search,
  Pin,
  Info,
  Hash,
  User,
  MessageSquare,
  Megaphone,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
  Code,
  X,
  Phone,
  Video,
} from "lucide-react";

const ICON_MAP = {
  MessageSquare: MessageSquare,
  Megaphone: Megaphone,
  Zap: Zap,
  Sparkles: Sparkles,
  ShieldCheck: ShieldCheck,
  FileText: FileText,
  Code: Code,
};

export default function ChatHeader({
  activeChat,
  onToggleMobileSidebar,
  onToggleInfoDrawer,
  showInfoDrawer,
  onTogglePinChat,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
  onVoiceCall,
  onVideoCall,
}) {
  if (!activeChat) return null;

  const isChannel = activeChat.type === "channel";

  const renderIcon = () => {
    if (!isChannel) return <User size={18} color="var(--purple-primary)" />;
    const IconComp = ICON_MAP[activeChat.iconId] || Hash;
    return <IconComp size={18} color="var(--purple-primary)" />;
  };

  const isPinned = Boolean(activeChat.isPinned);

  return (
    <header className="chat-header">
      <div className="chat-header-info">
        <button
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          title="เมนู"
        >
          <Menu size={20} />
        </button>

        {isSearchOpen ? (
          <div className="header-search-bar-inline">
            <Search size={16} color="var(--purple-primary)" />
            <input
              type="text"
              className="header-search-input"
              placeholder={`ค้นหาข้อความใน "${activeChat.name}"...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
            />
            <button
              className="header-search-close-btn"
              onClick={onToggleSearch}
              title="ปิดการค้นหา"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div>
            <div className="chat-title">
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                {renderIcon()}
              </span>
              <span>{activeChat.name}</span>
              {isPinned && (
                <Pin size={13} color="var(--purple-primary)" style={{ marginLeft: "4px" }} />
              )}
            </div>
            <div className="chat-subtitle">
              {isChannel
                ? `📌 ${activeChat.topic} • สมาชิก ${activeChat.membersCount} คน`
                : (activeChat.lastReadTime ? `🟢 ${activeChat.role} • อ่านเมื่อ ${activeChat.lastReadTime}` : `🟢 ${activeChat.role} • ออนไลน์`)}
            </div>
          </div>
        )}
      </div>

      <div className="chat-header-actions">
        {/* 📞 Voice Call Button */}
        <button
          className="action-btn"
          onClick={onVoiceCall}
          title="โทรออก"
          style={{ color: "var(--purple-primary)" }}
        >
          <Phone size={17} />
        </button>

        {/* 🎥 Video Call Button */}
        <button
          className="action-btn"
          onClick={onVideoCall}
          title="วิดีโอคอล"
          style={{ color: "var(--purple-primary)" }}
        >
          <Video size={17} />
        </button>

        {/* 🔍 Search Button */}
        <button
          className={`action-btn ${isSearchOpen ? "active" : ""}`}
          onClick={onToggleSearch}
          title="ค้นหาข้อความในแชทนี้"
        >
          <Search size={16} />
        </button>

        {/* 📌 Pin Button */}
        <button
          className={`action-btn ${isPinned ? "active" : ""}`}
          onClick={() => {
            if (onTogglePinChat) {
              onTogglePinChat(activeChat.id, activeChat.type);
            }
          }}
          title={isPinned ? "ยกเลิกปักหมุดแชทนี้" : "ปักหมุดแชทนี้"}
        >
          <Pin size={16} />
        </button>

        {/* ℹ️ Info Drawer Toggle */}
        <button
          className={`action-btn ${showInfoDrawer ? "active" : ""}`}
          onClick={onToggleInfoDrawer}
          title="เกี่ยวกับห้องแชทนี้"
        >
          <Info size={16} />
        </button>
      </div>
    </header>
  );
}
