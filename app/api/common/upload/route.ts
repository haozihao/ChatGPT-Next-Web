// pages/api/upload.ts
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

const handle = async (req: NextRequest) => {
  const data = await req.formData();
  const file: File | null = data.get("file") as unknown as File;

  if (!file) {
    return NextResponse.json({
      result: false,
      message: "请上传文件!",
    });
  }

  const res = await fetch(process.env.SEVER_API_URL + "/api/upload", {
    body: data,
    method: "POST",
  });
  const resJson = await res.json();

  return NextResponse.json(resJson);
};

export const POST = handle;

export const runtime = "edge";
