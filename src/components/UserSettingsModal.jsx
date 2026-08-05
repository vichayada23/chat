"use client";

import React, { useState, useRef } from "react";
import {
  X,
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Camera,
} from "lucide-react";

export default function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  theme,
  onToggleTheme,
}) {
  const [name, setName] = useState(currentUser?.name || "");
  const [role, setRole] = useState(currentUser?.role || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "/default-avatar.svg");
  const [status, setStatus] = useState(currentUser?.status || "online");
  const [statusMessage, setStatusMessage] = useState(currentUser?.statusMessage || "");
  
  // Password State dynamically initialized from currentUser.password
  const [password, setPassword] = useState(currentUser?.password || "123456");
  const [showPassword, setShowPassword] = useState(false);

  const avatarInputRef = useRef(null);

  if (!isOpen) return null;

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAvatarUrl = URL.createObjectURL(file);
    setAvatar(newAvatarUrl);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateUser({
      ...currentUser,
      name,
      role,
      avatar,
      status,
      statusMessage,
      password,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "520px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <User size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">ตั้งค่าโปรไฟล์และระบบ (Settings)</h3>
              <p className="modal-subtitle">จัดการข้อมูลส่วนตัว ตำแหน่งงาน และสถานะออนไลน์</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body">
          {/* Avatar Upload Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", background: "var(--purple-primary-light)", borderRadius: "12px", border: "1px solid var(--purple-border)" }}>
            <div className="avatar-wrapper" style={{ position: "relative" }}>
              <img
                src={avatar}
                alt={name}
                className="avatar-img"
                style={{ width: "64px", height: "64px", border: "3px solid white" }}
              />
              <button
                type="button"
                className="change-avatar-badge"
                onClick={() => avatarInputRef.current?.click()}
                title="เปลี่ยนรูปโปรไฟล์"
              >
                <Camera size={14} color="white" />
              </button>
              <input
                type="file"
                ref={avatarInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
            </div>

            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)" }}>
                รูปโปรไฟล์ประจำตัว
              </div>
              <div style={{ fontSize: "11px", color: "var(--purple-primary)", marginBottom: "6px" }}>
                รองรับไฟล์ PNG, JPG (ขนาดไม่เกิน 5 MB)
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                onClick={() => avatarInputRef.current?.click()}
              >
                อัปโหลดรูปใหม่
              </button>
            </div>
          </div>

          {/* Online/Offline Status Selector */}
          <div className="form-group">
            <label className="form-label">สถานะการทำงาน (Online / Offline Status)</label>
            <div className="status-selector-grid">
              <button
                type="button"
                className={`status-option-btn ${status === "online" ? "selected" : ""}`}
                onClick={() => setStatus("online")}
              >
                <span className="status-dot status-online" style={{ position: "static" }} />
                <span>ออนไลน์ (Online)</span>
              </button>

              <button
                type="button"
                className={`status-option-btn ${status === "away" ? "selected" : ""}`}
                onClick={() => setStatus("away")}
              >
                <span className="status-dot status-away" style={{ position: "static" }} />
                <span>ไม่อยู่ (Away)</span>
              </button>

              <button
                type="button"
                className={`status-option-btn ${status === "busy" ? "selected" : ""}`}
                onClick={() => setStatus("busy")}
              >
                <span className="status-dot status-busy" style={{ position: "static" }} />
                <span>ห้ามรบกวน (Do Not Disturb)</span>
              </button>

              <button
                type="button"
                className={`status-option-btn ${status === "offline" ? "selected" : ""}`}
                onClick={() => setStatus("offline")}
              >
                <span className="status-dot status-offline" style={{ position: "static" }} />
                <span>ออฟไลน์ (Offline)</span>
              </button>
            </div>
          </div>

          {/* Edit Display Name */}
          <div className="form-group">
            <label className="form-label">ชื่อผู้ใช้งาน (Display Name)</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ระบุชื่อที่ต้องการแสดงในระบบแชท"
              required
            />
          </div>

          {/* Edit Job Title / Role */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Briefcase size={14} color="var(--purple-primary)" />
              <span>ตำแหน่งงาน / บทบาท (Role / Job Title)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="เช่น Systems Architect, Software Engineer"
              required
            />
          </div>

          {/* Disabled Email Field - Displays user's actual email */}
          <div className="form-group">
            <label className="form-label">อีเมลองค์กร (@Email Address) 🔒 [ห้ามแก้ไข]</label>
            <div className="input-with-prefix" style={{ opacity: 0.7, background: "var(--bg-canvas)" }}>
              <span className="input-prefix">@</span>
              <input
                type="email"
                className="form-input"
                value={currentUser?.email || "user@company.com"}
                disabled
                style={{ cursor: "not-allowed" }}
              />
            </div>
          </div>

          {/* View/Edit Password Field - Dynamically tied to registered password */}
          <div className="form-group">
            <label className="form-label">รหัสผ่านบัญชีผู้ใช้ (Password)</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: "40px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่านผู้ใช้งาน..."
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Light / Dark Mode Toggle */}
          <div className="form-group" style={{ background: "var(--bg-canvas)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                {theme === "dark" ? (
                  <Moon size={20} color="var(--purple-primary)" />
                ) : (
                  <Sun size={20} color="#F59E0B" />
                )}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)" }}>
                    ธีมหน้าจอ (Theme Mode)
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {theme === "dark" ? "โหมดมืด (Dark Mode)" : "โหมดสว่าง (Light Mode)"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`theme-switch-toggle ${theme === "dark" ? "active" : ""}`}
                onClick={onToggleTheme}
              >
                <div className="theme-switch-handle" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary">
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
