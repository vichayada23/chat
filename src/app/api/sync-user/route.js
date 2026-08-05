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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("query") || "").toLowerCase().trim();

    const usersList = [];
    const seenEmails = new Set();

    // 1. Query Supabase users table (with ilike if query provided)
    try {
      let dbReq = supabaseAdmin.from("users").select("*");
      if (query) {
        dbReq = dbReq.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
      }
      const { data: dbUsers } = await dbReq;
      if (dbUsers && dbUsers.length > 0) {
        dbUsers.forEach((u) => {
          if (!u || (!u.email && !u.name)) return;
          const emailKey = (u.email || u.name).toLowerCase().trim();
          if (!seenEmails.has(emailKey)) {
            seenEmails.add(emailKey);
            usersList.push({
              id: u.id ? (String(u.id).startsWith("u-") ? String(u.id) : `u-${u.id}`) : `u-${Date.now()}`,
              name: u.name,
              email: u.email || `${u.name}@company.com`,
              role: u.role || "Team Member",
              avatar: u.avatar || "/default-avatar.svg",
            });
          }
        });
      }
    } catch (e) {}

    // 2. Fetch from messages table where role = "UserProfile"
    try {
      const { data: dbMsgs } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("channel_id", DEFAULT_CHANNEL_ID)
        .eq("role", "UserProfile");

      if (dbMsgs && dbMsgs.length > 0) {
        dbMsgs.forEach((m) => {
          try {
            const parsed = JSON.parse(m.content);
            if (parsed && (parsed.email || parsed.name)) {
              const uName = (parsed.name || "").toLowerCase().trim();
              const uEmail = (parsed.email || "").toLowerCase().trim();
              const uPrefix = uEmail ? uEmail.split("@")[0] : "";

              if (query && !uName.includes(query) && !uEmail.includes(query) && !uPrefix.includes(query)) {
                return;
              }

              const emailKey = (parsed.email || parsed.name).toLowerCase().trim();
              if (!seenEmails.has(emailKey)) {
                seenEmails.add(emailKey);
                usersList.push(parsed);
              } else {
                const idx = usersList.findIndex(
                  (x) =>
                    (x.email && parsed.email && x.email.toLowerCase() === parsed.email.toLowerCase()) ||
                    (x.name && parsed.name && x.name.toLowerCase() === parsed.name.toLowerCase())
                );
                if (idx !== -1) {
                  usersList[idx] = { ...usersList[idx], ...parsed };
                }
              }
            }
          } catch (e) {}
        });
      }
    } catch (e) {}

    return NextResponse.json({ users: usersList });
  } catch (err) {
    console.error("GET sync-user exception:", err);
    return NextResponse.json({ users: [] });
  }
}

export async function POST(request) {
  try {
    const reqBody = await request.json();
    if (!reqBody || (!reqBody.email && !reqBody.name)) {
      return NextResponse.json({ success: false, error: "Invalid payload" });
    }

    const userName = reqBody.name || (reqBody.email ? reqBody.email.split("@")[0] : "สมาชิกองค์กร");
    const userEmail = (reqBody.email || "").toLowerCase().trim();

    const userObj = {
      id: reqBody.id || `u-${Date.now()}`,
      name: userName,
      role: reqBody.role || "Team Member",
      email: userEmail,
      avatar: reqBody.avatar || "/default-avatar.svg",
      status: "online",
    };

    // 1. Save to users table
    try {
      await supabaseAdmin.from("users").upsert([
        {
          name: userName,
          email: userEmail,
          role: userObj.role,
          avatar: userObj.avatar,
        },
      ]);
    } catch (e) {}

    // 2. Save to messages table with role = "UserProfile"
    try {
      await supabaseAdmin.from("messages").insert([
        {
          channel_id: DEFAULT_CHANNEL_ID,
          sender_name: userName,
          sender_avatar: userObj.avatar,
          role: "UserProfile",
          content: JSON.stringify(userObj),
        },
      ]);
    } catch (e) {}

    return NextResponse.json({ success: true, user: userObj });
  } catch (err) {
    console.error("POST sync-user exception:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
