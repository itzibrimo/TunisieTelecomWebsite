/** Détecte le navigateur et l'OS à partir du user agent */
export function detectDevice(userAgent?: string): { browser: string; os: string } {
  const ua = userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "Unknown");

  let browser = "Inconnu";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "Inconnu";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
}

export function getDeviceIcon(os: string): string {
  switch (os) {
    case "Windows": return "💻";
    case "macOS": return "🍎";
    case "Linux": return "🐧";
    case "Android": return "📱";
    case "iOS": return "📱";
    default: return "🖥️";
  }
}
