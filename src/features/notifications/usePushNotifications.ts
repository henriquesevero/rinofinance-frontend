import { useCallback, useEffect, useRef, useState } from "react"
import {
  getExistingSubscription,
  sendTestNotification,
  subscribeToPush,
  unsubscribeFromPush,
} from "./notificationService"

export type NotificationStatus = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading"

const isSupported =
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window

export function usePushNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("loading")
  const subscription = useRef<PushSubscription | null>(null)

  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    getExistingSubscription()
      .then((sub) => {
        subscription.current = sub
        setStatus(sub ? "subscribed" : "unsubscribed")
      })
      .catch(() => setStatus("unsubscribed"))
  }, [])

  const subscribe = useCallback(async () => {
    setStatus("loading")
    try {
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          setStatus("denied")
          return
        }
      }
      subscription.current = await subscribeToPush()
      setStatus("subscribed")
    } catch (err) {
      setStatus("unsubscribed")
      throw err
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!subscription.current) return
    setStatus("loading")
    try {
      await unsubscribeFromPush(subscription.current)
      subscription.current = null
      setStatus("unsubscribed")
    } catch {
      setStatus("subscribed")
    }
  }, [])

  return { status, subscribe, unsubscribe, sendTest: sendTestNotification }
}
