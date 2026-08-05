"use client";

import React, { useState } from "react";
import {
  X,
  MessageSquare,
  Megaphone,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
  Code,
  Lock,
  Globe,
} from "lucide-react";

const ICON_OPTIONS = [
  { id: "MessageSquare", label: "แชททั่วไป", icon: MessageSquare },
  { id: "Megaphone", label: "ประกาศ", icon: Megaphone },
  { id: "Zap", label: "เร่งด่วน/โปรเจกต์", icon: Zap },
  { id: "Sparkles", label: "ไอเดีย/นวัตกรรม", icon: Sparkles },
  { id: "ShieldCheck", label: "รักษาความปลอดภัย", icon: ShieldCheck },
  { id: "FileText", label: "เอกสาร/HR", icon: FileText },
  { id: "Code", label: "ไอที/นักพัฒนา", icon: Code },
];

export default function CreateChannelModal({ isOpen, onClose, onCreateChannel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIconId, setSelectedIconId] = useState("MessageSquare");
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChannel({
      name: name.trim().replace(/\s+/g, "-"),
      description: description.trim() || "กลุ่มแชทสำหรับพนักงานในองค์กร",
      iconId: selectedIconId,
      isPrivate,
    });

    setName("");
    setDescription("");
    setSelectedIconId("MessageSquare");
    setIsPrivate(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <MessageSquare size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">สร้างกลุ่มแชทใหม่</h3>
              <p className="modal-subtitle">กำหนดช่องทางพูดคุยสำหรับทีมหรือโปรเจกต์</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label className="form-label">ชื่อกลุ่มแชท (Channel Name)</label>
            <div className="input-with-prefix">
              <span className="input-prefix">#</span>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น การตลาด-Q3 หรือ แจ้งปัญหาระบบ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">คำอธิบายกลุ่ม (Description)</label>
            <input
              type="text"
              className="form-input"
              placeholder="ระบุจุดประสงค์การพูดคุยของกลุ่มนี้..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">เลือกสัญลักษณ์ไอคอน (Channel Icon)</label>
            <div className="icon-selector-grid">
              {ICON_OPTIONS.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedIconId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`icon-option-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedIconId(opt.id)}
                    title={opt.label}
                  >
                    <IconComponent size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ความเป็นส่วนตัว (Privacy)</label>
            <div className="privacy-options">
              <div
                className={`privacy-card ${!isPrivate ? "selected" : ""}`}
                onClick={() => setIsPrivate(false)}
              >
                <Globe size={18} color={!isPrivate ? "var(--purple-primary)" : "var(--text-muted)"} />
                <div>
                  <div className="privacy-title">สาธารณะ (Public)</div>
                  <div className="privacy-desc">ทุกคนในองค์กรสามารถมองเห็นและเข้าร่วมได้</div>
                </div>
              </div>

              <div
                className={`privacy-card ${isPrivate ? "selected" : ""}`}
                onClick={() => setIsPrivate(true)}
              >
                <Lock size={18} color={isPrivate ? "var(--purple-primary)" : "var(--text-muted)"} />
                <div>
                  <div className="privacy-title">ส่วนตัว (Private)</div>
                  <div className="privacy-desc">เฉพาะคนที่ได้รับเชิญเท่านั้นจึงจะมองเห็น</div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              สร้างกลุ่มแชท
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
