"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  AlertCircle,
  X,
  CheckCircle,
  Send,
} from "lucide-react";

export default function LoginScreen({ onLogin, onOpenRegisterModal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Error & Forgot Password Modal States
  const [errorMessage, setErrorMessage] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) return;

    // Check registered users in localStorage for saved profile name & password validation
    let matchedUser = null;
    try {
      const localUsers = localStorage.getItem("pulse_connect_registered_users");
      if (localUsers) {
        const usersList = JSON.parse(localUsers);
        matchedUser = usersList.find(
          (u) => u.email && u.email.toLowerCase().trim() === cleanEmail
        );

        if (matchedUser && matchedUser.password) {
          if (matchedUser.password !== cleanPassword) {
            setErrorMessage("❌ รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง");
            return;
          }
        }
      }
    } catch (err) {}

    const userNameFromEmail = cleanEmail.split("@")[0] || "ผู้ใช้งาน";
    const defaultName = userNameFromEmail.charAt(0).toUpperCase() + userNameFromEmail.slice(1);
    const finalDisplayName = matchedUser && matchedUser.name ? matchedUser.name : defaultName;

    onLogin(
      {
        id: matchedUser?.id || `u-${Date.now()}`,
        name: finalDisplayName,
        role: matchedUser?.role || "Team Member",
        department: matchedUser?.department || "Enterprise Workspace",
        email: cleanEmail,
        password: cleanPassword,
        avatar: matchedUser?.avatar || "/default-avatar.svg",
        status: "online",
        statusMessage: matchedUser?.statusMessage || "พร้อมใช้งาน 🚀",
      },
      rememberMe
    );
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email.trim() || "");
    setForgotSuccess(false);
    setIsForgotModalOpen(true);
  };

  const handleSendForgotPasswordEmail = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
  };

  return (
    <div className="login-screen-wrapper">
      <div className="login-card-container">
        {/* Brand Logo Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            <MessageSquare size={36} color="white" />
          </div>
          <h2 className="login-brand-title">PULSE CONNECT</h2>
          <p className="login-brand-subtitle">
            ระบบแชทองค์กรเพื่อการสื่อสารภายในทีมอย่างปลอดภัย
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Incorrect Password Error Alert */}
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "var(--status-busy, #EF4444)",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                animation: "shake 0.3s ease",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={14} color="var(--purple-primary)" />
              <span>อีเมลองค์กร (Corporate Email)</span>
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">@</span>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="กรอกอีเมลองค์กรของคุณ เช่น name@company.com..."
                required
                autoFocus
              />
            </div>
          </div>

          {/* Password with Eye Toggle Button inside Box */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} color="var(--purple-primary)" />
              <span>รหัสผ่านบัญชีผู้ใช้ (Password)</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="กรอกรหัสผ่านบัญชีผู้ใช้..."
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

          {/* Remember Me Checkbox */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              id="remember-me-check"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ cursor: "pointer", accentColor: "var(--purple-primary)" }}
            />
            <label htmlFor="remember-me-check" style={{ cursor: "pointer" }}>
              จดจำการเข้าสู่ระบบไว้อย่างต่อเนื่อง (Stay logged in)
            </label>
          </div>

          {/* Security Notice */}
          <div className="login-security-notice">
            <ShieldCheck size={16} color="var(--purple-primary)" />
            <span>เข้าสู่ระบบปลอดภัยด้วยระบบยืนยันตัวตนองค์กร Enterprise SSL</span>
          </div>

          {/* Submit Login Button */}
          <button type="submit" className="login-submit-btn">
            <span>เข้าสู่ระบบ (Sign In)</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Bottom Action Links: Forgot Password & Register New Account */}
        <div className="login-bottom-links">
          <button
            type="button"
            className="login-bottom-link-btn"
            onClick={handleOpenForgotModal}
          >
            <KeyRound size={14} />
            <span>ลืมรหัสผ่าน?</span>
          </button>

          <span className="link-divider">•</span>

          <button
            type="button"
            className="login-bottom-link-btn primary"
            onClick={onOpenRegisterModal}
          >
            <UserPlus size={14} />
            <span>สมัครสมาชิกใหม่</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="modal-icon-badge">
                  <KeyRound size={20} color="var(--purple-primary)" />
                </div>
                <div>
                  <h3 className="modal-title">ลืมรหัสผ่าน (Reset Password)</h3>
                  <p className="modal-subtitle">ระบบรีเซ็ตรหัสผ่านและแจ้งเตือนผ่าน Email</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsForgotModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {forgotSuccess ? (
                <div style={{ textAlign: "center", padding: "16px 8px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                    }}
                  >
                    <CheckCircle size={30} color="#10B981" />
                  </div>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-main)", marginBottom: "8px" }}>
                    ส่งแจ้งเตือนไปยัง Email เรียบร้อยแล้ว!
                  </h4>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    ระบบได้ทำการส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมล <strong style={{ color: "var(--purple-primary)" }}>{forgotEmail}</strong> เรียบร้อยแล้ว กรุณาตรวจสอบกล่องข้อความใน Email ของคุณ
                  </p>
                  <button
                    className="btn-primary"
                    style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    ตกลง รับทราบ
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendForgotPasswordEmail}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Mail size={14} color="var(--purple-primary)" />
                      <span>กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</span>
                    </label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">@</span>
                      <input
                        type="email"
                        className="form-input"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your-name@company.com..."
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="modal-footer" style={{ marginTop: "20px" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsForgotModalOpen(false)}
                    >
                      ยกเลิก
                    </button>
                    <button type="submit" className="btn-primary">
                      <Send size={15} style={{ marginRight: "4px" }} />
                      ส่งลิงก์ไปยัง Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
