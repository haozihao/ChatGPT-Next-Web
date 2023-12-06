import { NextRequest } from "next/server";
import { getServerSideConfig } from "../config/server";
import md5 from "spark-md5";
import { ACCESS_CODE_PREFIX } from "../constant";

function getIP(req: NextRequest) {
  let ip = req.ip ?? req.headers.get("x-real-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",").at(0) ?? "";
  }

  return ip;
}

function parseApiKey(bearToken: string) {
  const token = bearToken.trim().replaceAll("Bearer ", "").trim();
  const isOpenAiKey = !token.startsWith(ACCESS_CODE_PREFIX);

  return {
    accessCode: isOpenAiKey ? "" : token.slice(ACCESS_CODE_PREFIX.length),
    apiKey: isOpenAiKey ? token : "",
  };
}

export async function getCode(req: NextRequest) {
  let authToken = req.headers.get("Authorization") ?? "";
  authToken = atob(authToken);
  // 获取用户名密码
  const strList = authToken.split("&");
  if (strList.length < 2) {
    console.log("[Auth] 账号或密码缺失，token：", authToken);
    return {
      error: true,
      msg: "账号或密码缺失",
    };
  }
  const userNmae = strList[0].split("=")[1];
  const password = strList[1].split("=")[1];

  if (!userNmae || !password) {
    console.log("[Auth] 账号或密码不能为空，token：", authToken);
    return {
      error: true,
      msg: "账号或密码不能为空",
    };
  }

  const serverConfig = getServerSideConfig();
  console.log("[Auth] userNmae: ", userNmae);
  console.log("[Auth] password:", password);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  const res = await fetch("http://43.134.87.149:8080/api/users/checkUser", {
    body: JSON.stringify({
      username: userNmae,
      password: password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const resJson = await res.json();
  console.log("[checkUser] ", resJson);
  if (!resJson.result) {
    console.log("[Auth] 账号或密码不正确，token：", authToken);
    return {
      error: true,
      msg: "账号或密码不正确",
    };
  }
  console.log("[checkUser] ", "账号密码验证通过");
  const serverApiKey = serverConfig.apiKey;
  if (serverApiKey) {
    console.log("[Auth] use system api key");
    req.headers.set("Authorization", `${"Bearer "}${serverApiKey}`);
  } else {
    console.log("[Auth] admin did not provide an api key");
  }

  return {
    error: false,
  };
}

export function register(req: NextRequest) {
  const authToken = req.headers.get("Authorization") ?? "";

  // check if it is openai api key or user token
  const { accessCode, apiKey } = parseApiKey(authToken);

  const hashedCode = md5.hash(accessCode ?? "").trim();

  const serverConfig = getServerSideConfig();
  console.log("[Auth] allowed hashed codes: ", [...serverConfig.codes]);
  console.log("[Auth] got access code:", accessCode);
  console.log("[Auth] hashed access code:", hashedCode);
  console.log("[User IP] ", getIP(req));
  console.log("[Time] ", new Date().toLocaleString());

  if (serverConfig.needCode && !serverConfig.codes.has(hashedCode) && !apiKey) {
    return {
      error: true,
      msg: !accessCode ? "empty access code" : "wrong access code",
    };
  }

  if (serverConfig.hideUserApiKey && !!apiKey) {
    return {
      error: true,
      msg: "you are not allowed to access openai with your own api key",
    };
  }

  // if user does not provide an api key, inject system api key
  if (!apiKey) {
    const serverApiKey = serverConfig.isAzure
      ? serverConfig.azureApiKey
      : serverConfig.apiKey;

    if (serverApiKey) {
      console.log("[Auth] use system api key");
      req.headers.set(
        "Authorization",
        `${serverConfig.isAzure ? "" : "Bearer "}${serverApiKey}`,
      );
    } else {
      console.log("[Auth] admin did not provide an api key");
    }
  } else {
    console.log("[Auth] use user api key");
  }

  return {
    error: false,
  };
}
