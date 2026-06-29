import axios, { AxiosRequestConfig } from 'axios';

function proxyFromEnv():
  | { host: string; port: number; protocol: string; auth?: { username: string; password: string } }
  | undefined {
  const raw =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (!raw) return undefined;
  try {
    const u = new URL(raw.trim());
    const port = u.port ? parseInt(u.port, 10) : u.protocol === 'https:' ? 443 : 80;
    const auth =
      u.username || u.password
        ? {
            username: decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
          }
        : undefined;
    return {
      protocol: u.protocol.replace(':', '') || 'http',
      host: u.hostname,
      port,
      ...(auth ? { auth } : {}),
    };
  } catch {
    return undefined;
  }
}

/** 访问 TMDB、Open Library 等境外接口；可选通过 HTTPS_PROXY 走本机 HTTP 代理 */
export function createOutboundClient(config: AxiosRequestConfig = {}) {
  const defaultTimeout = parseInt(process.env.OUTBOUND_TIMEOUT_MS || '12000', 10);
  const merged: AxiosRequestConfig = {
    ...config,
    timeout: config.timeout ?? defaultTimeout,
  };
  const proxy = proxyFromEnv();
  if (proxy) {
    merged.proxy = {
      host: proxy.host,
      port: proxy.port,
      protocol: proxy.protocol,
      ...(proxy.auth ? { auth: proxy.auth } : {}),
    };
  }
  return axios.create(merged);
}
