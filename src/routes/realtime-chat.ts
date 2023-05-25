import { server$ } from "@builder.io/qwik-city";

export type ChatMessage = { user: string; message: string };

const newMessages: ChatMessage[] = [];
let messageCache: ChatMessage[] = [];
let lastUpdated = Date.now();
const MAX_CACHE_SIZE = 10;

export const sendMessage = server$(async function (message: string) {
  console.log('incoming', message)
  const userId = this.cookie.get("userId")?.value;
  if (!userId) {
    return  "No user id in cookies" as const;
  } else {
    newMessages.push({ user: userId, message });
    return "Message submitted" as const;
  }
});

export const chatConnection = server$(async function* () {
  let thisInstanceLastUpdated = lastUpdated;
  yield messageCache;
  while (true) {
    if (newMessages.length > 0) {
      const message = newMessages.shift();
      messageCache.push(message!);
      messageCache = messageCache.slice(-MAX_CACHE_SIZE);
      lastUpdated = Date.now();
    }
    if (thisInstanceLastUpdated !== lastUpdated) {
      thisInstanceLastUpdated = lastUpdated;
      yield messageCache;
    }
    await pause(40);
  }
});

export function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
