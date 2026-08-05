import { NextResponse } from "next/server";

// In-memory typing state (resets when server restarts, which is fine for UX)
// Structure: { [channelId]: { [userName]: expiresAt (ms timestamp) } }
const typingState = {};

// Clean up expired typing indicators automatically
function cleanExpired(channelId) {
  if (!typingState[channelId]) return;
  const now = Date.now();
  Object.keys(typingState[channelId]).forEach((user) => {
    if (typingState[channelId][user] < now) {
      delete typingState[channelId][user];
    }
  });
  if (Object.keys(typingState[channelId]).length === 0) {
    delete typingState[channelId];
  }
}

// GET /api/typing?channelId=xxx&currentUser=yyy
// Returns list of users currently typing (excluding currentUser)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");
  const currentUser = (searchParams.get("currentUser") || "").toLowerCase();

  if (!channelId) {
    return NextResponse.json({ typingUsers: [] });
  }

  cleanExpired(channelId);

  const typingUsers = Object.keys(typingState[channelId] || {}).filter(
    (u) => u.toLowerCase() !== currentUser
  );

  return NextResponse.json({ typingUsers });
}

// POST /api/typing  body: { channelId, userName, isTyping }
// Sets or clears typing indicator for a user in a channel
export async function POST(request) {
  try {
    const { channelId, userName, isTyping } = await request.json();
    if (!channelId || !userName) {
      return NextResponse.json({ success: false });
    }

    if (!typingState[channelId]) typingState[channelId] = {};

    if (isTyping) {
      // Expire typing indicator after 5 seconds
      typingState[channelId][userName] = Date.now() + 5000;
    } else {
      delete typingState[channelId][userName];
    }

    cleanExpired(channelId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}
