// Helper functions for user registration index, normalization, and shared channel IDs

export const normalize = (str) => (str || "").toLowerCase().trim();

export const saveUserToRegisteredList = async (userData, supabase = null) => {
  if (!userData || !userData.email) return;
  const userEmail = normalize(userData.email);
  const userName = userData.name || userEmail.split("@")[0];

  try {
    const raw = localStorage.getItem("pulse_connect_registered_users");
    let list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((u) => u.email && normalize(u.email) === userEmail);

    if (index !== -1) {
      list[index] = {
        ...list[index],
        id: userData.id || list[index].id,
        name: userName,
        email: userEmail,
        avatar: userData.avatar || list[index].avatar || "/default-avatar.svg",
        password: userData.password || list[index].password,
      };
    } else {
      list.push({
        id: userData.id,
        name: userName,
        email: userEmail,
        password: userData.password,
        avatar: userData.avatar || "/default-avatar.svg",
      });
    }
    localStorage.setItem("pulse_connect_registered_users", JSON.stringify(list));
  } catch (err) {}

  if (supabase) {
    try {
      await supabase.from("users").upsert([
        {
          id: userData.id,
          name: userName,
          email: userEmail,
          avatar: userData.avatar || "/default-avatar.svg",
        },
      ]);
    } catch (err) {}
  }
};

export const getRegisteredNameAndAvatar = (email, fallbackName) => {
  if (!email) return { name: fallbackName, avatar: "/default-avatar.svg" };
  const cleanEmail = normalize(email);
  const prefix = cleanEmail.split("@")[0];

  try {
    const localUsers = localStorage.getItem("pulse_connect_registered_users");
    if (localUsers) {
      const parsed = JSON.parse(localUsers);
      const match = parsed.find(
        (u) =>
          u.email &&
          (normalize(u.email) === cleanEmail ||
            normalize(u.email).split("@")[0] === prefix)
      );
      if (match && match.name) {
        return { name: match.name, avatar: match.avatar || "/default-avatar.svg" };
      }
    }
  } catch (err) {}

  return { name: fallbackName, avatar: "/default-avatar.svg" };
};

export const getSharedDmChannelId = (targetChatId, partnerNameInput = "", currentUser = null, directMessages = []) => {
  if (!targetChatId) return "c-1";
  if (targetChatId.startsWith("c-")) return targetChatId;

  // 1. Current user email (stable key)
  let uEmail = (currentUser?.email || "").toLowerCase().trim();
  if (!uEmail && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("pulse_connect_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        uEmail = (parsed.email || "").toLowerCase().trim();
      }
    } catch (e) {}
  }
  let uKey = uEmail ? uEmail.split("@")[0] : (currentUser?.name || "user").toLowerCase().trim();

  // 2. Partner email (stable key)
  let pEmail = "";
  if (directMessages && directMessages.length > 0) {
    const found = directMessages.find(
      (d) => d.id === targetChatId || (d.name && normalize(d.name) === normalize(partnerNameInput))
    );
    if (found && found.email) pEmail = found.email.toLowerCase().trim();
  }

  if (!pEmail && typeof window !== "undefined") {
    try {
      const rawReg = localStorage.getItem("pulse_connect_registered_users");
      if (rawReg) {
        const regList = JSON.parse(rawReg);
        const match = regList.find(
          (u) =>
            u.id === targetChatId ||
            (u.name && partnerNameInput && normalize(u.name) === normalize(partnerNameInput)) ||
            (u.email && partnerNameInput && normalize(u.email) === normalize(partnerNameInput))
        );
        if (match && match.email) pEmail = match.email.toLowerCase().trim();
      }
    } catch (e) {}
  }

  let pKey = pEmail ? pEmail.split("@")[0] : (partnerNameInput || targetChatId.replace("dm-", "")).toLowerCase().trim();

  if (uKey.includes("@")) uKey = uKey.split("@")[0];
  if (pKey.includes("@")) pKey = pKey.split("@")[0];

  if (!uKey) uKey = "user";
  if (!pKey) pKey = "partner";

  const sorted = [uKey, pKey].sort();
  return `dm-room-${sorted[0]}-${sorted[1]}`;
};

export const getMsgTimeMs = (m) => {
  if (!m) return 0;
  if (m._dbCreatedAt) {
    const t = new Date(m._dbCreatedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (m.sentAt && typeof m.sentAt === "number") return m.sentAt;
  if (m.id && typeof m.id === "string" && m.id.includes("-")) {
    const parts = m.id.split("-");
    const ts = parseInt(parts[1], 10);
    if (!isNaN(ts) && ts > 1000000000000) return ts;
  }
  return 0;
};

export const sortMessagesChronologically = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = getMsgTimeMs(a);
    const timeB = getMsgTimeMs(b);
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || "").localeCompare(b.id || "");
  });
};

export const playNotificationSound = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};
