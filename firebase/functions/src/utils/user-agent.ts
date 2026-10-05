/**
 * =============================================================================
 * PARSER USER-AGENT
 * =============================================================================
 *
 * Utilitaire pour extraire les informations du User-Agent (navigateur, OS, device)
 * Utilisé pour l'historique de connexion et les logs d'audit
 * =============================================================================
 */

export interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
}

/**
 * Parse le User-Agent string et extrait les informations du device
 * @param {string} userAgent - Le header User-Agent de la requête
 * @return {DeviceInfo} Les informations extraites du device
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Détecter le device
  let device = "Desktop";
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) {
    device = "Mobile";
  } else if (/tablet|ipad/.test(ua)) {
    device = "Tablet";
  }

  // Détecter le browser
  let browser = "Unknown";
  if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("edg")) {
    browser = "Edge";
  } else if (ua.includes("chrome")) {
    browser = "Chrome";
  } else if (ua.includes("safari")) {
    browser = "Safari";
  } else if (ua.includes("opera") || ua.includes("opr")) {
    browser = "Opera";
  }

  // Détecter l'OS
  let os = "Unknown";
  if (ua.includes("windows nt 10")) {
    os = "Windows 10";
  } else if (ua.includes("windows nt 11")) {
    os = "Windows 11";
  } else if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("mac os x")) {
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace("_", ".")}` : "macOS";
  } else if (ua.includes("android")) {
    const match = ua.match(/android (\d+\.?\d*)/);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    const match = ua.match(/os (\d+[._]\d+)/);
    os = match ? `iOS ${match[1].replace("_", ".")}` : "iOS";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  return {
    device,
    browser,
    os,
  };
}

/**
 * Extraire l'adresse IP depuis les headers de la requête
 * @param {Record<string, string | string[]>} headers - Les headers HTTP
 * @return {string} L'adresse IP extraite
 */
export function extractIpAddress(headers: Record<string, string | string[] | undefined>): string {
  // Essayer différentes sources d'IP (proxy, load balancer, etc.)
  const forwardedFor = headers["x-forwarded-for"];
  if (forwardedFor) {
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ip.split(",")[0].trim();
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  return "Unknown";
}
