import webpush from "web-push";

const VAPID_MAILTO = process.env.VAPID_MAILTO ?? "";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

export const WEB_PUSH_ENABLED =
  VAPID_MAILTO.length > 0 &&
  VAPID_PUBLIC_KEY.length > 0 &&
  VAPID_PRIVATE_KEY.length > 0;

if (WEB_PUSH_ENABLED) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface WebPushInput {
  subscription: webpush.PushSubscription;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendWebPush(opts: WebPushInput): Promise<void> {
  if (!WEB_PUSH_ENABLED) {
    console.log(`[web-push] disabled; would send "${opts.title}"`);
    return;
  }
  await webpush.sendNotification(
    opts.subscription,
    JSON.stringify({
      title: opts.title,
      body: opts.body,
      data: opts.data ?? {},
    }),
  );
}