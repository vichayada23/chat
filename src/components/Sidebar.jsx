"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Megaphone,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
  Code,
  Search,
  Plus,
  Hash,
  User,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  MoreVertical,
  Pin,
  BellOff,
  Bell,
  Archive,
  Trash2,
  LogOut,
  ExternalLink,
  PanelLeftClose,
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

export default function Sidebar({
  currentUser,
  channels,
  directMessages,
  activeId,
  onSelectChat,
  isOpen,
  onCloseMobile,
  onOpenCreateChannelModal,
  onOpenAddFriendModal,
  onOpenSettingsModal,
  onTogglePinChat,
  onToggleMuteChat,
  onArchiveChat,
  onDeleteChat,
  onLogout,
  onOpenChatHead,
  friendRequests = [],
  sentRequests = [],
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onCancelSentRequest,
  onUnfriend,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenChatId, setMenuOpenChatId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenChatId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filterChat = (item) =>
    item &&
    item.name &&
    typeof item.name === "string" &&
    item.name.toLowerCase().includes((searchTerm || "").toLowerCase()) &&
    !item.isArchived;

  const sortChats = (a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  };

  const filteredChannels = channels.filter(filterChat).sort(sortChats);
  const filteredDms = directMessages.filter(filterChat).sort(sortChats);

  const renderChannelIcon = (iconId) => {
    const IconComp = ICON_MAP[iconId] || Hash;
    return <IconComp size={16} />;
  };

  const toggleMenu = (e, chatId) => {
    e.stopPropagation();
    setMenuOpenChatId((prev) => (prev === chatId ? null : chatId));
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <MessageSquare size={22} color="white" />
          </div>
          <div>
            <div className="brand-title">PULSE CONNECT</div>
            <div className="brand-subtitle">Enterprise Workspace</div>
          </div>
        </div>
      </div>

      {/* Current User Profile Card */}
      <div
        className="user-profile-bar clickable"
        onClick={onOpenSettingsModal}
        title="คลิกเพื่อตั้งค่าโปรไฟล์และธีมระบบ"
      >
        <div className="avatar-wrapper">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="avatar-img"
          />
          <span className={`status-dot status-${currentUser.status}`} />
        </div>
        <div className="user-info-text">
          <div className="user-name">{currentUser.name}</div>
          <div className="user-role">{currentUser.role}</div>
        </div>
        <div className="settings-gear-icon">
          <Settings size={16} color="var(--purple-primary)" />
        </div>
      </div>

      {/* Search Input */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={15} />
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาแชท หรือเพื่อนร่วมงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation Lists */}
      <div className="sidebar-nav">
        {/* Channels */}
        <div className="nav-section-title">
          <span>ช่องทางแชทกลุ่ม ({filteredChannels.length})</span>
          <button
            className="add-channel-btn"
            onClick={onOpenCreateChannelModal}
            title="สร้างกลุ่มแชทใหม่"
          >
            <Plus size={15} />
          </button>
        </div>
        {filteredChannels.map((ch) => {
          const isActive = activeId === ch.id;
          const isMenuOpen = menuOpenChatId === ch.id;

          return (
            <div
              key={ch.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => {
                onSelectChat(ch.id, "channel");
                if (onCloseMobile) onCloseMobile();
              }}
              style={{ position: "relative" }}
            >
              <div className="nav-item-left">
                <span className="nav-icon-wrapper">
                  {renderChannelIcon(ch.iconId)}
                </span>
                <span className="nav-item-name">{ch.name}</span>
                {ch.isPinned && <Pin size={12} color="var(--purple-primary)" style={{ marginLeft: "2px" }} />}
                {ch.isMuted && <BellOff size={12} color="var(--text-muted)" style={{ marginLeft: "2px" }} />}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {ch.unread > 0 && !ch.isMuted && (
                  <span className="unread-badge">{ch.unread}</span>
                )}

                <button
                  className="chat-three-dots-btn"
                  onClick={(e) => toggleMenu(e, ch.id)}
                  title="ตัวเลือกแชท"
                >
                  <MoreVertical size={14} />
                </button>
              </div>

              {isMenuOpen && (
                <div className="chat-context-menu" ref={menuRef}>
                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChatHead(ch.id, "channel");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <ExternalLink size={14} color="var(--purple-primary)" />
                    <span>เปิดแชทเฮด (Chat Head)</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinChat(ch.id, "channel");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <Pin size={14} />
                    <span>{ch.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดแชท"}</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMuteChat(ch.id, "channel");
                      setMenuOpenChatId(null);
                    }}
                  >
                    {ch.isMuted ? <Bell size={14} /> : <BellOff size={14} />}
                    <span>{ch.isMuted ? "เปิดการแจ้งเตือน" : "ปิดการแจ้งเตือน"}</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveChat(ch.id, "channel");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <Archive size={14} />
                    <span>เก็บแชทนี้ (Archive)</span>
                  </button>

                  <button
                    className="context-menu-item danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(ch.id, "channel");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>ลบแชทนี้</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {/* Incoming Friend Requests */}
        {friendRequests && friendRequests.length > 0 && (
          <div className="friend-requests-section" style={{ padding: "0 8px 12px 8px" }}>
            <div className="nav-section-title" style={{ paddingLeft: "4px" }}>
              <span>คำขอเป็นเพื่อน ({friendRequests.length})</span>
            </div>
            {friendRequests.map((req) => (
              <div key={req.id} className="friend-request-item" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                margin: "4px 0",
                borderRadius: "8px",
                background: "rgba(99, 102, 241, 0.06)",
                border: "1px solid rgba(99, 102, 241, 0.12)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <img src={req.avatar || "/default-avatar.svg"} alt={req.name} style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    objectFit: "cover"
                  }} />
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "100px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.name}</span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.email || "ส่งคำขอมา"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => onAcceptFriendRequest(req)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "#22C55E",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      boxShadow: "0 1px 3px rgba(34, 197, 94, 0.2)"
                    }}
                  >
                    รับ
                  </button>
                  <button
                    onClick={() => onRejectFriendRequest(req.id)}
                    style={{
                      padding: "4px 6px",
                      borderRadius: "6px",
                      background: "rgba(239, 68, 68, 0.08)",
                      color: "#EF4444",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: "500"
                    }}
                  >
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sent Friend Requests */}
        {sentRequests && sentRequests.length > 0 && (
          <div className="sent-requests-section" style={{ padding: "0 8px 12px 8px" }}>
            <div className="nav-section-title" style={{ paddingLeft: "4px" }}>
              <span>คำขอที่ส่งแล้ว ({sentRequests.length})</span>
            </div>
            {sentRequests.map((req) => (
              <div key={req.id} className="friend-request-item" style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                margin: "4px 0",
                borderRadius: "8px",
                background: "rgba(107, 114, 128, 0.06)",
                border: "1px solid rgba(107, 114, 128, 0.12)"
              }}>
                <div style={{ display: "flex", flexDirection: "column", maxWidth: "140px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.name}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#6366F1", fontWeight: "500" }}>⏳ รอตอบรับ</span>
                  <button
                    onClick={() => onCancelSentRequest && onCancelSentRequest(req.id)}
                    style={{
                      padding: "3px 6px",
                      borderRadius: "5px",
                      background: "rgba(239, 68, 68, 0.08)",
                      color: "#EF4444",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "10px",
                      fontWeight: "500"
                    }}
                    title="ยกเลิกคำขอเป็นเพื่อนนี้"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Direct Messages */}
        <div className="nav-section-title" style={{ marginTop: "18px" }}>
          <span>ข้อความส่วนตัว ({filteredDms.length})</span>
          <button
            className="add-channel-btn"
            onClick={onOpenAddFriendModal}
            title="เพิ่มเพื่อน / เริ่มแชทใหม่"
          >
            <UserPlus size={14} />
          </button>
        </div>
        {filteredDms.map((dm) => {
          const isActive = activeId === dm.id;
          const isMenuOpen = menuOpenChatId === dm.id;

          return (
            <div
              key={dm.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => {
                onSelectChat(dm.id, "dm");
                if (onCloseMobile) onCloseMobile();
              }}
              style={{ position: "relative" }}
            >
              <div className="nav-item-left">
                <div className="avatar-wrapper" style={{ width: "24px", height: "24px" }}>
                  <img
                    src={dm.avatar}
                    alt={dm.name}
                    className="avatar-img"
                    style={{ width: "24px", height: "24px" }}
                  />
                  <span
                    className={`status-dot status-${dm.status}`}
                    style={{ width: "8px", height: "8px", border: "1px solid white" }}
                  />
                </div>
                <span className="nav-item-name">{dm.name}</span>
                {dm.isPinned && <Pin size={12} color="var(--purple-primary)" style={{ marginLeft: "2px" }} />}
                {dm.isMuted && <BellOff size={12} color="var(--text-muted)" style={{ marginLeft: "2px" }} />}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {dm.unread > 0 && !dm.isMuted && (
                  <span className="unread-badge">{dm.unread}</span>
                )}

                <button
                  className="chat-three-dots-btn"
                  onClick={(e) => toggleMenu(e, dm.id)}
                  title="ตัวเลือกแชท"
                >
                  <MoreVertical size={14} />
                </button>
              </div>

              {isMenuOpen && (
                <div className="chat-context-menu" ref={menuRef}>
                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChatHead(dm.id, "dm");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <ExternalLink size={14} color="var(--purple-primary)" />
                    <span>เปิดแชทเฮด (Chat Head)</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinChat(dm.id, "dm");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <Pin size={14} />
                    <span>{dm.isPinned ? "ยกเลิกปักหมุด" : "ปักหมุดแชท"}</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMuteChat(dm.id, "dm");
                      setMenuOpenChatId(null);
                    }}
                  >
                    {dm.isMuted ? <Bell size={14} /> : <BellOff size={14} />}
                    <span>{dm.isMuted ? "เปิดการแจ้งเตือน" : "ปิดการแจ้งเตือน"}</span>
                  </button>

                  <button
                    className="context-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchiveChat(dm.id, "dm");
                      setMenuOpenChatId(null);
                    }}
                  >
                    <Archive size={14} />
                    <span>เก็บแชทนี้ (Archive)</span>
                  </button>

                  <button
                    className="context-menu-item danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnfriend) {
                        onUnfriend(dm);
                      } else {
                        onDeleteChat(dm.id, "dm");
                      }
                      setMenuOpenChatId(null);
                    }}
                  >
                    <UserMinus size={14} />
                    <span>ยกเลิกเป็นเพื่อน (Unfriend)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: Sign Out Button below Direct Messages box */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={onLogout}>
          <LogOut size={16} />
          <span>ออกจากระบบ (Sign Out)</span>
        </button>
      </div>
    </aside>
  );
}
