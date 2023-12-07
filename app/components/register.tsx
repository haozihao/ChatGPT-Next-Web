import styles from "./register.module.scss";
import "react-toastify/dist/ReactToastify.css";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import { useEffect } from "react";
import { getClientConfig } from "../config/client";
import { ToastContainer, toast } from "react-toastify";

export function RegisterPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  const confirmRegister = async () => {
    if (
      !accessStore.username ||
      !accessStore.password ||
      !accessStore.captchaCode
    ) {
      toast.warn("邮箱、密码和验证码必须输入！");
      return;
    }
    const res = await accessStore.registerUser();
    if (res.result) {
      toast.success(res.message);
    } else {
      toast.warn(res.message);
    }
  };
  const goAuth = () => navigate("/auth");
  // const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.username = "";
      access.password = "";
      access.captchaCode = "";
    });
  }; // Reset access code to empty string
  const sendCode = async () => {
    if (!accessStore.username) {
      toast.warn("请输入后邮箱后发送验证码！");
      return;
    }
    const res = await accessStore.sendCaptcha();
    if (res.result) {
      toast.success(res.message);
    } else {
      toast.warn(res.message);
    }
  };

  useEffect(() => {
    if (getClientConfig()?.isApp) {
      navigate(Path.Settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles["register-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Register.Title}</div>

      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Register.UsernameInput}
        value={accessStore.username}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.username = e.currentTarget.value),
          );
        }}
      />
      <input
        className={styles["auth-input"]}
        type="password"
        placeholder={Locale.Register.PasswordInput}
        value={accessStore.password}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.password = e.currentTarget.value),
          );
        }}
      />
      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Register.CodeInput}
        value={accessStore.captchaCode}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.captchaCode = e.currentTarget.value),
          );
        }}
      />

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Register.Confirm}
          type="primary"
          onClick={confirmRegister}
        />
        <IconButton
          text={Locale.Register.Captcha}
          onClick={sendCode}
          bordered
        />
      </div>
      <div className={styles["auth-exit"]}>
        <IconButton
          text={Locale.Register.Later}
          onClick={() => {
            resetAccessCode();
            goAuth();
          }}
        />
      </div>
      <ToastContainer />
    </div>
  );
}
