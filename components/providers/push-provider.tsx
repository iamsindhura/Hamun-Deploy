"use client";

import { useEffect } from "react";
import { saveSubscription } from "@/app/actions/push";

function urlBase64ToUint8Array(base64String: string) {
 const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
 const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

 const rawData = window.atob(base64);
 const outputArray = new Uint8Array(rawData.length);

 for (let i = 0; i < rawData.length; ++i) {
 outputArray[i] = rawData.charCodeAt(i);
 }
 return outputArray;
}

export function PushProvider({ children }: { children: React.ReactNode }) {
 useEffect(() => {
 const registerPush = async () => {
 if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
 return;
 }

 try {
 const registration = await navigator.serviceWorker.ready;
 
 // Check for existing subscription
 let subscription = await registration.pushManager.getSubscription();

 if (!subscription) {
 const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
 if (!publicVapidKey) {
 console.warn("VAPID Public Key missing");
 return;
 }

 subscription = await registration.pushManager.subscribe({
 userVisibleOnly: true,
 applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
 });
 }

 // Save to server
 const subJSON = subscription.toJSON();
 await saveSubscription(subJSON);
 
 } catch (error) {
 console.error("Failed to register for push notifications:", error);
 }
 };

 registerPush();
 }, []);

 return <>{children}</>;
}
