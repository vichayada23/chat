import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://nozcahuoluihxtacerru.supabase.co";

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_w8FunRGA1K6WQzmS-AMRYQ_mxw2C_Xm";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Single fixed channel_id that satisfies Supabase FK constraint
const DEFAULT_CHANNEL_ID = "d7842b3d-2d85-44f7-9f28-92ab439ede73";

// --- GET: Fetch messages, optionally filtered by channelId ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetChannel = searchParams.get("channelId");
    const since = searchParams.get("since"); // ISO timestamp for incremental fetch

    let query = supabaseAdmin
      .from("messages")
      .select("*")
      .eq("channel_id", DEFAULT_CHANNEL_ID)
      .eq("role", "ChatMessage")
      .order("created_at", { ascending: true });

    if (since) {
      query = query.gt("created_at", since);
    }

    const { data: dbMessages, error } = await query;

    if (error) {
      console.error("GET sync-chat-message error:", error);
      return NextResponse.json({ messages: [] });
    }

    const parsedList = [];
    const seenMsgIds = new Map();

    if (dbMessages && dbMessages.length > 0) {
      dbMessages.forEach((m) => {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && parsed.channelId && parsed.id) {
            // Filter by channelId if provided
            if (!targetChannel || parsed.channelId === targetChannel) {
              seenMsgIds.set(parsed.id, { ...parsed, _dbCreatedAt: m.created_at });
            }
          }
        } catch (e) {}
      });
    }

    return NextResponse.json({ messages: Array.from(seenMsgIds.values()) });
  } catch (err) {
    console.error("GET sync-chat-message exception:", err);
    return NextResponse.json({ messages: [] });
  }
}

// --- POST: Save or Update a message ---
export async function POST(request) {
  try {
    const reqBody = await request.json();
    if (!reqBody || !reqBody.channelId) {
      return NextResponse.json({ success: false, error: "Missing channelId" });
    }

    // Ensure unique message ID
    const msgId = reqBody.id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = { ...reqBody, id: msgId };

    // Check if message with this ID already exists
    const { data: existingRows } = await supabaseAdmin
      .from("messages")
      .select("id, content")
      .eq("role", "ChatMessage")
      .eq("channel_id", DEFAULT_CHANNEL_ID);

    let existingRowId = null;
    if (existingRows) {
      for (const row of existingRows) {
        try {
          const parsed = JSON.parse(row.content);
          if (parsed && parsed.id === msgId) {
            existingRowId = row.id;
            break;
          }
        } catch (e) {}
      }
    }

    if (existingRowId) {
      // Update existing message content (e.g. for readBy or reaction updates)
      const { data, error } = await supabaseAdmin
        .from("messages")
        .update({
          sender_name: payload.sender || payload.senderName || "User",
          sender_avatar: payload.senderAvatar || payload.avatar || "/default-avatar.svg",
          content: JSON.stringify(payload),
        })
        .eq("id", existingRowId)
        .select();

      if (error) {
        console.error("POST sync-chat-message update error:", error);
        return NextResponse.json({ success: false, error: error.message });
      }
      return NextResponse.json({ success: true, data, id: msgId, updated: true });
    } else {
      // Insert new message
      const { data, error } = await supabaseAdmin
        .from("messages")
        .insert([
          {
            channel_id: DEFAULT_CHANNEL_ID,
            sender_name: payload.sender || payload.senderName || "User",
            sender_avatar: payload.senderAvatar || payload.avatar || "/default-avatar.svg",
            role: "ChatMessage",
            content: JSON.stringify(payload),
          },
        ])
        .select();

      if (error) {
        console.error("POST sync-chat-message insert error:", error);
        return NextResponse.json({ success: false, error: error.message });
      }

      return NextResponse.json({ success: true, data, id: msgId });
    }
  } catch (err) {
    console.error("POST sync-chat-message exception:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

// --- DELETE: Delete a message by id stored in content JSON ---
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "Missing id" });

    // Find row where content JSON contains the id
    const { data: rows } = await supabaseAdmin
      .from("messages")
      .select("id, content")
      .eq("role", "ChatMessage")
      .eq("channel_id", DEFAULT_CHANNEL_ID);

    if (rows) {
      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.content);
          if (parsed.id === id) {
            await supabaseAdmin.from("messages").delete().eq("id", row.id);
            break;
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
