"use client";

import React, { useState } from "react";
import { MessageSquare, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginModal({ isOpen, onLogin }) {
  const [email, setEmail] = useState("panupong.w@company.com");
  const [password, setPassword] = useState("••••••••");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      id: "u-current",
      name: "ภานุพงศ์ วงศ์สวัสดิ์ (Panupong)",
      role: "Senior Systems Architect",
      department: "Tech & Innovation",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      status: "online",
      statusMessage: "กำลังทบทวนโครงสร้างฐานข้อมูลระบบแชท 🚀",
    });
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <MessageSquare size={32} color="white" />
          </div>
          <h2 className="login-brand-title">PULSE CONNECT</h2>
          <p className="login-brand-subtitle">Enterprise Workspace Chat System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">อีเมลองค์กร (Corporate Email)</label>
            <div className="input-with-prefix">
              <span className="input-prefix">@</span>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลของคุณ..."
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน (Password)</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน..."
                required
              />
            </div>
          </div>

          <div className="login-security-notice">
            <ShieldCheck size={16} color="var(--purple-primary)" />
            <span>เข้าสู่ระบบปลอดภัยด้วยระบบยืนยันตัวตนองค์กร</span>
          </div>

          <button type="submit" className="login-submit-btn">
            <span>เข้าสู่ระบบ (Sign In)</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
