import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inviteId = body?.inviteId as string;
    const code = body?.code as string;
    const name = (body?.name as string) || "";
    const imageUrl = body?.imageUrl as string;
    const audioUrl = body?.audioUrl as string;

    if (!inviteId || !code || code.length !== 4 || !name.trim() || !imageUrl || !audioUrl) {
      return NextResponse.json(
        { ok: false, error: "Invalid submission" },
        { status: 400 }
      );
    }

    // Verify invite session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("invite_sessions")
      .select("*")
      .eq("invite_id", inviteId)
      .eq("access_code", code)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite or code" },
        { status: 404 }
      );
    }

    if (sessionData.used) {
      return NextResponse.json(
        { ok: false, error: "Invite already used" },
        { status: 409 }
      );
    }

    // Get project owner id
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, user_id")
      .eq("id", sessionData.project_id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { ok: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Insert card
    const { error: cardError } = await supabaseAdmin.from("birthday_cards").insert({
      name: name.trim(),
      image_url: imageUrl,
      audio_url: audioUrl,
      project_id: projectData.id,
      user_id: projectData.user_id,
    });

    if (cardError) {
      console.error("Card insert error:", cardError);
      return NextResponse.json(
        { ok: false, error: "Failed to save card" },
        { status: 500 }
      );
    }

    // Mark invite as used
    const { error: updateError } = await supabaseAdmin
      .from("invite_sessions")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", sessionData.id);

    if (updateError) {
      console.error("Invite update error:", updateError);
      return NextResponse.json(
        { ok: false, error: "Failed to update invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Submit invite error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
