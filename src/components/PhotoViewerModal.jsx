"use client";

import React from "react";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export default function PhotoViewerModal({
  isOpen,
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  if (!isOpen || !photo) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Top Control Bar */}
        <div className="lightbox-header">
          <div className="lightbox-meta">
            <span className="lightbox-filename">{photo.fileName || "รูปภาพสื่อสารในแชท"}</span>
            {photo.sender && (
              <span className="lightbox-sender">
                ส่งโดย {photo.sender} • {photo.timestamp || "วันนี้"}
              </span>
            )}
          </div>

          <div className="lightbox-tools">
            <a
              href={photo.url}
              target="_blank"
              rel="noreferrer"
              className="lightbox-tool-btn"
              title="ดาวน์โหลดรูปภาพ"
              download
            >
              <Download size={18} />
            </a>
            <button className="lightbox-tool-btn" onClick={onClose} title="ปิด">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div className="lightbox-stage">
          {hasPrev && (
            <button className="nav-arrow left" onClick={onPrev} title="รูปก่อนหน้า">
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={photo.url}
            alt={photo.fileName || "Preview"}
            className="lightbox-image"
          />

          {hasNext && (
            <button className="nav-arrow right" onClick={onNext} title="รูปถัดไป">
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
