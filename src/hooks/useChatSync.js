"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * useChatSync – polls /api/sync-chat-message every 1.5s for new messages,
 * and performs full-sync to ensure no messages are missed and handle real-time deletions.
 *
 * @param {object} currentUser  – { name, id }
 * @param {boolean} isLoggedIn
 * @param {function} onNewMessages – (messages: Array) => void
 * @param {function} onNotify     – (msg) => void  called per incoming msg from others
 * @param {function} onDeletedIds – (deletedIds: string[]) => void  called when messages disappear
 */
export function useChatSync(currentUser, isLoggedIn, onNewMessages, onNotify, onDeletedIds) {
  // Track DB timestamp for incremental fetch
  const lastSinceRef = useRef(null);
  // Set of all message IDs we have processed
  const knownIdsRef = useRef(new Set());
  // Set of message IDs specifically confirmed returned from Supabase GET
  const confirmedSupabaseIdsRef = useRef(new Set());

  const intervalRef = useRef(null);
  const fullSyncIntervalRef = useRef(null);
  const isFirstPollRef = useRef(true);

  // Process incoming messages from Supabase GET
  const processMessages = useCallback(
    (msgs, isFirstCall = false) => {
      if (!msgs || msgs.length === 0) return;

      const newMsgs = [];
      msgs.forEach((msg) => {
        if (!msg?.id) return;

        // Mark as confirmed in Supabase
        confirmedSupabaseIdsRef.current.add(msg.id);

        if (!knownIdsRef.current.has(msg.id)) {
          knownIdsRef.current.add(msg.id);
          newMsgs.push(msg);
        }

        // Update incremental cursor
        if (msg._dbCreatedAt) {
          if (!lastSinceRef.current || msg._dbCreatedAt > lastSinceRef.current) {
            lastSinceRef.current = msg._dbCreatedAt;
          }
        }
      });

      if (newMsgs.length > 0) {
        onNewMessages(newMsgs);

        // Suppress toast notifications on initial page load / refresh
        if (!isFirstCall) {
          newMsgs.forEach((msg) => {
            if (
              msg.sender &&
              currentUser?.name &&
              msg.sender.toLowerCase() !== currentUser.name.toLowerCase()
            ) {
              onNotify && onNotify(msg);
            }
          });
        }
      }
    },
    [currentUser, onNewMessages, onNotify]
  );

  // Incremental poll – fetch new messages since last cursor
  const poll = useCallback(async () => {
    if (!isLoggedIn || !currentUser) return;
    try {
      let url = "/api/sync-chat-message";
      if (lastSinceRef.current) {
        url += `?since=${encodeURIComponent(lastSinceRef.current)}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const msgs = data?.messages || [];

      const isFirst = isFirstPollRef.current;
      isFirstPollRef.current = false;

      processMessages(msgs, isFirst);
    } catch (err) {
      // Network error – skip
    }
  }, [isLoggedIn, currentUser, processMessages]);

  // Full sync – fetch ALL messages to catch missed messages and detect deletions
  const fullSync = useCallback(async () => {
    if (!isLoggedIn || !currentUser) return;
    try {
      const res = await fetch("/api/sync-chat-message");
      if (!res.ok) return;
      const data = await res.json();
      const msgs = data?.messages || [];

      // Process any messages we haven't seen yet
      processMessages(msgs, false);

      // Build set of IDs currently present in Supabase
      const supabaseIds = new Set(msgs.map((m) => m.id).filter(Boolean));

      // Find IDs that WERE previously confirmed in Supabase, but are NOW missing -> deleted by someone
      const deletedIds = [];
      confirmedSupabaseIdsRef.current.forEach((id) => {
        if (!supabaseIds.has(id)) {
          deletedIds.push(id);
        }
      });

      if (deletedIds.length > 0) {
        deletedIds.forEach((id) => {
          confirmedSupabaseIdsRef.current.delete(id);
          knownIdsRef.current.delete(id);
        });
        onDeletedIds && onDeletedIds(deletedIds);
      }
    } catch (err) {
      // Skip
    }
  }, [isLoggedIn, currentUser, processMessages, onDeletedIds]);

  useEffect(() => {
    if (!isLoggedIn) return;

    isFirstPollRef.current = true;

    // Fetch immediately on mount / login
    poll();

    // Incremental poll every 1.5s
    intervalRef.current = setInterval(poll, 1500);

    // Full sync every 4s to catch missed messages and deletions
    fullSyncIntervalRef.current = setInterval(fullSync, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (fullSyncIntervalRef.current) clearInterval(fullSyncIntervalRef.current);
    };
  }, [isLoggedIn, poll, fullSync]);
}
