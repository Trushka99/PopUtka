import { describe, it, expect } from "vitest";
import { isIosDevice } from "../composables/usePwaInstall";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_MODE =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

describe("isIosDevice", () => {
  it("узнаёт iPhone", () => {
    expect(isIosDevice(IPHONE, "iPhone", 5)).toBe(true);
  });

  it("узнаёт iPad, который притворяется маком", () => {
    expect(isIosDevice(IPAD_DESKTOP_MODE, "MacIntel", 5)).toBe(true);
  });

  it("не путает обычный Mac с iPad", () => {
    expect(isIosDevice(IPAD_DESKTOP_MODE, "MacIntel", 0)).toBe(false);
  });

  it("Android — не iOS", () => {
    expect(isIosDevice(ANDROID, "Linux armv8l", 5)).toBe(false);
  });
});
