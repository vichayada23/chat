"use client";

import React, { useState } from "react";
import { X, Image as ImageIcon, Plus, Trash2, FolderPlus } from "lucide-react";

const SAMPLE_ALBUM_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600", name: "team_meeting.jpg" },
  { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600", name: "workspace_setup.jpg" },
  { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600", name: "project_dashboard.jpg" },
  { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600", name: "brainstorming.jpg" },
];

export default function CreateAlbumModal({ isOpen, onClose, onCreateAlbum }) {
  const [albumTitle, setAlbumTitle] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([SAMPLE_ALBUM_PHOTOS[0], SAMPLE_ALBUM_PHOTOS[1]]);

  if (!isOpen) return null;

  const handleAddSamplePhoto = () => {
    const nextPhoto = SAMPLE_ALBUM_PHOTOS[selectedPhotos.length % SAMPLE_ALBUM_PHOTOS.length];
    setSelectedPhotos((prev) => [...prev, { ...nextPhoto, name: `photo_${Date.now()}.jpg` }]);
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!albumTitle.trim() || selectedPhotos.length === 0) return;

    onCreateAlbum({
      title: albumTitle.trim(),
      photos: selectedPhotos,
      createdAt: "เมื่อครู่นี้",
    });

    setAlbumTitle("");
    setSelectedPhotos([SAMPLE_ALBUM_PHOTOS[0], SAMPLE_ALBUM_PHOTOS[1]]);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: "520px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <FolderPlus size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">สร้างอัลบั้มรูปภาพใหม่</h3>
              <p className="modal-subtitle">รวบรวมรูปภาพสำหรับแชทกลุ่มแบบใน LINE</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Album Title Input */}
          <div className="form-group">
            <label className="form-label">ชื่ออัลบั้ม / หัวข้อ *</label>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น ภาพบรรยากาศกิจกรรมทีม 2026, สรุปงานออกแบบ..."
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Photos Selection Grid */}
          <div className="form-group">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label className="form-label">
                รูปภาพในอัลบั้ม ({selectedPhotos.length} รูป) *
              </label>
              <button
                type="button"
                className="btn-add-member-trigger"
                onClick={handleAddSamplePhoto}
              >
                <Plus size={13} />
                <span>+ เพิ่มรูปภาพ</span>
              </button>
            </div>

            <div className="photo-gallery-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: "10px" }}>
              {selectedPhotos.map((photo, index) => (
                <div key={index} className="photo-thumb-card" style={{ height: "96px" }}>
                  <img src={photo.url} alt={photo.name} className="photo-thumb-img" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: "rgba(239, 68, 68, 0.85)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!albumTitle.trim() || selectedPhotos.length === 0}
            >
              บันทึกสร้างอัลบั้ม
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
