"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useTypingSync – broadcasts typing status to /api/typing
 * and polls for other users' typing status every 800ms.
 *
 * @param {string|React.RefObject} channelIdOrRef  – active channel/room ID, or a ref whose .current holds it
 * @param {string} userName    – current user's name
 * @param {boolean} isLoggedIn
 * @param {function} onTypingChange – (isAnyoneTyping: boolean, typingUsers: string[]) => void
 * @returns {object} { notifyTyping, notifyStoppedTyping }
 */
export function useTypingSync(channelIdOrRef, userName, isLoggedIn, onTypingChange) {
  const pollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isBroadcastingRef = useRef(false);

  // Helper: resolve the channelId value from either a plain string or a React ref
  const getChannelId = useCallback(() => {
    if (channelIdOrRef && typeof channelIdOrRef === "object" && "current" in channelIdOrRef) {
      return channelIdOrRef.current;
    }
    return channelIdOrRef;
  }, [channelIdOrRef]);

  // Broadcast that we stopped typing
  const notifyStoppedTyping = useCallback(() => {
    const channelId = getChannelId();
    if (!channelId || !userName) return;
    isBroadcastingRef.current = false;
    clearTimeout(typingTimeoutRef.current);
    fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, userName, isTyping: false }),
    }).catch(() => {});
  }, [getChannelId, userName]);

  // Broadcast that we are typing
  const notifyTyping = useCallback(() => {
    const channelId = getChannelId();
    if (!channelId || !userName || !isLoggedIn) return;

    if (!isBroadcastingRef.current) {
      isBroadcastingRef.current = true;
      fetch("/api/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, userName, isTyping: true }),
      }).catch(() => {});
    }

    // Reset expiry timer: stop broadcasting 5s after last keystroke
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      notifyStoppedTyping();
    }, 5000);
  }, [getChannelId, userName, isLoggedIn, notifyStoppedTyping]);

  // Poll for others' typing status every 800ms
  useEffect(() => {
    if (!isLoggedIn || !userName) return;

    const poll = async () => {
      const channelId = getChannelId();
      if (!channelId) return;
      try {
        const res = await fetch(
          `/api/typing?channelId=${encodeURIComponent(channelId)}&currentUser=${encodeURIComponent(userName)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const users = data?.typingUsers || [];
        onTypingChange(users.length > 0, users);
      } catch (e) {}
    };

    poll();
    pollRef.current = setInterval(poll, 800);

    return () => {
      clearInterval(pollRef.current);
      notifyStoppedTyping();
    };
  }, [isLoggedIn, userName, getChannelId, onTypingChange, notifyStoppedTyping]);

  return { notifyTyping, notifyStoppedTyping };
}
