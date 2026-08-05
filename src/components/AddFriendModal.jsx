"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, Search, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function AddFriendModal({ isOpen, onClose, onAddFriend, currentUser, directMessages = [] }) {
  const [nameInput, setNameInput] = useState("");
  const [selectedUserObj, setSelectedUserObj] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const [errorMessage, setErrorMessage] = useState("");

  const myNameNorm = (currentUser?.name || "").toLowerCase().trim();
  const myEmailNorm = (currentUser?.email || "").toLowerCase().trim();
  const myPrefix = myEmailNorm ? myEmailNorm.split("@")[0] : "";

  const isAlreadyFriend = (u) => {
    if (!directMessages || directMessages.length === 0) return false;
    const uNormName = (u.name || "").toLowerCase().trim();
    const uNormEmail = (u.email || "").toLowerCase().trim();
    const uPrefix = uNormEmail ? uNormEmail.split("@")[0] : "";

    return directMessages.some((dm) => {
      const dmName = (dm.name || "").toLowerCase().trim();
      const dmEmail = (dm.email || "").toLowerCase().trim();
      const dmPrefix = dmEmail ? dmEmail.split("@")[0] : "";

      return (
        (uNormName && dmName === uNormName) ||
        (uNormEmail && dmEmail === uNormEmail) ||
        (uPrefix && dmPrefix === uPrefix)
      );
    });
  };

  const isInputAlreadyFriend = () => {
    if (!nameInput.trim()) return false;
    const inputNorm = nameInput.toLowerCase().trim();
    return (directMessages || []).some(
      (dm) =>
        (dm.name && dm.name.toLowerCase().trim() === inputNorm) ||
        (dm.email && dm.email.toLowerCase().trim() === inputNorm)
    );
  };

  const handleCloseModal = () => {
    setNameInput("");
    setSelectedUserObj(null);
    setErrorMessage("");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    setNameInput("");
    setSelectedUserObj(null);
    setErrorMessage("");

    async function loadUsers() {
      const usersList = [];

      try {
        const localUsers = localStorage.getItem("pulse_connect_registered_users");
        if (localUsers) {
          const parsed = JSON.parse(localUsers);
          parsed.forEach((u) => {
            if (!u || !u.name) return;
            const uName = (u.name || "").toLowerCase().trim();
            const uEmail = (u.email || "").toLowerCase().trim();
            const uPrefix = uEmail ? uEmail.split("@")[0] : "";

            if (myNameNorm && uName === myNameNorm) return;
            if (myEmailNorm && uEmail === myEmailNorm) return;
            if (myPrefix && uPrefix === myPrefix) return;

            if (!usersList.some((x) => (x.email && u.email && x.email.toLowerCase() === u.email.toLowerCase()) || x.name.toLowerCase() === uName)) {
              usersList.push(u);
            }
          });
        }
      } catch (err) {}

      try {
        const res = await fetch("/api/sync-user");
        if (res.ok) {
          const data = await res.json();
          if (data && data.users && data.users.length > 0) {
            data.users.forEach((u) => {
              if (!u || (!u.name && !u.email)) return;
              const uName = (u.name || "").toLowerCase().trim();
              const uEmail = (u.email || "").toLowerCase().trim();
              const uPrefix = uEmail ? uEmail.split("@")[0] : "";

              if (myNameNorm && uName === myNameNorm) return;
              if (myEmailNorm && uEmail === myEmailNorm) return;
              if (myPrefix && uPrefix === myPrefix) return;

              if (!usersList.some((x) => (x.email && u.email && x.email.toLowerCase().trim() === uEmail) || (x.name && uName && x.name.toLowerCase().trim() === uName))) {
                usersList.push(u);
              }
            });
          }
        }
      } catch (err) {}

      if (supabase) {
        try {
          const { data: dbUsers } = await supabase.from("users").select("*");
          if (dbUsers && dbUsers.length > 0) {
            dbUsers.forEach((u) => {
              if (!u) return;
              const uName = u.name || (u.email ? u.email.split("@")[0] : "สมาชิกองค์กร");
              const uNormName = uName.toLowerCase().trim();
              const uNormEmail = (u.email || "").toLowerCase().trim();
              const uPrefix = uNormEmail ? uNormEmail.split("@")[0] : "";

              if (myNameNorm && uNormName === myNameNorm) return;
              if (myEmailNorm && uNormEmail === myEmailNorm) return;
              if (myPrefix && uPrefix === myPrefix) return;

              if (!usersList.some((x) => (x.email && u.email && x.email.toLowerCase().trim() === uNormEmail) || x.name.toLowerCase().trim() === uNormName)) {
                usersList.push({
                  id: u.id ? (String(u.id).startsWith("u-") ? String(u.id) : `u-${u.id}`) : `u-${Date.now()}`,
                  name: uName,
                  email: u.email || `${uNormName}@company.com`,
                  role: u.role || "Team Member",
                  avatar: u.avatar || "/default-avatar.svg",
                });
              }
            });
          }
        } catch (err) {}
      }

      setRegisteredUsers(usersList);
    }

    loadUsers();
  }, [isOpen, myNameNorm, myEmailNorm, myPrefix]);

  if (!isOpen) return null;

  const searchQuery = nameInput.toLowerCase().trim();
  const searchResults = registeredUsers.filter((u) => {
    if (!searchQuery) return false;
    const uName = (u.name || "").toLowerCase().trim();
    const uEmail = (u.email || "").toLowerCase().trim();
    const uPrefix = uEmail ? uEmail.split("@")[0] : "";

    if (myNameNorm && uName === myNameNorm) return false;
    if (myEmailNorm && uEmail === myEmailNorm) return false;
    if (myPrefix && uPrefix === myPrefix) return false;

    return (
      uName.includes(searchQuery) ||
      uEmail.includes(searchQuery) ||
      uPrefix.includes(searchQuery)
    );
  });

  const handleSelectUser = (u) => {
    if (isAlreadyFriend(u)) return;
    setNameInput(u.name);
    setSelectedUserObj(u);
    setErrorMessage("");
  };

  const handleAddFriendSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!nameInput.trim()) return;

    if (isInputAlreadyFriend()) {
      setErrorMessage("ผู้ใช้งานนี้เป็นเพื่อนในรายการแชทอยู่แล้ว");
      return;
    }

    const inputNorm = nameInput.trim().toLowerCase();
    const matchedUser =
      selectedUserObj ||
      registeredUsers.find(
        (u) =>
          (u.name && u.name.toLowerCase().trim() === inputNorm) ||
          (u.email && u.email.toLowerCase().trim() === inputNorm) ||
          (u.email && u.email.split("@")[0].toLowerCase().trim() === inputNorm)
      ) ||
      searchResults[0];

    if (!matchedUser || !matchedUser.email) {
      setErrorMessage("ไม่พบชื่อหรืออีเมลผู้ใช้งานนี้ในระบบ (กรุณาเลือกจากผลการค้นหาด้านล่าง)");
      return;
    }

    onAddFriend({
      id: matchedUser.id || `dm-${Date.now()}`,
      name: matchedUser.name,
      role: matchedUser.role || "Team Member",
      email: matchedUser.email,
      avatar: matchedUser.avatar || "/default-avatar.svg",
      status: "online",
      unread: 0,
      lastSeen: "ออนไลน์ในขณะนี้",
    });

    setNameInput("");
    setSelectedUserObj(null);
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "460px" }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="modal-icon-badge">
              <UserPlus size={20} color="var(--purple-primary)" />
            </div>
            <div>
              <h3 className="modal-title">เพิ่มเพื่อนร่วมงาน</h3>
              <p className="modal-subtitle">พิมพ์เพื่อค้นหาชื่อผู้ใช้งานในระบบองค์กร</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleCloseModal}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleAddFriendSubmit} className="modal-body">
          {errorMessage && (
            <div style={{ padding: "8px 12px", background: "#FFEBEE", border: "1px solid #FFCDD2", color: "#D32F2F", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Display Name Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Search size={14} color="var(--purple-primary)" />
              <span>ชื่อผู้ใช้งาน (Display Name)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="กรอกเพื่อค้นหาชื่อผู้ใช้งาน..."
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setSelectedUserObj(null);
              }}
              autoFocus
            />
          </div>

          {/* Registered Users Live Search Results List */}
          {searchQuery && (
            <div className="user-search-results" style={{ marginTop: "4px", marginBottom: "12px" }}>
              <label className="form-label" style={{ fontSize: "11px", color: "var(--purple-primary)", fontWeight: 600 }}>
                🔍 ผลการค้นหาชื่อผู้ใช้งานในระบบ ({searchResults.length}):
              </label>
              {searchResults.length === 0 ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "6px 8px" }}>
                  ไม่พบชื่อตรงในระบบ แต่ยังสามารถส่งคำขอไปยังชื่อนี้ได้
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  {searchResults.map((u) => {
                    const alreadyFriend = isAlreadyFriend(u);
                    const isSelected = selectedUserObj?.name === u.name;

                    return (
                      <div
                        key={u.id || u.name}
                        onClick={() => handleSelectUser(u)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: alreadyFriend
                            ? "rgba(16, 185, 129, 0.08)"
                            : isSelected
                            ? "rgba(110, 86, 207, 0.15)"
                            : "rgba(99, 102, 241, 0.05)",
                          border: alreadyFriend
                            ? "1px solid rgba(16, 185, 129, 0.3)"
                            : isSelected
                            ? "1px solid var(--purple-primary)"
                            : "1px solid rgba(99, 102, 241, 0.15)",
                          cursor: alreadyFriend ? "default" : "pointer",
                          opacity: alreadyFriend ? 0.85 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <img src={u.avatar || "/default-avatar.svg"} alt={u.name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                          <div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>{u.name}</div>
                            {u.email && <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>{u.email}</div>}
                          </div>
                        </div>

                        {alreadyFriend ? (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#10B981",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle size={13} /> เป็นเพื่อนแล้ว
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--purple-primary)", fontWeight: 600 }}>
                            {isSelected ? "✓ เลือกแล้ว" : "คลิกเลือก ➔"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!nameInput.trim() || isInputAlreadyFriend()}
            >
              <UserPlus size={15} style={{ marginRight: "4px" }} />
              {isInputAlreadyFriend() ? "เป็นเพื่อนกันอยู่แล้ว" : "ส่งคำขอเป็นเพื่อน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
