import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inviteId = body?.inviteId as string;
    const code = body?.code as string;

    if (!inviteId || !code || code.length !== 4) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite request" },
        { status: 400 }
      );
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("invite_sessions")
      .select("*")
      .eq("invite_id", inviteId)
      .eq("access_code", code)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { ok: false, error: "Invalid code or invite" },
        { status: 404 }
      );
    }

    if (sessionData.used) {
      return NextResponse.json(
        { ok: false, error: "This invite has already been used" },
        { status: 409 }
      );
    }

    const { data: projectData, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("id", sessionData.project_id)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { ok: false, error: "Could not load project details" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      projectId: projectData.id,
      projectName: projectData.name,
    });
  } catch (err) {
    console.error("Verify invite error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
