import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

const TIMEOUT_HINT =
  '第三方接口超时（影视使用 TMDB，图书使用 Open Library）。国内网络常无法直连，可在 server/.env 设置 HTTPS_PROXY（例如 Clash: http://127.0.0.1:7890）并重启后端，或为系统开启可访问国际互联网的 VPN。';

export function toUpstreamAppError(err: unknown, fallback: string): AppError {
  if (axios.isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return new AppError(TIMEOUT_HINT, 504);
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return new AppError(`${TIMEOUT_HINT}（${err.code}）`, 502);
    }
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      return new AppError('上游接口拒绝访问，请检查 API Key 或配额。', 502);
    }
  }
  return new AppError(fallback, 502);
}
