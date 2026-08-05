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

const DEFAULT_CHANNEL_ID = "d7842b3d-2d85-44f7-9f28-92ab439ede73";

export async function GET() {
  try {
    const { data: dbRequests, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("channel_id", DEFAULT_CHANNEL_ID)
      .eq("role", "FriendRequest")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET sync-friend-request error:", error);
      return NextResponse.json({ requests: [] });
    }

    const parsedList = [];
    if (dbRequests && dbRequests.length > 0) {
      dbRequests.forEach((m) => {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && parsed.id) {
            parsedList.push(parsed);
          }
        } catch (e) {}
      });
    }

    return NextResponse.json({ requests: parsedList });
  } catch (err) {
    console.error("GET sync-friend-request exception:", err);
    return NextResponse.json({ requests: [] });
  }
}

export async function POST(request) {
  try {
    const reqBody = await request.json();
    if (!reqBody || !reqBody.id) {
      return NextResponse.json({ success: false, error: "Invalid payload" });
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([
        {
          channel_id: DEFAULT_CHANNEL_ID,
          sender_name: reqBody.senderName || "User",
          sender_avatar: reqBody.senderAvatar || "/default-avatar.svg",
          role: "FriendRequest",
          content: JSON.stringify(reqBody),
        },
      ])
      .select();

    if (error) {
      console.error("POST sync-friend-request error:", error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("POST sync-friend-request exception:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
