"use client";

import NotificationToast from "../components/NotificationToast";
import CallModal from "../components/CallModal";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import InfoDrawer from "../components/InfoDrawer";
import CreateChannelModal from "../components/CreateChannelModal";
import PhotoViewerModal from "../components/PhotoViewerModal";
import AddFriendModal from "../components/AddFriendModal";
import UserSettingsModal from "../components/UserSettingsModal";
import LoginScreen from "../components/LoginScreen";
import RegisterModal from "../components/RegisterModal";
import AddMemberModal from "../components/AddMemberModal";
import MiniChatHeadWidget from "../components/MiniChatHeadWidget";
import CreateAlbumModal from "../components/CreateAlbumModal";
import CreateNoteModal from "../components/CreateNoteModal";
import ThreadReplyModal from "../components/ThreadReplyModal";
import { MessageSquare, Sparkles, Plus, UserPlus, Menu, PanelLeftOpen } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { playNotificationSound, getSharedDmChannelId as getSharedDmChannelIdFromUtils, saveUserToRegisteredList as saveUserToRegisteredListFromUtils, getRegisteredNameAndAvatar, sortMessagesChronologically } from "../utils/friendUtils";
import { useChatSync } from "../hooks/useChatSync";
import { useTypingSync } from "../hooks/useTypingSync";
import {
  currentUser as initialUserData,
  initialChannels,
  initialDirectMessages,
  initialMessages,
  mockSharedPhotos,
} from "../data/mockData";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialUserData);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  
  // Active Chat Selection State
  const [activeId, setActiveId] = useState("c-1");
  const [toastsMap, setToastsMap] = useState({}); // { [chatId]: toastObj }
  const dismissedChatIdsRef = useRef(new Set()); // Track chats user clicked 'X' on to suppress popups
  const activeIdRef = useRef(activeId);

  // Sync activeIdRef & clear toast / dismissal when switching active chat room
  useEffect(() => {
    activeIdRef.current = activeId;
    if (activeId) {
      dismissedChatIdsRef.current.delete(activeId);
      setToastsMap((prev) => {
        if (!prev[activeId]) return prev;
        const copy = { ...prev };
        delete copy[activeId];
        return copy;
      });
    }
  }, [activeId]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // ---- Real-time chat sync hook (polls /api/sync-chat-message) ----
  const handleNewMessages = React.useCallback((newMsgs) => {
    setMessagesState((prev) => {
      let updated = { ...prev };
      let changed = false;
      newMsgs.forEach((msg) => {
        if (!msg?.channelId) return;

        // Auto-mark incoming messages as read instantly if recipient has active chat room open
        const isCurrentRecipientInChat = (() => {
          if (!activeIdRef.current || !currentUserRef.current) return false;
          if (msg.senderId === currentUserRef.current.id || msg.senderName === currentUserRef.current.name) return false;
          if (activeIdRef.current === msg.channelId) return true;

          // Match DM shared channel ID
          const activeDm = (directMessagesRef.current || []).find((d) => d.id === activeIdRef.current);
          if (activeDm) {
            const sharedId = getSharedDmChannelId(activeIdRef.current, activeDm.name, currentUserRef.current, directMessagesRef.current || []);
            if (sharedId === msg.channelId) return true;
          }
          return false;
        })();

        if (isCurrentRecipientInChat) {
          const currentUserId = currentUserRef.current.id || currentUserRef.current.name;
          const readBy = msg.readBy || [];
          if (!readBy.some((r) => (typeof r === "object" ? r.id === currentUserId || r.name === currentUserRef.current.name : r === currentUserRef.current.name))) {
            const updatedReadBy = [
              ...readBy,
              {
                id: currentUserId,
                name: currentUserRef.current.name,
                avatar: currentUserRef.current.avatar || "/default-avatar.svg",
                readAt: Date.now(),
              },
            ];
            msg.readBy = updatedReadBy;

            // Sync updated readBy to Supabase IMMEDIATELY
            fetch("/api/sync-chat-message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...msg, readBy: updatedReadBy }),
            }).catch(() => {});
          }
        }

        const chId = msg.channelId;
        const existing = updated[chId] || [];
        const existingIdx = existing.findIndex((m) => m.id === msg.id);
        if (existingIdx === -1) {
          updated[chId] = sortMessagesChronologically([...existing, msg]);
          changed = true;
        } else {
          const copy = [...existing];
          copy[existingIdx] = { ...copy[existingIdx], ...msg };
          updated[chId] = sortMessagesChronologically(copy);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  const handleNotify = React.useCallback((msg) => {
    const chatId = msg.channelId;
    if (!chatId) return;

    // 1. If user clicked 'X' on this chat's toast, don't show notifications for this chat again
    if (dismissedChatIdsRef.current.has(chatId)) {
      return;
    }

    // 2. If user is currently looking at this active chat room, don't pop up a toast
    if (activeIdRef.current === chatId) {
      return;
    }

    playNotificationSound();

    // 3. Update existing toast box for this chatId (ทับข้อความเดิมของแชทนั้น)
    // or add a new box if it's a different chat (ขึ้นอีกกล่อง)
    setToastsMap((prev) => ({
      ...prev,
      [chatId]: {
        chatId: chatId,
        avatar: msg.senderAvatar || msg.avatar || "/default-avatar.svg",
        senderName: msg.sender || msg.senderName || "ผู้ส่ง",
        channelName: "ข้อความใหม่",
        content: typeof msg.content === "string" ? msg.content : "ส่งไฟล์แนบ",
        updatedAt: Date.now(),
      },
    }));

    if (typeof document !== "undefined") {
      document.title = "🔔 ข้อความใหม่ - Tasky";
    }
  }, []);

  const handleCloseToast = React.useCallback((chatId) => {
    if (chatId) {
      dismissedChatIdsRef.current.add(chatId); // Suppress future popups for this chat after user clicks 'X'
      setToastsMap((prev) => {
        const copy = { ...prev };
        delete copy[chatId];
        return copy;
      });
    } else {
      setToastsMap({});
    }
    if (typeof document !== "undefined") document.title = "Tasky Connect";
  }, []);

  const handleClickToast = React.useCallback((chatId) => {
    if (chatId) {
      setActiveId(chatId);
      dismissedChatIdsRef.current.delete(chatId);
      setToastsMap((prev) => {
        const copy = { ...prev };
        delete copy[chatId];
        return copy;
      });
    }
    if (typeof document !== "undefined") document.title = "Tasky Connect";
  }, []);

  // Handle messages deleted by other users (detected via full-sync diff)
  const handleDeletedIds = React.useCallback((deletedIds) => {
    setMessagesState((prev) => {
      const updated = { ...prev };
      let changed = false;
      Object.keys(updated).forEach((chId) => {
        const before = updated[chId] || [];
        const after = before.filter((m) => !deletedIds.includes(m.id));
        if (after.length !== before.length) {
          updated[chId] = after;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  useChatSync(currentUser, isLoggedIn, handleNewMessages, handleNotify, handleDeletedIds);

  const handleTypingChange = React.useCallback((anyoneTyping, users) => {
    setIsRemoteTyping(anyoneTyping);
    setTypingUsers(users);
  }, []);

  // activeTypingChannelIdRef is set AFTER getSharedDmChannelId is defined (below).
  // useTypingSync reads from this ref so it always gets the latest value.
  const _activeTypingChIdRef = useRef(null);

  const { notifyTyping, notifyStoppedTyping } = useTypingSync(
    _activeTypingChIdRef,   // pass ref — hook will read .current
    currentUser?.name,
    isLoggedIn,
    handleTypingChange
  );
  // ------------------------------------------------------------------
  const [messagesState, setMessagesState] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [callState, setCallState] = useState({ isOpen: false, callType: "voice" });
  const [typingUsers, setTypingUsers] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);

  // Auto-close Info Drawer when changing active chat room
  useEffect(() => {
    setShowInfoDrawer(false);
  }, [activeId]);

  // Albums & Notes State
  const [albumsState, setAlbumsState] = useState({});
  const [notesState, setNotesState] = useState({});

  // Threads State
  const [threadsState, setThreadsState] = useState({});
  const [activeThreadParent, setActiveThreadParent] = useState(null);

  // Chat Header Search State
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);

  // Chat Head Widget State
  const [activeChatHeadId, setActiveChatHeadId] = useState(null);

  // Theme State (light vs dark)
  const [theme, setTheme] = useState("light");

  // Ref to always have latest directMessages (avoids stale closures in polling)
  const directMessagesRef = useRef([]);
  useEffect(() => {
    directMessagesRef.current = directMessages;
  }, [directMessages]);

  // Modal States
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [viewingPhotoObj, setViewingPhotoObj] = useState(null);

  // Load User Login Session from LocalStorage on mount
  useEffect(() => {
    try {
      const savedLoginState = localStorage.getItem("pulse_connect_logged_in");
      const savedUser = localStorage.getItem("pulse_connect_user");

      if (savedLoginState === "true" && savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } catch (err) {
      console.log("LocalStorage login load fallback");
    }
  }, []);

  // Load user-specific data when user changes
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      // Reset state if not logged in
      setChannels([]);
      setDirectMessages([]);
      setFriendRequests([]);
      setMessagesState({});
      setAlbumsState({});
      setNotesState({});
      setThreadsState({});
      return;
    }

    const suffix = currentUser.id;
    saveUserToRegisteredList(currentUser);
    try {
      const savedChannels = localStorage.getItem(`pulse_connect_channels_${suffix}`);
      const savedDms = localStorage.getItem(`pulse_connect_dms_${suffix}`);
      const savedFriendRequests = localStorage.getItem(`pulse_connect_friend_requests_${suffix}`);
      const savedMessages = localStorage.getItem(`pulse_connect_messages_${suffix}`);
      const savedAlbums = localStorage.getItem(`pulse_connect_albums_${suffix}`);
      const savedNotes = localStorage.getItem(`pulse_connect_notes_${suffix}`);
      const savedThreads = localStorage.getItem(`pulse_connect_threads_${suffix}`);

      if (savedChannels) setChannels(JSON.parse(savedChannels));
      else setChannels([]);

      if (savedDms) setDirectMessages(JSON.parse(savedDms));
      else setDirectMessages([]);

      if (savedFriendRequests) setFriendRequests(JSON.parse(savedFriendRequests));
      else setFriendRequests([]);

      if (savedMessages) setMessagesState(JSON.parse(savedMessages));
      else setMessagesState({});

      if (savedAlbums) setAlbumsState(JSON.parse(savedAlbums));
      else setAlbumsState({});

      if (savedNotes) setNotesState(JSON.parse(savedNotes));
      else setNotesState({});

      if (savedThreads) setThreadsState(JSON.parse(savedThreads));
      else setThreadsState({});
    } catch (err) {
      console.log("Error loading user-specific data", err);
    }

    // Direct Database Fetching from Supabase
    async function loadFromSupabase() {
      if (!supabase) return;
      try {
        // Fetch channels from Supabase Database
        const { data: dbChannels } = await supabase
          .from("channels")
          .select("*")
          .order("created_at", { ascending: true });

        if (dbChannels && dbChannels.length > 0) {
          const formattedChannels = dbChannels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            type: ch.type || "channel",
            unread: 0,
            iconId: ch.icon_id || "MessageSquare",
            description: ch.topic || "กลุ่มแชทสาธารณะองค์กร",
            topic: ch.topic || "กลุ่มแชทสร้างบน Supabase",
            membersCount: 1,
            isPinned: ch.is_pinned || false,
          }));

          setChannels((prev) => {
            const combined = [...prev];
            formattedChannels.forEach((fc) => {
              if (!combined.some((c) => c.id === fc.id || c.name === fc.name)) {
                combined.push(fc);
              }
            });
            return combined;
          });
        }

        // Chat message polling is handled by useChatSync hook
      } catch (err) {
        console.log("Supabase initial fetch fallback", err);
      }
    }

    // Cross-account Friend Requests Sync
    const syncCrossAccountFriendRequests = async () => {
      if (!currentUser) return;

      const normalize = (str) => (str || "").toLowerCase().trim();
      const userEmailNorm = normalize(currentUser.email || "");
      const userNameNorm = normalize(currentUser.name);
      const userPrefixNorm = userEmailNorm ? userEmailNorm.split("@")[0] : "";

      const isMockOrDummy = (r) => {
        if (!r) return true;
        const sEm = normalize(r.senderEmail);
        const rEm = normalize(r.receiverEmail);
        const sNm = normalize(r.senderName);
        const rNm = normalize(r.receiverName);
        return (
          sEm.includes("@company.com") ||
          rEm.includes("@company.com") ||
          sNm.includes("ผู้ใช้งาน (User)") ||
          rNm.includes("ผู้ใช้งาน (User)") ||
          sEm === "user@company.com" ||
          rEm === "user@company.com" ||
          sNm === "user" ||
          rNm === "user"
        );
      };

      try {
        const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
        let globalList = globalRaw ? JSON.parse(globalRaw) : [];

        // Fetch cross-account friend requests from API route (bypassing RLS safely)
        try {
          const res = await fetch("/api/sync-friend-request");
          if (res.ok) {
            const data = await res.json();
            if (data && data.requests && data.requests.length > 0) {
              data.requests.forEach((reqObj) => {
                if (isMockOrDummy(reqObj)) return;
                const existingIdx = globalList.findIndex(
                  (g) =>
                    g.id === reqObj.id ||
                    (normalize(g.senderEmail) === normalize(reqObj.senderEmail) &&
                      normalize(g.receiverEmail) === normalize(reqObj.receiverEmail)) ||
                    (normalize(g.senderName) === normalize(reqObj.senderName) &&
                      normalize(g.receiverName) === normalize(reqObj.receiverName))
                );
                if (existingIdx !== -1) {
                  globalList[existingIdx] = {
                    ...globalList[existingIdx],
                    ...reqObj,
                  };
                } else {
                  globalList.push(reqObj);
                }
              });
            }
          }
        } catch (err) {}

        globalList = globalList.filter((g) => !isMockOrDummy(g));
        try {
          localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
        } catch (err) {}

        const isReceiver = (r) => {
          const rEmail = normalize(r.receiverEmail);
          const rName = normalize(r.receiverName);
          const rPrefix = rEmail ? rEmail.split("@")[0] : "";

          const uEmail = userEmailNorm;
          const uName = userNameNorm;
          const uPrefix = userPrefixNorm;

          if (rEmail && uEmail && (rEmail === uEmail || rPrefix === uPrefix)) return true;
          if (rName && uName && (rName === uName || rName === uPrefix)) return true;
          if (rEmail && uName && rEmail.split("@")[0] === uName.split("@")[0]) return true;

          return false;
        };

        const isSender = (r) => {
          const sId = r.senderId;
          const sEmail = normalize(r.senderEmail);
          const sName = normalize(r.senderName);
          const sPrefix = sEmail ? sEmail.split("@")[0] : "";

          const uId = currentUser.id;
          const uEmail = userEmailNorm;
          const uName = userNameNorm;
          const uPrefix = userPrefixNorm;

          if (sId && sId === uId) return true;
          if (sEmail && uEmail && (sEmail === uEmail || sPrefix === uPrefix)) return true;
          if (sName && uName && sName === uName && !isReceiver(r)) return true;

          return false;
        };

        // Collect all accepted partner names & emails
        const acceptedPartnerKeys = new Set();
        const acceptedPartnerList = [];

        globalList.forEach((r) => {
          if (r.status === "accepted") {
            if (isSender(r)) {
              const partnerKey = normalize(r.receiverEmail) || normalize(r.receiverName);
              acceptedPartnerKeys.add(partnerKey);

              const partnerInfo = getRegisteredNameAndAvatar(r.receiverEmail, r.receiverName);
              const partnerDisplayName = partnerInfo.name || r.receiverName || r.receiverEmail || "เพื่อนร่วมงาน";

              acceptedPartnerList.push({
                id: `dm-${partnerKey}`,
                name: partnerDisplayName,
                email: r.receiverEmail,
                avatar: partnerInfo.avatar || "/default-avatar.svg",
              });
            } else if (isReceiver(r)) {
              const partnerKey = normalize(r.senderEmail) || normalize(r.senderName);
              acceptedPartnerKeys.add(partnerKey);

              const partnerInfo = getRegisteredNameAndAvatar(r.senderEmail, r.senderName);
              const partnerDisplayName = partnerInfo.name || r.senderName || r.senderEmail || "เพื่อนร่วมงาน";

              acceptedPartnerList.push({
                id: `dm-${r.senderId || partnerKey}`,
                name: partnerDisplayName,
                email: r.senderEmail,
                avatar: partnerInfo.avatar || r.senderAvatar || "/default-avatar.svg",
              });
            }
          }
        });

        // Add accepted partners to directMessages for BOTH sender and receiver
        if (acceptedPartnerList.length > 0) {
          setDirectMessages((prev) => {
            let updated = [...prev];
            let changed = false;

            acceptedPartnerList.forEach((partner) => {
              if (!partner.name) return;

              const existingIdx = updated.findIndex(
                (dm) =>
                  dm.id === partner.id ||
                  (dm.name && normalize(dm.name) === normalize(partner.name)) ||
                  (dm.email && partner.email && normalize(dm.email) === normalize(partner.email))
              );

              if (existingIdx !== -1) {
                if (updated[existingIdx].isArchived || updated[existingIdx].name !== partner.name) {
                  updated[existingIdx] = {
                    ...updated[existingIdx],
                    name: partner.name,
                    isArchived: false,
                  };
                  changed = true;
                }
              } else {
                updated.push({
                  id: partner.id,
                  name: partner.name,
                  role: "Team Member",
                  email: partner.email,
                  avatar: partner.avatar,
                  status: "online",
                  unread: 0,
                  lastSeen: "ออนไลน์ในขณะนี้",
                  isArchived: false,
                });
                changed = true;
              }
            });

            if (changed) {
              try {
                localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
              } catch (err) {}
            }
            return updated;
          });
        }

        // 1. Incoming pending requests for currentUser (not yet in directMessages)
        const incoming = globalList.filter((r) => {
          if (!isReceiver(r) || r.status !== "pending" || isMockOrDummy(r)) return false;
          const sEmail = normalize(r.senderEmail);
          const sName = normalize(r.senderName);
          const sPrefix = sEmail ? sEmail.split("@")[0] : "";
          const isAlreadyFriend = directMessages.some(
            (dm) =>
              (sEmail && normalize(dm.email) === sEmail) ||
              (sName && normalize(dm.name) === sName) ||
              (sPrefix && dm.email && normalize(dm.email).split("@")[0] === sPrefix)
          );
          return !isAlreadyFriend;
        });

        // 2. Sent pending requests from currentUser (not yet in directMessages)
        const sent = globalList.filter((r) => {
          if (!isSender(r) || r.status !== "pending" || isMockOrDummy(r)) return false;
          const rEmail = normalize(r.receiverEmail);
          const rName = normalize(r.receiverName);
          const rPrefix = rEmail ? rEmail.split("@")[0] : "";
          const isAlreadyFriend = directMessages.some(
            (dm) =>
              (rEmail && normalize(dm.email) === rEmail) ||
              (rName && normalize(dm.name) === rName) ||
              (rPrefix && dm.email && normalize(dm.email).split("@")[0] === rPrefix)
          );
          return !isAlreadyFriend;
        });

        // Deduplicate sent list
        const uniqueSent = [];
        const seenSentKeys = new Set();
        sent.forEach((s) => {
          const key = normalize(s.receiverEmail) || normalize(s.receiverName);
          if (!seenSentKeys.has(key)) {
            seenSentKeys.add(key);
            uniqueSent.push(s);
          }
        });

        setFriendRequests(
          incoming.map((r) => ({
            id: r.id,
            name: r.senderName,
            email: r.senderEmail,
            avatar: r.senderAvatar,
            status: "online",
            timestamp: r.timestamp || "เมื่อครู่นี้",
            globalReqId: r.id,
            senderId: r.senderId,
          }))
        );

                // Purge unfriended partners from directMessages
        const unfriendedPartnerKeys = new Set();
        globalList.forEach((r) => {
          if (r.status === "unfriended") {
            if (isSender(r)) {
              const partnerKey = normalize(r.receiverEmail) || normalize(r.receiverName);
              if (partnerKey) unfriendedPartnerKeys.add(partnerKey);
            } else if (isReceiver(r)) {
              const partnerKey = normalize(r.senderEmail) || normalize(r.senderName);
              if (partnerKey) unfriendedPartnerKeys.add(partnerKey);
            }
          }
        });

        if (unfriendedPartnerKeys.size > 0) {
          setDirectMessages((prev) => {
            const filtered = prev.filter(
              (dm) =>
                !unfriendedPartnerKeys.has(normalize(dm.email)) &&
                !unfriendedPartnerKeys.has(normalize(dm.name))
            );
            if (filtered.length !== prev.length) {
              try {
                localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(filtered));
              } catch (err) {}
              return filtered;
            }
            return prev;
          });
        }

                // Add group channels where currentUser was invited with members list
        const invitedChannels = [];
        globalList.forEach((r) => {
          if (r.status === "channel_added" && isReceiver(r)) {
            invitedChannels.push({
              id: r.channelId || `c-${r.channelName}`,
              name: r.channelName || "กลุ่มแชท",
              type: "channel",
              topic: r.channelTopic || "กลุ่มแชทองค์กร",
              members: r.channelMembers || [
                { id: currentUser.id, name: currentUser.name, role: currentUser.role, avatar: currentUser.avatar },
                { name: r.senderName, role: "Team Member", avatar: "/default-avatar.svg" }
              ],
              membersCount: (r.channelMembers && r.channelMembers.length) || 2,
              unread: 0,
            });
          }
        });

        if (invitedChannels.length > 0) {
          setChannels((prev) => {
            let updated = [...prev];
            let changed = false;
            invitedChannels.forEach((ic) => {
              const existingIdx = updated.findIndex((c) => c.id === ic.id || c.name === ic.name);
              if (existingIdx === -1) {
                updated.push(ic);
                changed = true;
              } else if (ic.members && ic.members.length > 0) {
                updated[existingIdx] = {
                  ...updated[existingIdx],
                  members: ic.members,
                  membersCount: ic.members.length,
                };
                changed = true;
              }
            });
            if (changed) {
              try {
                localStorage.setItem(`pulse_connect_channels_${currentUser.id}`, JSON.stringify(updated));
              } catch (err) {}
            }
            return updated;
          });
        }

        // Handle channel_left: remove the leaving member from channels this user is in
        globalList.forEach((r) => {
          if (r.status === "channel_left" && r.channelId && r.senderName) {
            // Don't process our own leave events
            if (r.senderName.toLowerCase() === currentUser.name.toLowerCase()) return;

            setChannels((prev) => {
              const existingIdx = prev.findIndex((c) => c.id === r.channelId);
              if (existingIdx === -1) return prev;

              const ch = prev[existingIdx];
              const currentMembers = ch.members || [];
              const newMembers = currentMembers.filter(
                (m) => m.name?.toLowerCase() !== r.senderName.toLowerCase()
              );

              if (newMembers.length === currentMembers.length) return prev; // no change

              const updated = [...prev];
              updated[existingIdx] = {
                ...ch,
                members: newMembers,
                membersCount: newMembers.length,
              };
              return updated;
            });
          }
        });

        // Handle profile_updated: sync name and avatar changes across DMs and channel members for all users
        globalList.forEach((r) => {
          if (r.status === "profile_updated" && r.userName) {
            const userEmail = r.userEmail ? normalize(r.userEmail) : "";
            const userPrefix = userEmail ? userEmail.split("@")[0] : "";
            const oldNameNorm = r.oldName ? normalize(r.oldName) : "";

            // 1. Update registered users cache in localStorage
            try {
              const raw = localStorage.getItem("pulse_connect_registered_users");
              let list = raw ? JSON.parse(raw) : [];
              let matched = false;
              list = list.map((u) => {
                const uEmail = normalize(u.email || "");
                const uName = normalize(u.name || "");
                if (
                  (userEmail && (uEmail === userEmail || uEmail.split("@")[0] === userPrefix)) ||
                  (oldNameNorm && uName === oldNameNorm)
                ) {
                  matched = true;
                  return { ...u, name: r.userName, avatar: r.userAvatar || u.avatar };
                }
                return u;
              });
              if (!matched && userEmail) {
                list.push({
                  id: r.userId || `u-${r.userName}`,
                  name: r.userName,
                  email: userEmail,
                  avatar: r.userAvatar || "/default-avatar.svg",
                });
              }
              localStorage.setItem("pulse_connect_registered_users", JSON.stringify(list));
            } catch (err) {}

            // 2. Update Direct Messages list names
            setDirectMessages((prev) => {
              let changed = false;
              const updated = prev.map((dm) => {
                const dmEmail = normalize(dm.email || "");
                const dmName = normalize(dm.name || "");
                if (
                  (userEmail && (dmEmail === userEmail || dmEmail.split("@")[0] === userPrefix)) ||
                  (oldNameNorm && dmName === oldNameNorm)
                ) {
                  if (dm.name !== r.userName || (r.userAvatar && dm.avatar !== r.userAvatar)) {
                    changed = true;
                    return { ...dm, name: r.userName, avatar: r.userAvatar || dm.avatar };
                  }
                }
                return dm;
              });
              if (changed) {
                try {
                  localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
                } catch (e) {}
                return updated;
              }
              return prev;
            });

            // 3. Update Channel member names
            setChannels((prev) => {
              let changed = false;
              const updated = prev.map((ch) => {
                const members = ch.members || [];
                let mChanged = false;
                const newMembers = members.map((m) => {
                  const mEmail = normalize(m.email || "");
                  const mName = normalize(m.name || "");
                  if (
                    (userEmail && (mEmail === userEmail || mEmail.split("@")[0] === userPrefix)) ||
                    (r.userId && m.id === r.userId) ||
                    (oldNameNorm && mName === oldNameNorm)
                  ) {
                    if (m.name !== r.userName || (r.userAvatar && m.avatar !== r.userAvatar)) {
                      mChanged = true;
                      return { ...m, name: r.userName, avatar: r.userAvatar || m.avatar };
                    }
                  }
                  return m;
                });
                if (mChanged) {
                  changed = true;
                  return { ...ch, members: newMembers };
                }
                return ch;
              });
              if (changed) {
                try {
                  localStorage.setItem(`pulse_connect_channels_${currentUser.id}`, JSON.stringify(updated));
                } catch (e) {}
                return updated;
              }
              return prev;
            });
          }
        });

        setSentRequests(
          uniqueSent
            .filter((r) => {
              const rEmail = normalize(r.receiverEmail);
              const rName = normalize(r.receiverName);
              return !acceptedPartnerKeys.has(rEmail) && !acceptedPartnerKeys.has(rName);
            })
            .map((r) => ({
              id: r.id,
              name: r.receiverName,
              email: r.receiverEmail,
              timestamp: r.timestamp || "เมื่อครู่นี้",
            }))
        );
      } catch (err) {
        console.log("Error loading cross account friend requests", err);
      }
    };

    syncCrossAccountFriendRequests();
    loadFromSupabase();

    // Instant sync across tabs & 2-second interval polling for real-time friend acceptance
    const handleStorageChange = (e) => {
      if (!e.key || e.key === "pulse_connect_global_friend_requests") {
        syncCrossAccountFriendRequests();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    const friendPollInterval = setInterval(() => {
      syncCrossAccountFriendRequests();
      loadFromSupabase();
    }, 2000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(friendPollInterval);
    };
  }, [currentUser]);

  // Persistent storage auto-save effects (User-specific)
  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_channels_${currentUser.id}`, JSON.stringify(channels));
    } catch (err) {}
  }, [channels, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(directMessages));
    } catch (err) {}
  }, [directMessages, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_friend_requests_${currentUser.id}`, JSON.stringify(friendRequests));
    } catch (err) {}
  }, [friendRequests, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_messages_${currentUser.id}`, JSON.stringify(messagesState));
    } catch (err) {}
  }, [messagesState, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_albums_${currentUser.id}`, JSON.stringify(albumsState));
    } catch (err) {}
  }, [albumsState, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_notes_${currentUser.id}`, JSON.stringify(notesState));
    } catch (err) {}
  }, [notesState, currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    try {
      localStorage.setItem(`pulse_connect_threads_${currentUser.id}`, JSON.stringify(threadsState));
    } catch (err) {}
  }, [threadsState, currentUser]);

  // Supabase Realtime Subscription for Live Messages
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("public-realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg) {
            const targetChId = newMsg.channel_id || activeId || "c-general";
            setMessagesState((prev) => {
              const channelMsgs = prev[targetChId] || [];
              if (channelMsgs.some((m) => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                [targetChId]: [
                  ...channelMsgs,
                  {
                    id: newMsg.id,
                    senderId: newMsg.sender_id,
                    senderName: newMsg.sender_name || "ผู้ใช้งาน",
                    senderAvatar: newMsg.sender_avatar || "/default-avatar.svg",
                    role: newMsg.role || "Team Member",
                    content: newMsg.content,
                    timestamp: "เมื่อครู่นี้",
                    reactions: [],
                  },
                ],
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId]);

  // Supabase Realtime for Friend Request Acceptance (instant sync for sender)
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel("friend-request-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          try {
            const newMsg = payload.new;
            if (!newMsg || newMsg.role !== "FriendRequest" || !newMsg.content) return;

            const parsed = JSON.parse(newMsg.content);
            if (!parsed || !parsed.id || parsed.status !== "accepted") return;

            const normalize = (str) => (str || "").toLowerCase().trim();
            const userId = currentUser.id;
            const userEmail = normalize(currentUser.email || `${currentUser.id}@company.com`);
            const userName = normalize(currentUser.name);
            const userPrefix = userEmail.split("@")[0];

            const senderEmail = normalize(parsed.senderEmail || "");
            const senderName = normalize(parsed.senderName || "");
            const senderId = parsed.senderId || "";
            const senderPrefix = senderEmail ? senderEmail.split("@")[0] : "";

            const isSender =
              (senderId && senderId === userId) ||
              (senderEmail && userEmail && (senderEmail === userEmail || senderPrefix === userPrefix)) ||
              (senderName && userName && senderName === userName);

            if (!isSender) return;

            const partnerEmail = parsed.receiverEmail;
            const partnerName = parsed.receiverName;
            const partnerInfo = getRegisteredNameAndAvatar(partnerEmail, partnerName);
            const partnerDisplayName = partnerInfo.name || partnerName || partnerEmail || "เพื่อนร่วมงาน";
            const partnerKey = normalize(partnerEmail) || normalize(partnerName);

            setDirectMessages((prev) => {
              const existingIdx = prev.findIndex(
                (dm) =>
                  (dm.name && normalize(dm.name) === normalize(partnerDisplayName)) ||
                  (dm.email && partnerEmail && normalize(dm.email) === normalize(partnerEmail))
              );

              if (existingIdx !== -1) {
                if (prev[existingIdx].isArchived) {
                  const updated = [...prev];
                  updated[existingIdx] = { ...updated[existingIdx], isArchived: false };
                  try {
                    localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
                  } catch (err) {}
                  return updated;
                }
                return prev;
              }

              const newDm = {
                id: `dm-${partnerKey}`,
                name: partnerDisplayName,
                role: "Team Member",
                email: partnerEmail,
                avatar: partnerInfo.avatar || "/default-avatar.svg",
                status: "online",
                unread: 0,
                lastSeen: "ออนไลน์ในขณะนี้",
                isArchived: false,
              };

              const updated = [...prev, newDm];
              try {
                localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
              } catch (err) {}
              return updated;
            });

            setSentRequests((prev) =>
              prev.filter((r) => {
                const rEmail = normalize(r.email || "");
                const rName = normalize(r.name || "");
                return (
                  rEmail !== normalize(partnerEmail || "") &&
                  rName !== normalize(partnerName || "")
                );
              })
            );

            try {
              const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
              let globalList = globalRaw ? JSON.parse(globalRaw) : [];
              const matchIdx = globalList.findIndex(
                (g) =>
                  g.id === parsed.id ||
                  (normalize(g.senderEmail) === senderEmail &&
                    normalize(g.receiverEmail) === normalize(partnerEmail))
              );
              if (matchIdx !== -1) {
                globalList[matchIdx] = { ...globalList[matchIdx], status: "accepted" };
                localStorage.setItem(
                  "pulse_connect_global_friend_requests",
                  JSON.stringify(globalList)
                );
              }
            } catch (err) {}

            setFriendRequests((prev) =>
              prev.filter((r) => {
                const rEmail = normalize(r.email || "");
                const rName = normalize(r.name || "");
                return rEmail !== senderEmail && rName !== senderName;
              })
            );
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const saveUserToRegisteredList = (userData) => {
    if (!userData || (!userData.email && !userData.name)) return;
    saveUserToRegisteredListFromUtils(userData, supabase);
  };

  const handleUpdateUserProfile = (newUserData) => {
    const oldName = currentUser?.name;
    setCurrentUser(newUserData);

    // Save user info to local storage & Supabase
    saveUserToRegisteredList(newUserData, supabase);
    try {
      localStorage.setItem("pulse_connect_user", JSON.stringify(newUserData));
    } catch (err) {}

    // Broadcast profile update event so all connected accounts sync the new name
    fetch("/api/sync-friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: "profile_updated",
        userEmail: newUserData.email,
        userName: newUserData.name,
        userAvatar: newUserData.avatar,
        userId: newUserData.id,
        oldName: oldName,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  };

  const handleLogin = (userData, remember = true) => {
    setCurrentUser(userData);
    setActiveId(null);
    setIsLoggedIn(true);
    saveUserToRegisteredList(userData);
    if (remember) {
      try {
        localStorage.setItem("pulse_connect_logged_in", "true");
        localStorage.setItem("pulse_connect_user", JSON.stringify(userData));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveId(null);
    setActiveChatHeadId(null);
    try {
      localStorage.removeItem("pulse_connect_logged_in");
      localStorage.removeItem("pulse_connect_user");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSuccess = (newUserData) => {
    setCurrentUser(newUserData);
    setActiveId(null);
    setIsLoggedIn(true);
    saveUserToRegisteredList(newUserData);
    try {
      localStorage.setItem("pulse_connect_logged_in", "true");
      localStorage.setItem("pulse_connect_user", JSON.stringify(newUserData));
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to compute deterministic shared DM room ID across two users
  const getSharedDmChannelId = (targetChatId, partnerNameInput) => {
    return getSharedDmChannelIdFromUtils(targetChatId, partnerNameInput, currentUser, directMessages);
  };

  const activeChannel = activeId ? channels.find((c) => c.id === activeId) : null;
  const activeDm = activeId ? directMessages.find((dm) => dm.id === activeId) : null;
  const activeChat = activeChannel || activeDm;

  // Compute shared channel id for typing sync — placed here after getSharedDmChannelId is defined
  const activeTypingChannelId = activeId
    ? (channels.some((c) => c.id === activeId)
        ? activeId
        : getSharedDmChannelId(activeId, directMessages.find((d) => d.id === activeId)?.name, currentUser, directMessages))
    : null;

  // Sync ref so useTypingSync always uses the latest channelId
  _activeTypingChIdRef.current = activeTypingChannelId;

  // Filter messages based on live header search and merged shared room ID
  const sharedRoomIdForActive = activeDm ? getSharedDmChannelId(activeId, activeDm.name, currentUser, directMessages) : activeId;
  const activeMsgs = activeId ? messagesState[activeId] || [] : [];
  const sharedMsgs = (sharedRoomIdForActive && sharedRoomIdForActive !== activeId) ? (messagesState[sharedRoomIdForActive] || []) : [];

  const combinedRawMsgs = [...activeMsgs];
  sharedMsgs.forEach((sm) => {
    if (!combinedRawMsgs.some((em) => em.id === sm.id)) {
      combinedRawMsgs.push(sm);
    }
  });

  const rawMessages = combinedRawMsgs;
  const currentMessages = rawMessages.filter((msg) => {
    if (chatSearchQuery.trim()) {
      return msg.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
    }
    return true;
  });

  // Active Chat Albums & Notes
  const currentAlbums = activeId ? albumsState[activeId] || [] : [];
  const currentNotes = activeId ? notesState[activeId] || [] : [];

  // Chat Head target chat & messages
  const chatHeadChannel = channels.find((c) => c.id === activeChatHeadId);
  const chatHeadDm = directMessages.find((dm) => dm.id === activeChatHeadId);
  const chatHeadChat = chatHeadChannel || chatHeadDm;
  const chatHeadMessages = activeChatHeadId ? messagesState[activeChatHeadId] || [] : [];

  const handleSelectChat = (id, type) => {
    setActiveId(id);
    setShowInfoDrawer(false);
    setChatSearchQuery("");
    setIsHeaderSearchOpen(false);

    if (currentUser) {
      const currentUserId = currentUser.id || currentUser.name;
      setMessagesState((prev) => {
        const updated = { ...prev };
        let changed = false;

        const isGroup = channels.some((c) => c.id === id);
        const activeDm = !isGroup ? directMessages.find((d) => d.id === id) : null;
        const sharedRoomId = activeDm
          ? getSharedDmChannelId(id, activeDm.name, currentUser, directMessages)
          : id;

        [id, sharedRoomId].forEach((roomKey) => {
          if (!updated[roomKey]) return;
          updated[roomKey] = updated[roomKey].map((msg) => {
            if (msg.senderId !== currentUserId && msg.senderName !== currentUser.name) {
              const readBy = msg.readBy || [];
              if (!readBy.some((r) => (typeof r === "object" ? r.id === currentUserId || r.name === currentUser.name : r === currentUser.name))) {
                changed = true;
                const updatedReadBy = [
                  ...readBy,
                  {
                    id: currentUserId,
                    name: currentUser.name,
                    avatar: currentUser.avatar || "/default-avatar.svg",
                    readAt: Date.now(),
                  },
                ];
                const updatedMsg = { ...msg, readBy: updatedReadBy };

                // Sync read status to Supabase
                fetch("/api/sync-chat-message", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updatedMsg),
                }).catch(() => {});

                return updatedMsg;
              }
            }
            return msg;
          });
        });

        return changed ? updated : prev;
      });
    }

    if (type === "channel") {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === id ? { ...ch, unread: 0 } : ch))
      );
    } else {
      const nowTimeStr = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === id ? { ...dm, unread: 0, lastReadTime: nowTimeStr } : dm))
      );
    }
  };

  const handleOpenChatHead = (id, type) => {
    setActiveChatHeadId(id);
  };

  const handleTogglePinChat = (id, type) => {
    if (type === "channel") {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === id ? { ...ch, isPinned: !ch.isPinned } : ch))
      );
    } else {
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === id ? { ...dm, isPinned: !dm.isPinned } : dm))
      );
    }
  };

  const handleToggleMuteChat = (id, type) => {
    if (type === "channel") {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === id ? { ...ch, isMuted: !ch.isMuted } : ch))
      );
    } else {
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === id ? { ...dm, isMuted: !dm.isMuted } : dm))
      );
    }
  };

  const handleArchiveChat = (id, type) => {
    if (type === "channel") {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === id ? { ...ch, isArchived: true } : ch))
      );
    } else {
      setDirectMessages((prev) =>
        prev.map((dm) => (dm.id === id ? { ...dm, isArchived: true } : dm))
      );
    }
    if (activeId === id) {
      const remainingChannel = channels.find((c) => c.id !== id && !c.isArchived);
      setActiveId(remainingChannel ? remainingChannel.id : null);
    }
  };

  const handleDeleteChat = (id, type) => {
    if (type === "channel") {
      setChannels((prev) => prev.filter((ch) => ch.id !== id));
    } else {
      setDirectMessages((prev) => prev.filter((dm) => dm.id !== id));
    }
    setMessagesState((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    if (activeId === id) {
      const remainingChannel = channels.find((c) => c.id !== id);
      setActiveId(remainingChannel ? remainingChannel.id : null);
    }
    if (activeChatHeadId === id) {
      setActiveChatHeadId(null);
    }
  };

  const handleLeaveGroupChannel = (channelId) => {
    if (!currentUser || !channelId) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const leaveSystemMsg = {
      id: `m-system-leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId: channelId,
      sender: currentUser.name,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      role: "system",
      isSystem: true,
      content: `${currentUser.name} ออกจากกลุ่ม`,
      timestamp: timeString,
      reactions: [],
    };

    // 1. Remove currentUser from the channel's members list (so others see them gone)
    setChannels((prev) => {
      const updated = prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        const newMembers = (ch.members || []).filter(
          (m) =>
            m.name?.toLowerCase() !== currentUser.name?.toLowerCase() &&
            m.id !== currentUser.id
        );
        return {
          ...ch,
          members: newMembers,
          membersCount: newMembers.length,
        };
      });

      // 2. After updating members, remove the channel from this user's sidebar
      const withoutChannel = updated.filter((ch) => ch.id !== channelId);

      // Save updated channel list to localStorage
      try {
        localStorage.setItem(
          `pulse_connect_channels_${currentUser.id}`,
          JSON.stringify(withoutChannel)
        );
      } catch (err) {}

      return withoutChannel;
    });

    // 3. Remove messages for that channel from local state
    setMessagesState((prev) => {
      const updated = { ...prev };
      delete updated[channelId];
      return updated;
    });

    // 4. Post system message so remaining members see "[Name] ออกจากกลุ่ม" in chat feed
    fetch("/api/sync-chat-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leaveSystemMsg),
    }).catch(() => {});

    // 5. Navigate away
    if (activeId === channelId) {
      setChannels((prev) => {
        const remaining = prev.filter((c) => c.id !== channelId);
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
        return prev;
      });
    }
    if (activeChatHeadId === channelId) {
      setActiveChatHeadId(null);
    }

    // 6. Notify other members via API so their member list updates too
    fetch("/api/sync-friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: "channel_left",
        channelId: channelId,
        senderName: currentUser.name,
        senderId: currentUser.id,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  };

  // Thread Replies Handler
  const handleSendThreadReply = (parentMsgId, replyText) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} น.`;

    const newReply = {
      id: `tr-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      content: replyText,
      timestamp: timeString,
    };

    setThreadsState((prev) => ({
      ...prev,
      [parentMsgId]: [...(prev[parentMsgId] || []), newReply],
    }));
  };

  // Album & Note Handlers
  const handleCreateAlbum = (newAlbum) => {
    if (!activeId) return;

    const albumObj = {
      id: `alb-${Date.now()}`,
      ...newAlbum,
    };

    setAlbumsState((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), albumObj],
    }));

    // Post announcement in chat feed
    const systemMsg = {
      id: `m-album-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      role: currentUser.role,
      content: `🖼️ สร้างอัลบั้มรูปภาพใหม่: "${newAlbum.title}" (${newAlbum.photos.length} รูป)`,
      timestamp: "เมื่อครู่นี้",
      reactions: [],
    };

    setMessagesState((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), systemMsg],
    }));
  };

  const handleCreateNote = (newNote) => {
    if (!activeId) return;

    const noteObj = {
      id: `note-${Date.now()}`,
      ...newNote,
    };

    setNotesState((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), noteObj],
    }));

    const emailNotice = newNote.sendEmail
      ? " 📧 (ระบบทำการส่งอีเมลแจ้งเตือนไปยัง Email สมาชิกทุกคนในกลุ่มแล้ว)"
      : "";

    const systemMsg = {
      id: `m-note-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      role: currentUser.role,
      content: `📝 สร้างโน้ตแจ้งเตือนใหม่: "${newNote.title}" - ${newNote.content}${emailNotice}`,
      timestamp: "เมื่อครู่นี้",
      reactions: [],
    };

    setMessagesState((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), systemMsg],
    }));
  };

  // Message Pinning Logic
  const handleTogglePinMessage = (msgId) => {
    if (!activeId) return;

    setMessagesState((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).map((msg) => {
        if (msg.id === msgId) {
          return {
            ...msg,
            isPinned: !msg.isPinned,
          };
        }
        return msg;
      }),
    }));
  };

  // Message Editing & Deleting Logic
  const handleEditMessage = (msgId, newText) => {
    if (!activeId) return;

    setMessagesState((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).map((msg) => {
        if (msg.id === msgId) {
          return {
            ...msg,
            originalContent: msg.originalContent || msg.content,
            content: newText,
            isEdited: true,
          };
        }
        return msg;
      }),
    }));
  };

  const handleDeleteMessage = (msgId) => {
    if (!activeId) return;

    // Remove from local state immediately
    setMessagesState((prev) => ({
      ...prev,
      [activeId]: (prev[activeId] || []).filter((msg) => msg.id !== msgId),
    }));

    // Sync deletion to Supabase so other users see it removed
    fetch("/api/sync-chat-message", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: msgId }),
    }).catch((err) => console.error("sync-chat-message DELETE error:", err));
  };

  const handleAddReaction = (msgId, emoji, targetChatId = null) => {
    const rawTargetId = targetChatId || activeId;
    if (!rawTargetId || !currentUser) return;

    const isGroup = channels.some((c) => c.id === rawTargetId);
    const activeDm = !isGroup ? directMessages.find((d) => d.id === rawTargetId) : null;
    const realRoomId = activeDm
      ? getSharedDmChannelId(rawTargetId, activeDm.name, currentUser, directMessages)
      : rawTargetId;

    let updatedMsg = null;

    setMessagesState((prev) => {
      let roomKey = realRoomId;
      if (!prev[roomKey] && prev[rawTargetId]) roomKey = rawTargetId;
      if (!prev[roomKey]) {
        const foundKey = Object.keys(prev).find((k) => (prev[k] || []).some((m) => m.id === msgId));
        if (foundKey) roomKey = foundKey;
      }
      const roomMsgs = prev[roomKey] || [];

      const newMsgs = roomMsgs.map((msg) => {
        if (msg.id === msgId) {
          const reactions = msg.reactions || [];
          const currentUserId = currentUser.id || currentUser.name || "u-current";

          const existing = reactions.find((r) => r.emoji === emoji);
          const usersWhoReacted = existing?.users || [];

          let newReactions = [];

          if (existing && usersWhoReacted.includes(currentUserId)) {
            // TOGGLE OFF / CANCEL / REMOVE reaction
            const updatedUsers = usersWhoReacted.filter((id) => id !== currentUserId);
            if (updatedUsers.length === 0) {
              newReactions = reactions.filter((r) => r.emoji !== emoji);
            } else {
              newReactions = reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: updatedUsers.length, users: updatedUsers }
                  : r
              );
            }
          } else {
            // ADD reaction
            const existingSame = reactions.find((r) => r.emoji === emoji);
            if (existingSame) {
              newReactions = reactions.map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count + 1, users: [...(r.users || []), currentUserId] }
                  : r
              );
            } else {
              newReactions = [...reactions, { emoji, count: 1, users: [currentUserId] }];
            }
          }

          updatedMsg = { ...msg, reactions: newReactions };
          return updatedMsg;
        }
        return msg;
      });

      return {
        ...prev,
        [roomKey]: newMsgs,
        ...(rawTargetId !== roomKey ? { [rawTargetId]: newMsgs } : {}),
      };
    });

    if (updatedMsg) {
      fetch("/api/sync-chat-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMsg),
      }).catch(() => {});
    }
  };

    const handleAddMembersToChannel = (selectedMembers) => {
    if (!activeId || !currentUser) return;

    const activeChan = channels.find((c) => c.id === activeId);
    const channelName = activeChan ? activeChan.name : "กลุ่มแชท";

    let updatedMemberList = [];

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id === activeId) {
          const currentMembers = ch.members || [
            {
              id: currentUser.id,
              name: currentUser.name,
              role: currentUser.role || "Team Member",
              avatar: currentUser.avatar || "/default-avatar.svg",
            },
          ];
          const newMembers = [...currentMembers];
          selectedMembers.forEach((sm) => {
            if (!newMembers.some((m) => m.name.toLowerCase() === sm.name.toLowerCase())) {
              newMembers.push({
                id: sm.id || `u-${sm.name}`,
                name: sm.name,
                role: sm.role || "Team Member",
                avatar: sm.avatar || "/default-avatar.svg",
              });
            }
          });
          updatedMemberList = newMembers;
          return {
            ...ch,
            members: newMembers,
            membersCount: newMembers.length,
          };
        }
        return ch;
      })
    );

    const memberNames = selectedMembers.map((m) => m.name).join(", ");
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const systemMsg = {
      id: `m-system-add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId: activeId,
      sender: currentUser.name,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      role: "system",
      isSystem: true,
      content: `${currentUser.name} ได้เพิ่ม ${memberNames} เข้าร่วมกลุ่ม`,
      timestamp: timeString,
      reactions: [],
    };

    setMessagesState((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), systemMsg],
    }));

    selectedMembers.forEach((member) => {
      const inviteEvt = {
        id: `chan-invite-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        channelId: activeId,
        channelName: channelName,
        channelTopic: activeChan?.topic || "กลุ่มแชทองค์กร",
        channelMembers: updatedMemberList,
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverName: member.name,
        receiverEmail: member.email || "",
        status: "channel_added",
        timestamp: "เมื่อครู่นี้",
      };

      fetch("/api/sync-friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteEvt),
      }).catch((err) => console.error("Channel invite sync error:", err));
    });

    fetch("/api/sync-chat-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(systemMsg),
    }).catch(() => {});
  };

  const handleCreateChannel = async (newChannelData) => {
    const newChannel = {
      id: `c-${Date.now()}`,
      name: newChannelData.name,
      type: "channel",
      unread: 0,
      iconId: newChannelData.iconId,
      description: newChannelData.description,
      topic: `กลุ่มแชทสร้างใหม่ • ${newChannelData.isPrivate ? "ส่วนตัว" : "สาธารณะ"}`,
      membersCount: 1,
    };

    setChannels((prev) => [...prev, newChannel]);
    setMessagesState((prev) => ({
      ...prev,
      [newChannel.id]: [],
    }));

    setActiveId(newChannel.id);

    // Save channel to Supabase Database
    if (supabase) {
      try {
        await supabase.from("channels").insert([
          {
            name: newChannel.name,
            type: "channel",
            topic: newChannel.topic,
          },
        ]);
      } catch (err) {
        console.log("Supabase channel insert fallback");
      }
    }
  };

  // Helper to resolve real registered user name & avatar by email
  const getRegisteredNameAndAvatar = (email, fallbackName) => {
    if (!email) return { name: fallbackName, avatar: "/default-avatar.svg" };
    const cleanEmail = email.toLowerCase().trim();
    const prefix = cleanEmail.split("@")[0];



    try {
      const localUsers = localStorage.getItem("pulse_connect_registered_users");
      if (localUsers) {
        const parsed = JSON.parse(localUsers);
        const match = parsed.find(
          (u) =>
            u.email &&
            (u.email.toLowerCase().trim() === cleanEmail ||
              u.email.toLowerCase().trim().split("@")[0] === prefix)
        );
        if (match && match.name) {
          return { name: match.name, avatar: match.avatar || "/default-avatar.svg" };
        }
      }
    } catch (err) {}

    return { name: fallbackName, avatar: "/default-avatar.svg" };
  };



    const handleAddFriend = (newFriend) => {
    if (!currentUser) return;

    const inputName = (newFriend.name || "").trim();
    const partnerInfo = getRegisteredNameAndAvatar(newFriend.email, inputName);
    const targetName = partnerInfo.name || inputName;
    const userEmail = (currentUser.email || "").toLowerCase().trim();
    const targetEmail = (newFriend.email || "").toLowerCase().trim();

    const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
    const globalList = globalRaw ? JSON.parse(globalRaw) : [];

    const newReq = {
      id: `freq-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderEmail: userEmail,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      receiverEmail: targetEmail,
      receiverName: targetName,
      status: "pending",
      timestamp: "เมื่อครู่นี้",
    };

    globalList.push(newReq);
    try {
      localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
    } catch (err) {}

    fetch("/api/sync-friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReq),
    }).catch((err) => console.error("API friend request sync error:", err));

    setSentRequests((prev) => [
      ...prev,
      {
        id: newReq.id,
        name: newReq.receiverName,
        email: newReq.receiverEmail,
        timestamp: "เมื่อครู่นี้",
      },
    ]);
  };

  const handleAcceptFriendRequest = (request) => {
    if (!currentUser) return;

    const normalize = (str) => (str || "").toLowerCase().trim();
    const partnerInfo = getRegisteredNameAndAvatar(request.email, request.name);
    const realPartnerName = partnerInfo.name || request.name;

    const acceptedObj = {
      id: request.globalReqId || request.id || `freq-${Date.now()}`,
      senderId: request.senderId || "",
      senderName: realPartnerName,
      senderEmail: request.email || "",
      senderAvatar: request.avatar || "/default-avatar.svg",
      receiverName: currentUser.name,
      receiverEmail: currentUser.email || `${currentUser.id}@company.com`,
      receiverAvatar: currentUser.avatar || "/default-avatar.svg",
      status: "accepted",
      timestamp: "เมื่อครู่นี้",
    };

    fetch("/api/sync-friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(acceptedObj),
    }).catch((err) => console.error("API accept sync error:", err));

    const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
    let globalList = globalRaw ? JSON.parse(globalRaw) : [];
    const matchIdx = globalList.findIndex(
      (r) =>
        r.id === acceptedObj.id ||
        (normalize(r.senderName) === normalize(acceptedObj.senderName) &&
          normalize(r.receiverName) === normalize(acceptedObj.receiverName))
    );
    if (matchIdx !== -1) {
      globalList[matchIdx] = { ...globalList[matchIdx], status: "accepted" };
    } else {
      globalList.push(acceptedObj);
    }
    try {
      localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
    } catch (err) {}

    const newFriend = {
      id: `dm-${request.senderId || acceptedObj.id}`,
      name: realPartnerName,
      role: "Team Member",
      email: request.email,
      avatar: partnerInfo.avatar || request.avatar || "/default-avatar.svg",
      status: "online",
      unread: 0,
      lastSeen: "ออนไลน์ในขณะนี้",
    };

    setDirectMessages((prev) => {
      let updated = prev.filter((dm) => dm.name.toLowerCase() !== realPartnerName.toLowerCase());
      updated.push(newFriend);
      try {
        localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // Calculate shared DM channel ID
    const sharedDmId = getSharedDmChannelId(
      newFriend.id,
      realPartnerName,
      currentUser,
      directMessages
    );

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} น.`;

    const friendSystemMsg = {
      id: `sys-friend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId: sharedDmId,
      sender: "System",
      senderName: "System",
      senderAvatar: "/default-avatar.svg",
      content: `${realPartnerName} กับ ${currentUser.name} เพิ่มเพื่อนเรียบร้อย`,
      timestamp: timeStr,
      isSystem: true,
      _dbCreatedAt: new Date().toISOString(),
    };

    fetch("/api/sync-chat-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(friendSystemMsg),
    }).catch((err) => console.error("sync-chat-message friend system error:", err));

    setMessagesState((prev) => ({
      ...prev,
      [sharedDmId]: [...(prev[sharedDmId] || []), friendSystemMsg],
      [newFriend.id]: [...(prev[newFriend.id] || []), friendSystemMsg],
    }));

    setFriendRequests((prev) =>
      prev.filter((r) => r.name.toLowerCase() !== request.name.toLowerCase() && r.id !== request.id)
    );
  };

  const handleRejectFriendRequest = (requestId) => {
    const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
    let globalList = globalRaw ? JSON.parse(globalRaw) : [];

    globalList = globalList.map((r) =>
      r.id === requestId ? { ...r, status: "rejected" } : r
    );

    try {
      localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
    } catch (err) {}

    setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleCancelSentRequest = (requestId) => {
    const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
    let globalList = globalRaw ? JSON.parse(globalRaw) : [];

    globalList = globalList.filter((r) => r.id !== requestId && r.globalReqId !== requestId);
    try {
      localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
    } catch (err) {}

    if (supabase) {
      try {
        const rawNumId = requestId.replace("freq-", "");
        supabase.from("friend_requests").delete().eq("id", rawNumId);
      } catch (err) {}
    }

    setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleUnfriend = (friendObj) => {
    if (!currentUser || !friendObj) return;

    const friendId = friendObj.id;
    const friendName = friendObj.name;
    const friendEmail = friendObj.email;
    const normalize = (str) => (str || "").toLowerCase().trim();

    // 1. Remove from directMessages state & user-specific localStorage
    setDirectMessages((prev) => {
      const updated = prev.filter((dm) => dm.id !== friendId && dm.name !== friendName);
      try {
        localStorage.setItem(`pulse_connect_dms_${currentUser.id}`, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    // 2. Remove friendship link from global requests
    const globalRaw = localStorage.getItem("pulse_connect_global_friend_requests");
    let globalList = globalRaw ? JSON.parse(globalRaw) : [];

    globalList = globalList.filter((r) => {
      const isFriendRel =
        (normalize(r.senderName) === normalize(friendName) || (friendEmail && normalize(r.senderEmail) === normalize(friendEmail))) ||
        (normalize(r.receiverName) === normalize(friendName) || (friendEmail && normalize(r.receiverEmail) === normalize(friendEmail)));
      return !isFriendRel;
    });

    try {
      localStorage.setItem("pulse_connect_global_friend_requests", JSON.stringify(globalList));
    } catch (err) {}

    // 3. Remove from Supabase friend_requests if available
    if (supabase) {
      try {
        if (friendName) {
          supabase.from("friend_requests").delete().or(`sender_name.eq.${friendName},receiver_name.eq.${friendName}`);
        }
      } catch (err) {}
    }

    // 4. Reset active chat if currently open
    if (activeId === friendId) {
      setActiveId(null);
    }
  };

  const handleSendMessageToTarget = async (targetId, messagePayload) => {
    if (!targetId || !currentUser) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} น.`;

    const { text, attachment, voiceDuration } = messagePayload;

    // Determine correct shared channel ID
    // For DM: compute deterministic shared room so both sides use same channelId
    // For group channel: use the channel's own id directly
    const isGroupChannel = channels.some((c) => c.id === targetId);
    const activeDm = !isGroupChannel ? directMessages.find((d) => d.id === targetId) : null;
    const sharedRoomId = activeDm
      ? getSharedDmChannelId(targetId, activeDm.name, currentUser, directMessages)
      : targetId;

    const nowMs = Date.now();
    const newMessage = {
      id: `m-${nowMs}-${Math.random().toString(36).slice(2, 6)}`,
      sentAt: nowMs,
      _dbCreatedAt: new Date(nowMs).toISOString(),
      channelId: sharedRoomId,
      senderId: currentUser.id,
      sender: currentUser.name,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "/default-avatar.svg",
      role: currentUser.role || "Team Member",
      content: text ? text.trim() : "",
      timestamp: timeString,
      reactions: [],
      voiceDuration: voiceDuration || undefined,
    };

    if (attachment) {
      if (attachment.isImage) {
        // Store compressed base64 directly in Supabase (canvas-compressed, typically <100KB)
        newMessage.imageAttachment = { url: attachment.url, fileName: attachment.fileName };
      } else {
        const ext = attachment.fileName.split(".").pop()?.toLowerCase() || "";
        const docKey = `pulse_doc_${newMessage.id}`;

        // If file base64 is large (>100KB), store in localStorage so Supabase payload stays small & fast
        if (attachment.url && attachment.url.length > 100000) {
          try {
            localStorage.setItem(docKey, attachment.url);
          } catch (e) {}
          newMessage.attachment = {
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            fileType: ext,
            localKey: docKey,
          };
        } else {
          newMessage.attachment = {
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            fileType: ext,
            url: attachment.url || "",
          };
        }
      }
    }

    // Optimistically add to local state (both targetId and sharedRoomId keys) with chronological sorting
    setMessagesState((prev) => {
      const updated = { ...prev };
      const existing = updated[sharedRoomId] || [];
      if (!existing.some((m) => m.id === newMessage.id)) {
        updated[sharedRoomId] = sortMessagesChronologically([...existing, newMessage]);
      }
      if (targetId !== sharedRoomId) {
        const local = updated[targetId] || [];
        if (!local.some((m) => m.id === newMessage.id)) {
          updated[targetId] = sortMessagesChronologically([...local, newMessage]);
        }
      }
      return updated;
    });

    // Persist to Supabase via server-side API (bypasses RLS)
    fetch("/api/sync-chat-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMessage),
    }).catch((err) => console.error("sync-chat-message POST error:", err));
  };

  
  
  
  
  
  
  // Collect all photos dynamically from messagesState + shared photos
  const activeChatPhotos = React.useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    const allMsgs = Object.values(messagesState || {}).flat();
    allMsgs.forEach((m) => {
      if (m && m.imageAttachment && m.imageAttachment.url) {
        if (!seenUrls.has(m.imageAttachment.url)) {
          seenUrls.add(m.imageAttachment.url);
          list.push({
            id: m.id,
            url: m.imageAttachment.url,
            fileName: m.imageAttachment.fileName || "รูปภาพสื่อสาร",
            sender: m.senderName || "สมาชิก",
            timestamp: m.timestamp || "เมื่อสักครู่",
          });
        }
      }
    });

    (mockSharedPhotos || []).forEach((p) => {
      if (p && p.url && !seenUrls.has(p.url)) {
        seenUrls.add(p.url);
        list.push(p);
      }
    });

    return list;
  }, [messagesState, mockSharedPhotos]);

  const handleOpenPhotoViewerByObject = (photoObj) => {
    if (!photoObj || !photoObj.url) return;
    setViewingPhotoObj({
      url: photoObj.url,
      fileName: photoObj.fileName || "รูปภาพสื่อสาร",
      sender: photoObj.sender || photoObj.senderName || "สมาชิก",
      timestamp: photoObj.timestamp || "เมื่อสักครู่",
    });
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        />

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        channels={channels}
        directMessages={directMessages}
        activeId={activeId}
        onSelectChat={handleSelectChat}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenCreateChannelModal={() => setIsCreateChannelModalOpen(true)}
        onOpenAddFriendModal={() => setIsAddFriendModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onTogglePinChat={handleTogglePinChat}
        onToggleMuteChat={handleToggleMuteChat}
        onArchiveChat={handleArchiveChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
        onOpenChatHead={handleOpenChatHead}
        friendRequests={friendRequests}
        sentRequests={sentRequests}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onRejectFriendRequest={handleRejectFriendRequest}
        onCancelSentRequest={handleCancelSentRequest}
        onUnfriend={handleUnfriend}
      />

      {/* Center Chat Area */}
      <main className="chat-workspace">
        {activeId && activeChat ? (
          <>
            <ChatHeader
              activeChat={activeChat}
              onVoiceCall={() => setCallState({ isOpen: true, callType: "voice" })}
              onVideoCall={() => setCallState({ isOpen: true, callType: "video" })}
              onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              onToggleInfoDrawer={() => setShowInfoDrawer(!showInfoDrawer)}
              showInfoDrawer={showInfoDrawer}
              onTogglePinChat={handleTogglePinChat}
              searchQuery={chatSearchQuery}
              onSearchChange={setChatSearchQuery}
              isSearchOpen={isHeaderSearchOpen}
              onToggleSearch={() => {
                setIsHeaderSearchOpen(!isHeaderSearchOpen);
                if (isHeaderSearchOpen) setChatSearchQuery("");
              }}
            />

            <MessageList
              messages={currentMessages}
              isTyping={isRemoteTyping}
              typingUsers={typingUsers}
              currentUser={currentUser}
              activeId={activeId}
              activeChat={activeChat}
              onOpenPhotoViewer={handleOpenPhotoViewerByObject}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onAddReaction={handleAddReaction}
              onTogglePinMessage={handleTogglePinMessage}
              onOpenThreadReply={(msg) => setActiveThreadParent(msg)}
              threadsState={threadsState}
            />

            <MessageInput
              onSendMessage={(payload) => {
                notifyStoppedTyping();
                handleSendMessageToTarget(activeId, payload);
              }}
              onTyping={notifyTyping}
              onStopTyping={notifyStoppedTyping}
              activeChatName={activeChat?.name}
            />
          </>
        ) : (
          /* Empty State View */
          <div className="expert-welcome-view">
            <button
              className="expert-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              title="เปิดเมนูแชท"
            >
              <Menu size={20} />
            </button>

            <div className="expert-welcome-card">
              <div className="expert-welcome-icon-badge">
                <MessageSquare size={44} color="var(--purple-primary)" />
              </div>

              <h2 className="expert-welcome-title">
                เริ่มต้นใช้งานห้องแชทองค์กร
              </h2>
              
              <p className="expert-welcome-subtitle">
                สร้างกลุ่มแชทใหม่ หรือ เพิ่มเพื่อนร่วมงานเพื่อเริ่มต้นส่งข้อความ
              </p>

              <div className="expert-welcome-actions">
                <button
                  className="quick-pill"
                  onClick={() => setIsCreateChannelModalOpen(true)}
                >
                  <Plus size={14} style={{ marginRight: "4px" }} />
                  สร้างกลุ่มแชทใหม่
                </button>
                <button
                  className="quick-pill"
                  onClick={() => setIsAddFriendModalOpen(true)}
                >
                  <UserPlus size={14} style={{ marginRight: "4px" }} />
                  เพิ่มเพื่อนร่วมงาน
                </button>
              </div>
            </div>
          </div>
        )}
            <CallModal
        isOpen={callState.isOpen}
        callType={callState.callType}
        callerName={activeChat?.name || ""}
        callerAvatar={activeChat?.avatar || "/default-avatar.svg"}
        currentUser={currentUser}
        onClose={() => setCallState({ isOpen: false, callType: "voice" })}
      />

      <NotificationToast
        toasts={Object.values(toastsMap)}
        onCloseToast={handleCloseToast}
        onClickToast={handleClickToast}
      />
      </main>

      {/* Right Info Panel */}
      {activeId && showInfoDrawer && (
        <InfoDrawer
          activeChat={activeChat}
          currentUser={currentUser}
          onOpenPhotoViewer={handleOpenPhotoViewerByObject}
          onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
          onLeaveGroupChannel={handleLeaveGroupChannel}
          onUnfriend={handleUnfriend}
          onOpenCreateAlbumModal={() => setIsCreateAlbumModalOpen(true)}
          onOpenCreateNoteModal={() => setIsCreateNoteModalOpen(true)}
          onOpenThreadReply={(msg) => setActiveThreadParent(msg)}
          albums={currentAlbums}
          notes={currentNotes}
          messages={currentMessages}
          threadsState={threadsState}
        />
      )}

      {/* Floating Chat Head Widget in Bottom Right Corner */}
      {activeChatHeadId && chatHeadChat && (
        <MiniChatHeadWidget
          chat={chatHeadChat}
          messages={chatHeadMessages}
          currentUser={currentUser}
          onSendMessage={(payload) => handleSendMessageToTarget(activeChatHeadId, payload)}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          onAddReaction={handleAddReaction}
          onClose={() => setActiveChatHeadId(null)}
        />
      )}

      {/* Thread Reply Modal Popover */}
      <ThreadReplyModal
        isOpen={Boolean(activeThreadParent)}
        onClose={() => setActiveThreadParent(null)}
        parentMessage={activeThreadParent}
        threadReplies={activeThreadParent ? threadsState[activeThreadParent.id] || [] : []}
        onSendReply={handleSendThreadReply}
      />

      {/* Create Album Modal */}
      <CreateAlbumModal
        isOpen={isCreateAlbumModalOpen}
        onClose={() => setIsCreateAlbumModalOpen(false)}
        onCreateAlbum={handleCreateAlbum}
      />

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={isCreateNoteModalOpen}
        onClose={() => setIsCreateNoteModalOpen(false)}
        onCreateNote={handleCreateNote}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setIsCreateChannelModalOpen(false)}
        onCreateChannel={handleCreateChannel}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onAddFriend={handleAddFriend}
        currentUser={currentUser}
        directMessages={directMessages}
      />

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onAddMember={handleAddMembersToChannel}
        channelName={activeChat?.name}
        directMessages={directMessages}
      />

      {/* User Settings & Theme Modal */}
      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUserProfile}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Photo Viewer Lightbox Modal */}
      <PhotoViewerModal
        isOpen={!!viewingPhotoObj || selectedPhotoIndex !== null}
        photo={
          viewingPhotoObj ||
          (selectedPhotoIndex !== null ? mockSharedPhotos[selectedPhotoIndex] : null)
        }
        onClose={() => {
          setViewingPhotoObj(null);
          setSelectedPhotoIndex(null);
        }}
        onPrev={() => {
          if (viewingPhotoObj) {
            const currIdx = activeChatPhotos.findIndex((p) => p.url === viewingPhotoObj.url);
            if (currIdx > 0) {
              setViewingPhotoObj(activeChatPhotos[currIdx - 1]);
            }
          } else if (selectedPhotoIndex !== null) {
            setSelectedPhotoIndex((prev) => Math.max(0, prev - 1));
          }
        }}
        onNext={() => {
          if (viewingPhotoObj) {
            const currIdx = activeChatPhotos.findIndex((p) => p.url === viewingPhotoObj.url);
            if (currIdx !== -1 && currIdx < activeChatPhotos.length - 1) {
              setViewingPhotoObj(activeChatPhotos[currIdx + 1]);
            }
          } else if (selectedPhotoIndex !== null) {
            setSelectedPhotoIndex((prev) =>
              Math.min(mockSharedPhotos.length - 1, prev + 1)
            );
          }
        }}
        hasPrev={
          viewingPhotoObj
            ? activeChatPhotos.findIndex((p) => p.url === viewingPhotoObj.url) > 0
            : selectedPhotoIndex > 0
        }
        hasNext={
          viewingPhotoObj
            ? (() => {
                const idx = activeChatPhotos.findIndex((p) => p.url === viewingPhotoObj.url);
                return idx !== -1 && idx < activeChatPhotos.length - 1;
              })()
            : selectedPhotoIndex !== null && selectedPhotoIndex < mockSharedPhotos.length - 1
        }
      />
    </div>
  );
}
