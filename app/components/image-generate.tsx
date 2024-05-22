import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChatMessage,
  createMessage,
  SubmitKey,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "@/app/store";
import styles from "@/app/components/image-generate.module.scss";
import { IconButton } from "@/app/components/button";
import ReturnIcon from "@/app/icons/return.svg";
import Locale from "@/app/locales";
import { CHAT_PAGE_SIZE, LAST_INPUT_KEY, Path } from "@/app/constant";
import MinIcon from "@/app/icons/min.svg";
import MaxIcon from "@/app/icons/max.svg";
import { showToast } from "@/app/components/ui-lib";
import { useMobileScreen } from "@/app/utils";
import SendWhiteIcon from "@/app/icons/send-white.svg";
import { ExportMessageModal } from "@/app/components/exporter";
import { EditMessageModal, RenderPompt } from "@/app/components/chat";
import { useNavigate } from "react-router-dom";
import { getClientConfig } from "@/app/config/client";
import { usePromptStore } from "@/app/store/prompt";
import Image from "next/image";
import CloseIcon from "@/app/icons/close.svg";
import LoadingIcon from "@/app/icons/three-dots.svg";
import BotIcon from "@/app/icons/bot.svg";
import { getHeaders } from "@/app/client/api";

export function ImageGenerate() {
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const sessionIndex = chatStore.currentSessionIndex;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const clientConfig = useMemo(() => getClientConfig(), []);
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;
  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const [imageContent, setImageContent] = useState("");
  const [base64Data, setBase64Data] = useState("");

  const doSubmit = async (userInput: string) => {
    if (userInput.trim() === "" || isLoading) return;
    setBase64Data("");
    try {
      setIsLoading(true);
      const res = await fetch("/api/common/audit", {
        body: JSON.stringify({
          content: userInput,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const resJson = await res.json();
      console.log("[audit] ", resJson);
      if (!resJson.result) {
        showToast("发送问题中有敏感词，请检查！");
        return;
      }
      const resImage = await fetch("/api/common/image", {
        body: JSON.stringify({
          content: userInput,
        }),
        headers: getHeaders(),
        method: "POST",
      });
      const resImageJson = await resImage.json();
      console.log("[image] ", resImageJson);
      if (!resImageJson.result) {
        showToast(resImageJson.message);
        if (resImage.status === 401) {
          navigate(Path.Auth);
        }
        return;
      }
      setBase64Data(resImageJson.data.data[0].b64_json);
      session.imageBase64 = resImageJson.data.data[0].b64_json;
      session.imageContent = userInput;
      if (!isMobileScreen) inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  function useSubmitHandler() {
    const config = useAppConfig();
    const submitKey = config.submitKey;
    const isComposing = useRef(false);

    useEffect(() => {
      const onCompositionStart = () => {
        isComposing.current = true;
      };
      const onCompositionEnd = () => {
        isComposing.current = false;
      };

      window.addEventListener("compositionstart", onCompositionStart);
      window.addEventListener("compositionend", onCompositionEnd);

      return () => {
        window.removeEventListener("compositionstart", onCompositionStart);
        window.removeEventListener("compositionend", onCompositionEnd);
      };
    }, []);

    const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter") return false;
      if (
        e.key === "Enter" &&
        (e.nativeEvent.isComposing || isComposing.current)
      )
        return false;
      return (
        (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
        (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
        (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
        (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
        (config.submitKey === SubmitKey.Enter &&
          !e.altKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.metaKey)
      );
    };

    return {
      submitKey,
      shouldSubmit,
    };
  }

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (shouldSubmit(e)) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };

  useEffect(() => {
    setUserInput(session.imageContent);
    setBase64Data(session.imageBase64);
  }, []);

  return (
    <div className={styles.image} key={"image-generate"}>
      <div className="window-header" data-tauri-drag-region>
        {isMobileScreen && (
          <div className="window-actions">
            <div className={"window-action-button"}>
              <IconButton
                icon={<ReturnIcon />}
                bordered
                title={Locale.Chat.Actions.ChatList}
                onClick={() => navigate(Path.Home)}
              />
            </div>
          </div>
        )}

        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
            onClickCapture={() => setIsEditingMessage(true)}
          >
            {Locale.ImageChat.MainTitle}
          </div>
          <div className="window-header-sub-title">
            {Locale.ImageChat.SubTitle}
          </div>
        </div>
        <div className="window-actions">
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={<CloseIcon />}
                onClick={() => navigate(Path.Home)}
                bordered
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles["chat-body"]}>
        {isLoading ? (
          <div className={styles["loading-content"] + " no-dark"}>
            <LoadingIcon />
          </div>
        ) : (
          base64Data && (
            <Image
              className={styles["chat-image"]}
              src={`data:image/jpeg;base64,${base64Data}`}
              alt="chat generate picture"
              width={200}
              height={200}
              layout="responsive"
            />
          )
        )}
      </div>

      <div className={styles["chat-input-panel"]}>
        <div className={styles["chat-input-panel-inner"]}>
          <textarea
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.ImageChat.Placeholder}
            onInput={(e) => setUserInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            rows={inputRows}
            autoFocus={autoFocus}
            style={{
              fontSize: config.fontSize,
            }}
          />
          <IconButton
            icon={<SendWhiteIcon />}
            disabled={!userInput || isLoading}
            text={Locale.ImageChat.Actions.Generate}
            className={styles["chat-input-send"]}
            type="primary"
            onClick={() => doSubmit(userInput)}
          />
        </div>
      </div>
    </div>
  );
}
