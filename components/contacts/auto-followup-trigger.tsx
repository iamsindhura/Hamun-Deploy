"use client";

import { useEffect, useRef } from "react";
import { autoGenerateFollowUps } from "@/app/actions/automation";

let globalHasTriggered = false;

export function AutoFollowUpTrigger() {
  useEffect(() => {
    if (!globalHasTriggered) {
      globalHasTriggered = true;
      // Fire and forget
      autoGenerateFollowUps().catch(console.error);
    }
  }, []);

  // Silent component, renders nothing
  return null;
}
