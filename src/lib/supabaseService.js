import { supabase } from "./supabaseClient";

/**
 * Fetch messages from Supabase
 */
export async function fetchSupabaseMessages(channelId) {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Supabase fetch error, fallback to local state:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Supabase connection error:", err);
    return null;
  }
}

/**
 * Insert a new message into Supabase
 */
export async function sendSupabaseMessage({ channelId, senderId, senderName, senderAvatar, role, content }) {
  try {
    const { data, error } = await supabase.from("messages").insert([
      {
        channel_id: channelId,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        role: role,
        content: content,
      },
    ]).select();

    if (error) {
      console.warn("Supabase insert message error:", error.message);
      return null;
    }
    return data ? data[0] : null;
  } catch (err) {
    console.warn("Supabase insert message exception:", err);
    return null;
  }
}

/**
 * Upload a file/photo attachment to Supabase Storage bucket 'chat-attachments'
 */
export async function uploadSupabaseAttachment(file) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .upload(filePath, file);

    if (error) {
      console.warn("Storage upload error:", error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn("Storage upload exception:", err);
    return null;
  }
}
