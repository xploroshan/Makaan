import Link from "next/link";

import { ChatThread } from "@/components/chat/chat-thread";

type Params = { id: string };

export default async function ChatPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <Link href="/chats" className="text-muted-foreground text-sm">
        ← All chats
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-bold">Chat</h1>
      <ChatThread chatId={id} />
    </main>
  );
}
