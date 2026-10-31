import { useEffect } from "react";
import { attachIosKeyboardZoomFixListeners } from "./iosViewport";

/**
 * App-wide iOS fix: after the software keyboard closes, undo Safari’s stuck zoom.
 * Pair with globals.css 16px form fields to prevent focus zoom on all pages.
 */
export default function useIosKeyboardZoomFix() {
  useEffect(() => attachIosKeyboardZoomFixListeners(), []);
}
