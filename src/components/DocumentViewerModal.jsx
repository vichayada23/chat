"use client";

import React from "react";
import { X, Download, ExternalLink, FileText } from "lucide-react";

export default function DocumentViewerModal({ isOpen, attachment, onClose }) {
  if (!isOpen || !attachment) return null;

  let fileUrl = attachment.url;
  if (!fileUrl && attachment.localKey) {
    try {
      fileUrl = localStorage.getItem(attachment.localKey) || "";
    } catch (e) {}
  }

  const fileName = attachment.fileName || "เอกสารแนบ";
  const fileSize = attachment.fileSize || "";
  const ext = (attachment.fileType || fileName.split(".").pop() || "").toLowerCase();
  const isPdf = ext === "pdf" || (fileUrl && fileUrl.includes("data:application/pdf"));

  const isWord = ["doc", "docx"].includes(ext);
  const isExcel = ["xls", "xlsx"].includes(ext);
  const isPpt = ["ppt", "pptx"].includes(ext);

  const fileColor = isPdf ? "#E53935" : isWord ? "#1565C0" : isExcel ? "#2E7D32" : isPpt ? "#E64A19" : "#6E56CF";
  const fileBg = isPdf ? "#FFEBEE" : isWord ? "#E3F2FD" : isExcel ? "#E8F5E9" : isPpt ? "#FBE9E7" : "#EDE9FF";
  const fileLabel = isPdf ? "PDF Document" : isWord ? "Word Document" : isExcel ? "Excel Spreadsheet" : isPpt ? "PowerPoint Presentation" : `${ext.toUpperCase()} File`;

  const handleDownload = () => {
    if (!fileUrl) return;
    try {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  const handleOpenNewTab = () => {
    if (!fileUrl) return;
    try {
      const win = window.open("");
      if (win) {
        win.document.write(
          `<!DOCTYPE html><html><head><title>${fileName}</title><style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#2A2D32;}</style></head><body><iframe src="${fileUrl}" style="width:100%;height:100%;border:none;"></iframe></body></html>`
        );
        win.document.close();
      }
    } catch (e) {
      handleDownload();
    }
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div
        className="doc-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth: "920px",
          maxHeight: "90vh",
          background: "#FFFFFF",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #E8E4F3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#F8F7FF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: fileBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={20} color={fileColor} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#1E1B2E",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fileName}
              </div>
              <div style={{ fontSize: "12px", color: "#8E8A9F" }}>
                {fileLabel} {fileSize ? `• ${fileSize}` : ""}
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {fileUrl && (
              <>
                <button
                  onClick={handleOpenNewTab}
                  title="เปิดในแท็บใหม่"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #E8E4F3",
                    background: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1E1B2E",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <ExternalLink size={15} />
                  <span>เปิดในแท็บใหม่</span>
                </button>

                <button
                  onClick={handleDownload}
                  title="ดาวน์โหลดไฟล์"
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#6E56CF",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Download size={15} />
                  <span>ดาวน์โหลด</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              title="ปิด"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "none",
                background: "#E8E4F3",
                color: "#1E1B2E",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "4px",
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Stage Content */}
        <div style={{ flex: 1, overflow: "hidden", background: isPdf ? "#323639" : "#FAFAFC", padding: isPdf && fileUrl ? 0 : "40px 20px" }}>
          {isPdf && fileUrl ? (
            <iframe
              src={fileUrl}
              title={fileName}
              style={{
                width: "100%",
                height: "75vh",
                border: "none",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "100%",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: fileBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={42} color={fileColor} />
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#1E1B2E", margin: "0 0 6px 0" }}>{fileName}</h3>
                <p style={{ fontSize: "14px", color: "#8E8A9F", margin: 0 }}>
                  ไฟล์เอกสารประเภท {ext.toUpperCase()} {fileSize ? `(${fileSize})` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#6E56CF",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Download size={18} />
                  <span>ดาวน์โหลดไฟล์ลงเครื่อง</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
