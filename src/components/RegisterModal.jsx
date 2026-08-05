"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านทั้ง 2 ช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษรขึ้นไป");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const newUserData = {
      id: `u-${Date.now()}`,
      name: name || "พนักงานใหม่ (New Employee)",
      role: role || "Team Member",
      department: "Corporate Team",
      email: email.trim(),
      password: password,
      avatar: "/default-avatar.svg",
      status: "online",
      statusMessage: "เพิ่งลงทะเบียนเข้าใช้งานระบบ 🚀",
    };

    // Register user to Supabase Auth & Users table
    if (supabase) {
      try {
        await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name,
              role: role,
            },
          },
        });

        // Insert into public users table
        await supabase.from("users").insert([
          {
            name: name || "พนักงานใหม่",
            email: email.trim(),
            role: role || "Team Member",
            avatar: newUserData.avatar,
            status: "online",
          },
        ]);
      } catch (err) {
        console.log("Supabase Auth registration fallback:", err);
      }
    }

    setIsSubmitting(false);
    onRegisterSuccess(newUserData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <UserPlus size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">สมัครสมาชิกใหม่องค์กร</h3>
              <p className="modal-subtitle">สร้างบัญชีผู้ใช้งานใหม่สำหรับเข้าร่วม Workspace</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "var(--status-busy)",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Display Name Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <User size={14} color="var(--purple-primary)" />
              <span>ชื่อบัญชี / ชื่อผู้ใช้งาน (Display Name)</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ภานุพงศ์ วงศ์สวัสดิ์"
              required
            />
          </div>

          {/* Job Title / Role Position Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Briefcase size={14} color="var(--purple-primary)" />
              <span>ตำแหน่งงาน / บทบาท (Job Title / Role)</span>
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

          {/* Email Address Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={14} color="var(--purple-primary)" />
              <span>อีเมลองค์กร (@Email Address)</span>
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">@</span>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="panupong.w@company.com"
                required
              />
            </div>
          </div>

          {/* Password 1 Input with Eye Toggle */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} color="var(--purple-primary)" />
              <span>รหัสผ่าน (Password)</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: "40px" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)..."
                required
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

          {/* Password Confirm 2 Input with Eye Toggle */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} color="var(--purple-primary)" />
              <span>ยืนยันรหัสผ่านอีกครั้ง (Confirm Password)</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input"
                style={{ paddingRight: "40px" }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง..."
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "ดูรหัสผ่าน"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "กำลังลงทะเบียน..." : "ยืนยันสมัครสมาชิก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
