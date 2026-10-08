function hostFromValue(value: string | undefined | null) {
  if (!value) return null;
  try {
    const normalized = value.includes("://") ? value : `https://${value}`;
    return new URL(normalized).host.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(request: Request) {
  const hosts = new Set<string>();
  const requestUrl = new URL(request.url);
  const candidates = [
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
    request.headers.get("host"),
    requestUrl.host,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    process.env.SITE_URL,
  ];
  for (const candidate of candidates) {
    const host = hostFromValue(candidate);
    if (host) hosts.add(host);
  }
  return hosts;
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    const fetchSite = request.headers.get("sec-fetch-site");
    return fetchSite === "same-origin" || fetchSite === "none";
  }

  try {
    return allowedHosts(request).has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}
