import { NextRequest, NextResponse } from "next/server";
import { authLogin } from "@/app/api/auth";

async function handle(req: NextRequest) {
  const authResult = await authLogin(req);
  if (authResult.error) {
    return NextResponse.json(
      {
        result: false,
        message: authResult.msg,
      },
      {
        status: 401,
      },
    );
  }

  const clonedBody = await req.clone().json();

  const res = await fetch(
    process.env.SEVER_API_URL + "/api/common/imageGenerate",
    {
      body: JSON.stringify({
        content: clonedBody.content,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  const resJson = await res.json();
  return NextResponse.json(resJson);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
