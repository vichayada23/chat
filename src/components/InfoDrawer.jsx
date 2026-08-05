"use client";

import React from "react";
import {
  Users,
  FileText,
  Image as ImageIcon,
  UserPlus,
  UserMinus,
  LogOut,
  ChevronRight,
  Download,
  Plus,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";


export default function InfoDrawer({
  activeChat,
  currentUser,
  onOpenPhotoViewer,
  onOpenAddMemberModal,
  onLeaveGroupChannel,
  onUnfriend,
  onOpenCreateAlbumModal,
  onOpenCreateNoteModal,
  onOpenThreadReply,
  albums = [],
  notes = [],
  messages = [],
  threadsState = {},
}) {
  if (!activeChat) return null;

  const isChannel = activeChat.type === "channel";

  // Filter messages that have thread replies
  const threadParentMessages = messages.filter(
    (msg) => threadsState[msg.id] && threadsState[msg.id].length > 0
  );

  const sharedPhotos = messages
    .filter((m) => m.imageAttachment && m.imageAttachment.url)
    .map((m, idx) => ({
      id: m.id || `photo-${idx}`,
      url: m.imageAttachment.url,
      fileName: m.imageAttachment.fileName || "รูปภาพสื่อ",
    }));

  const sharedFiles = messages
    .filter((m) => m.attachment && m.attachment.fileName)
    .map((m, idx) => ({
      id: m.id || `file-${idx}`,
      fileName: m.attachment.fileName,
      fileSize: m.attachment.fileSize || "1.2 MB",
      date: m.timestamp || "เมื่อครู่นี้",
    }));

  const rawMembers = isChannel
    ? (activeChat.members || [
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatar: currentUser.avatar || "/default-avatar.svg",
        },
      ])
    : [
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          avatar: currentUser.avatar || "/default-avatar.svg",
        },
        {
          id: activeChat.id,
          name: activeChat.name,
          role: activeChat.role || "Team Member",
          avatar: activeChat.avatar || "/default-avatar.svg",
        },
      ];

  const members = rawMembers.map((m, idx) => {
    if (typeof m === "string") {
      return {
        id: `mem-${idx}-${m}`,
        name: m,
        role: "Team Member",
        avatar: "/default-avatar.svg",
      };
    }
    return {
      id: m.id || m.email || `mem-${idx}-${m.name || 'user'}`,
      name: m.name || m.email || "สมาชิก",
      role: m.role || "Team Member",
      avatar: m.avatar || "/default-avatar.svg",
    };
  });

  return (
    <aside className="info-drawer">
      {/* Drawer Title & Icon */}
      <div className="drawer-header" style={{ textAlign: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
        <div
          className="drawer-chat-avatar"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--purple-primary-light)",
            border: "2px solid var(--purple-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px auto",
          }}
        >
          {isChannel ? (
            <Users size={26} color="var(--purple-primary)" />
          ) : (
            <img
              src={activeChat.avatar}
              alt={activeChat.name}
              style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover" }}
            />
          )}
        </div>
        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)" }}>
          {activeChat.name}
        </h4>
        <p style={{ fontSize: "11px", color: "var(--purple-primary)", fontWeight: 600, marginTop: "2px" }}>
          {isChannel ? "ช่องทางแชทกลุ่มองค์กร" : "ข้อความส่วนตัว (Direct Message)"}
        </p>
      </div>

      {/* Group Members Section */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>สมาชิกในกลุ่ม ({members.length})</span>
          {isChannel && (
            <button
              className="btn-add-member-trigger"
              onClick={onOpenAddMemberModal}
              title="เพิ่มสมาชิกเข้ากลุ่ม"
            >
              <UserPlus size={13} />
              <span>เพิ่มสมาชิก</span>
            </button>
          )}
        </div>

        <div className="member-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {members.map((m, idx) => (
            <div key={m.id || `member-${idx}`} className="member-list-item">
              <img
                src={m.avatar}
                alt={m.name}
                className="avatar-img"
                style={{ width: "32px", height: "32px" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="member-name">{m.name}</div>
                <div className="member-role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thread Collections Section (ชุดข้อความการตอบกลับ) */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>ชุดข้อความตอบกลับ ({threadParentMessages.length})</span>
          <MessageCircle size={14} color="var(--purple-primary)" />
        </div>

        {threadParentMessages.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
            }}
          >
            ยังไม่มีการตอบกลับ กด "ตอบกลับ" ที่ข้อความในแชทเพื่อสร้างชุดข้อความ
          </div>
        ) : (
          <div className="thread-bundles-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {threadParentMessages.map((msg) => {
              const replyCount = threadsState[msg.id]?.length || 0;
              const isLargeBundle = replyCount >= 5;

              return (
                <div
                  key={msg.id}
                  className="thread-bundle-card"
                  onClick={() => onOpenThreadReply(msg)}
                  title="คลิกเพื่อเข้าดูข้อความหลักและการตอบกลับทั้งหมด"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span className="thread-bundle-sender">{msg.senderName}</span>
                    <span className={`thread-bundle-badge ${isLargeBundle ? "large" : ""}`}>
                      {isLargeBundle ? `🔥 ชุดข้อความ (${replyCount})` : `💬 ${replyCount} ตอบกลับ`}
                    </span>
                  </div>
                  <div className="thread-bundle-snippet">"{msg.content}"</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LINE-like Photo Albums Section */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>อัลบั้มรูปภาพ ({albums.length})</span>
          <button
            className="btn-add-member-trigger"
            onClick={onOpenCreateAlbumModal}
            title="สร้างอัลบั้มใหม่แบบ LINE"
          >
            <Plus size={13} />
            <span>+ สร้างอัลบั้ม</span>
          </button>
        </div>

        {albums.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
            }}
          >
            ยังไม่มีอัลบั้ม กด "+ สร้างอัลบั้ม" เพื่อรวบรวมรูปภาพ
          </div>
        ) : (
          <div className="albums-grid-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {albums.map((album) => (
              <div
                key={album.id}
                className="album-card-item"
                onClick={() =>
                  onOpenPhotoViewer(album.photos[0])
                }
              >
                <div className="album-cover-stack">
                  <img src={album.photos[0]?.url} alt={album.title} className="album-cover-img" />
                  <span className="album-count-badge">{album.photos.length} รูป</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="album-title-text">{album.title}</div>
                  <div className="album-date-text">{album.createdAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Notes & Email Notifications Section */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>โน้ตแจ้งเตือน ({notes.length})</span>
          <button
            className="btn-add-member-trigger"
            onClick={onOpenCreateNoteModal}
            title="สร้างโน้ตแจ้งเตือนกลุ่ม"
          >
            <Plus size={13} />
            <span>+ สร้างโน้ต</span>
          </button>
        </div>

        {notes.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
            }}
          >
            ยังไม่มีโน้ตแจ้งเตือน กด "+ สร้างโน้ต" เพื่อแจ้งเตือนกลุ่ม
          </div>
        ) : (
          <div className="notes-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {notes.map((note) => (
              <div key={note.id} className="note-card-item">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div className="note-title-text">{note.title}</div>
                  {note.sendEmail && (
                    <span className="note-email-badge" title="แจ้งเตือนไปยัง Email แล้ว">
                      <Mail size={10} /> Email
                    </span>
                  )}
                </div>
                <div className="note-body-text">{note.content}</div>
                <div className="note-date-text">{note.createdAt}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Photos Gallery Section */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>รูปภาพสื่อที่แชร์ ({sharedPhotos.length})</span>
          <ImageIcon size={14} color="var(--purple-primary)" />
        </div>

        {sharedPhotos.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
            }}
          >
            ยังไม่มีรูปภาพสื่อที่แชร์ในแชทนี้
          </div>
        ) : (
          <div className="photo-gallery-grid">
            {sharedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="photo-thumb-card"
                onClick={() => onOpenPhotoViewer(photo)}
                title="คลิกเพื่อขยายดูรูปภาพ"
              >
                <img src={photo.url} alt={photo.fileName} className="photo-thumb-img" />
                <div className="photo-thumb-overlay">
                  <ChevronRight size={18} color="white" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Files Section */}
      <div>
        <div
          className="drawer-section-title"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>เอกสารแนบที่ส่ง ({sharedFiles.length})</span>
          <FileText size={14} color="var(--purple-primary)" />
        </div>

        {sharedFiles.length === 0 ? (
          <div
            style={{
              padding: "12px",
              background: "var(--bg-canvas)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
            }}
          >
            ยังไม่มีเอกสารแนบที่ส่งในแชทนี้
          </div>
        ) : (
          <div className="file-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sharedFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-canvas)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                }}
              >
                <FileText size={16} color="var(--purple-primary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.fileName}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    {file.fileSize} • {file.date}
                  </div>
                </div>
                <Download size={14} color="var(--text-muted)" style={{ cursor: "pointer" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Group Channel / Unfriend Button */}
      {isChannel ? (
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
          <button
            className="btn-leave-group"
            onClick={() => onLeaveGroupChannel(activeChat.id)}
          >
            <LogOut size={16} />
            <span>ออกจากแชทกลุ่มนี้</span>
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
          <button
            className="btn-leave-group"
            style={{ color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.2)", background: "rgba(239, 68, 68, 0.04)" }}
            onClick={() => onUnfriend && onUnfriend(activeChat)}
          >
            <UserMinus size={16} />
            <span>ยกเลิกเป็นเพื่อน (Unfriend)</span>
          </button>
        </div>
      )}
    </aside>
  );
}
