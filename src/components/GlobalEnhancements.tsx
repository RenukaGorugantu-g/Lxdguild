"use client";

import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(() => import("@/components/ChatbotWidget"), {
  ssr: false,
});

export default function GlobalEnhancements() {
  return <ChatbotWidget />;
}
