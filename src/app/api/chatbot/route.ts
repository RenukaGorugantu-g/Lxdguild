import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  CHATBOT_QUICK_PROMPTS,
  getChatbotFactsForRole,
  matchChatbotFaq,
  type ChatbotRole,
} from "@/lib/chatbot-knowledge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function resolveChatbotRole(role?: string | null): ChatbotRole {
  const normalized = (role || "").toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized.startsWith("employer")) return "employer";
  if (normalized.startsWith("candidate")) return "candidate";
  return "guest";
}

function buildFallbackReply(role: ChatbotRole) {
  if (role === "employer") {
    return "I can help with employer workflow questions like posting jobs, reviewing applicants, interview scheduling, ATS context, and notifications. Ask me one of those and I’ll guide you.";
  }

  if (role === "candidate") {
    return "I can help with candidate workflow questions like assessments, ATS score meaning, resume suggestions, applications, interviews, and certificate upload. Ask me one of those and I’ll guide you.";
  }

  return "I can help with common LXD Guild questions around membership, assessments, jobs, ATS scoring, and employer workflow. Ask a specific question and I’ll do my best to help.";
}

function extractOpenAIText(payload: any) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const textParts: string[] = [];
  const outputs = Array.isArray(payload?.output) ? payload.output : [];

  for (const item of outputs) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const entry of content) {
      if (typeof entry?.text === "string" && entry.text.trim()) {
        textParts.push(entry.text.trim());
      } else if (typeof entry?.output_text === "string" && entry.output_text.trim()) {
        textParts.push(entry.output_text.trim());
      }
    }
  }

  return textParts.join("\n\n").trim();
}

async function generateAiReply({
  query,
  history,
  role,
}: {
  query: string;
  history: ChatMessage[];
  role: ChatbotRole;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5";
  const facts = getChatbotFactsForRole(role);

  const input = [
    {
      role: "developer",
      content:
        "You are the LXD Guild product assistant. Answer only about the app and its workflows. Be concise, helpful, and practical. If you are unsure, say so and avoid inventing product behavior.",
    },
    {
      role: "developer",
      content: `Known product context:\n- ${facts.join("\n- ")}`,
    },
    ...history.slice(-6).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: query,
    },
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      input,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Chatbot AI fallback failed:", errorText);
    return null;
  }

  const payload = await response.json();
  return extractOpenAIText(payload) || null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      query?: string;
      history?: ChatMessage[];
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "Missing query." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let role: ChatbotRole = "guest";
    if (user) {
      const profileResult = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      role = resolveChatbotRole(profileResult.data?.role);
    }

    const faqMatch = matchChatbotFaq(query, role);
    if (faqMatch) {
      return NextResponse.json({
        source: "faq",
        role,
        reply: faqMatch.answer,
        title: faqMatch.title,
        quickReplies: faqMatch.quickReplies || CHATBOT_QUICK_PROMPTS,
      });
    }

    const aiReply = await generateAiReply({
      query,
      history: Array.isArray(body.history) ? body.history : [],
      role,
    });

    if (aiReply) {
      return NextResponse.json({
        source: "ai",
        role,
        reply: aiReply,
        quickReplies: CHATBOT_QUICK_PROMPTS,
      });
    }

    return NextResponse.json({
      source: "fallback",
      role,
      reply: buildFallbackReply(role),
      quickReplies: CHATBOT_QUICK_PROMPTS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Chatbot request failed.",
      },
      { status: 500 }
    );
  }
}
