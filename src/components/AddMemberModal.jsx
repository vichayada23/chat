"use client";

import React, { useState } from "react";
import { X, UserPlus, Search, CheckCircle2, UserX } from "lucide-react";

export default function AddMemberModal({
  isOpen,
  onClose,
  onAddMember,
  channelName,
  directMessages = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selectedMembers = directMessages.filter((c) => selectedIds.includes(c.id));
    onAddMember(selectedMembers);
    setSelectedIds([]);
    onClose();
  };

  const filteredColleagues = directMessages.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <UserPlus size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">เพิ่มสมาชิกเข้ากลุ่ม</h3>
              <p className="modal-subtitle">เชิญเพื่อนร่วมงานเข้าร่วมกลุ่ม #{channelName}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              className="search-input"
              placeholder="ค้นหาชื่อเพื่อนร่วมงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List of Colleagues */}
          <div className="add-member-list">
            {filteredColleagues.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                <UserX size={32} color="var(--purple-primary)" style={{ margin: "0 auto 10px auto", display: "block" }} />
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "4px" }}>
                  ยังไม่มีเพื่อนร่วมงานในระบบ
                </div>
                <div style={{ fontSize: "12px" }}>
                  กดปุ่ม "+ เพิ่มเพื่อนร่วมงาน" จากเมนูด้านซ้ายเพื่อเพิ่มเพื่อนใหม่ก่อน
                </div>
              </div>
            ) : (
              filteredColleagues.map((col) => {
                const isSelected = selectedIds.includes(col.id);

                return (
                  <div
                    key={col.id}
                    className={`add-member-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelect(col.id)}
                  >
                    <img src={col.avatar} alt={col.name} className="avatar-img" style={{ width: "36px", height: "36px" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="add-member-name">{col.name}</div>
                      <div className="add-member-role">{col.role || "Team Member"}</div>
                    </div>
                    {isSelected && <CheckCircle2 size={18} color="var(--purple-primary)" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
            >
              เพิ่มสมาชิกที่เลือก ({selectedIds.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
