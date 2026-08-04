import { apiClient } from "@/lib/api-client"

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(normalized)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

async function getVapidPublicKey(): Promise<string> {
  const { publicKey } = await apiClient.get<{ publicKey: string }>("/api/notifications/vapid-public-key")
  return publicKey
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    throw new Error("Abra o app instalado no iPhone (Tela de Início) para ativar os lembretes.")
  }
  const publicKey = await getVapidPublicKey()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })

  const json = subscription.toJSON()
  await apiClient.post("/api/notifications/subscribe", {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  })
  return subscription
}

export async function unsubscribeFromPush(subscription: PushSubscription): Promise<void> {
  await apiClient.delete("/api/notifications/subscribe", { endpoint: subscription.endpoint })
  await subscription.unsubscribe()
}

export async function sendTestNotification(): Promise<void> {
  await apiClient.post("/api/notifications/test")
}
