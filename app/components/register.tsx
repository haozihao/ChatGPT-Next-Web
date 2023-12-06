import styles from "./register.module.scss";
import { IconButton } from "./button";

import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";

import BotIcon from "../icons/bot.svg";
import { useEffect } from "react";
import { getClientConfig } from "../config/client";

export function RegisterPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  const goHome = () => navigate(Path.Home);
  const goChat = () => navigate(Path.Chat);
  const resetAccessCode = () => {
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
      access.username = "";
      access.password = "";
    });
  }; // Reset access code to empty string

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

      <div className={styles["auth-title"]}>{Locale.Auth.LoginTitle}</div>
      {/* <div className={styles["auth-tips"]}>{Locale.Auth.LoginTips}</div> */}

      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Auth.UsernameInput}
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
        placeholder={Locale.Auth.PasswordInput}
        value={accessStore.password}
        onChange={(e) => {
          accessStore.update(
            (access) => (access.password = e.currentTarget.value),
          );
        }}
      />

      
      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          onClick={goChat}
        />
        {/* <IconButton
            key=""
            onClick={props.onClose}
            text={Locale.UI.Confirm}
            bordered
          />, */}
        <IconButton
          text={Locale.Auth.Register}
          onClick={goChat}
          bordered
        />
      </div>
      <div className={styles["auth-exit"]}>
        <IconButton
            text={Locale.Auth.Later}
            onClick={() => {
              resetAccessCode();
              goHome();
            }}
          />
      </div>
    </div>
  );
}
