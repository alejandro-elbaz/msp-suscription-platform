import type { Env } from './core-utils';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface GraphPagedResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

type MicrosoftGraphEnv = Env & {
  M365_CLIENT_ID: string;
  M365_CLIENT_SECRET: string;
  M365_TENANT_ID: string;
};

interface TokenCache {
  token: string;
  expiresAt: number;
}

const tokenCache: { value: TokenCache | null } = { value: null };

function assertEnv(env: Env): asserts env is MicrosoftGraphEnv {
  const requiredKeys: (keyof MicrosoftGraphEnv)[] = [
    'M365_CLIENT_ID',
    'M365_CLIENT_SECRET',
    'M365_TENANT_ID',
  ];
  for (const key of requiredKeys) {
    if (!(key in env) || typeof env[key] !== 'string' || !(env[key] as string).length) {
      throw new Error(`Missing required Microsoft 365 configuration value: ${key}. Set it via wrangler secrets before running the sync.`);
    }
  }
}

export async function getMicrosoftGraphToken(env: Env): Promise<string> {
  assertEnv(env);
  const cached = tokenCache.value;
  const bufferMs = 60_000; // refresh 1 minute before expiry
  if (cached && cached.expiresAt - bufferMs > Date.now()) {
    return cached.token;
  }

  const body = new URLSearchParams({
    client_id: env.M365_CLIENT_ID,
    client_secret: env.M365_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const tokenUrl = `https://login.microsoftonline.com/${env.M365_TENANT_ID}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to obtain Microsoft Graph token: ${response.status} ${response.statusText} - ${text}`);
  }

  const data = (await response.json()) as TokenResponse;
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  tokenCache.value = {
    token: data.access_token,
    expiresAt,
  };
  return data.access_token;
}

export async function graphFetch<T>(env: Env, path: string, init: RequestInit = {}): Promise<T> {
  const token = await getMicrosoftGraphToken(env);
  const url = path.startsWith('http') ? path : `https://graph.microsoft.com/v1.0${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Microsoft Graph request failed (${response.status} ${response.statusText}) - ${text}`);
  }

  return (await response.json()) as T;
}

export async function graphFetchAll<T>(env: Env, initialPath: string): Promise<T[]> {
  let url: string | undefined | null = initialPath;
  const results: T[] = [];
  while (url) {
    const response = await graphFetch<GraphPagedResponse<T>>(env, url);
    if (response.value?.length) {
      results.push(...response.value);
    }
    url = response['@odata.nextLink'] ?? null;
  }
  return results;
}

