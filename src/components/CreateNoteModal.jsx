"use client";

import React, { useState } from "react";
import { X, FileText, Mail, Bell, Sparkles } from "lucide-react";

export default function CreateNoteModal({ isOpen, onClose, onCreateNote }) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    onCreateNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      sendEmail: sendEmailNotification,
      createdAt: "เมื่อครู่นี้",
    });

    setNoteTitle("");
    setNoteContent("");
    setSendEmailNotification(true);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <FileText size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">สร้างโน้ตแจ้งเตือนใหม่</h3>
              <p className="modal-subtitle">บันทึกข้อความสำคัญและแจ้งเตือนไปยัง Email สมาชิก</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Note Title */}
          <div className="form-group">
            <label className="form-label">หัวข้อโน้ต *</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น สรุปการประชุมทีมประจำสัปดาห์, กำหนดวันส่งมอบงาน..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Note Content */}
          <div className="form-group">
            <label className="form-label">รายละเอียดโน้ต *</label>
            <textarea
              className="form-input"
              rows={4}
              placeholder="พิมพ์รายละเอียดที่ต้องการแจ้งเตือนให้สมาชิกในกลุ่มรับทราบ..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Email Notification Checkbox / Toggle Card */}
          <div
            className={`privacy-card ${sendEmailNotification ? "selected" : ""}`}
            onClick={() => setSendEmailNotification(!sendEmailNotification)}
          >
            <Mail size={22} color="var(--purple-primary)" />
            <div style={{ flex: 1 }}>
              <div className="privacy-title">
                📧 ส่งแจ้งเตือนไปยัง Email สมาชิกในกลุ่มทันที
              </div>
              <div className="privacy-desc">
                ระบบจะทำการส่งอีเมลสรุปโน้ตนี้ไปยังอีเมลองค์กรของทุกคนในห้องแชทให้อัตโนมัติ
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendEmailNotification}
              onChange={() => {}}
              style={{ accentColor: "var(--purple-primary)", width: "18px", height: "18px" }}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!noteTitle.trim() || !noteContent.trim()}
            >
              โพสต์โน้ตแจ้งเตือน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
