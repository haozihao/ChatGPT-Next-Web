import { NextRequest, NextResponse } from "next/server";

async function handle(req: NextRequest) {
  const clonedBody = await req.clone().json();
  const res = await fetch(process.env.SEVER_API_URL + "/api/common/auditText", {
    body: JSON.stringify({
      content: clonedBody.content,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const resJson = await res.json();
  return NextResponse.json(resJson);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
