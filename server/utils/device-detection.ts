import { Request } from 'express';

export interface DeviceInfo {
  deviceInfo: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  country?: string;
  city?: string;
  timezone?: string;
  screenResolution?: string;
}

export function parseUserAgent(userAgent: string): { browser: string; os: string; deviceType: string } {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
  }

  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macos')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  }

  // Device type detection
  let deviceType = 'desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  return { browser, os, deviceType };
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const realIP = req.headers['x-real-ip'] as string;
  const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1';
}

export async function getLocationFromIP(ip: string): Promise<{ country?: string; city?: string; timezone?: string }> {
  // Skip for localhost/private IPs
  if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: 'Local', city: 'Localhost', timezone: 'UTC' };
  }

  try {
    // You can integrate with services like ipapi.co, ipgeolocation.io, or ip-api.com
    // For now, we'll return basic info to avoid external dependencies
    return { country: 'Unknown', city: 'Unknown', timezone: 'UTC' };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return { country: 'Unknown', city: 'Unknown', timezone: 'UTC' };
  }
}

export function extractDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || '';
  const { browser, os, deviceType } = parseUserAgent(userAgent);
  const ipAddress = getClientIP(req);
  
  return {
    deviceInfo: userAgent,
    deviceType,
    browser,
    os,
    ipAddress,
  };
}