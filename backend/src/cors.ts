function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, "");
}

function patternToRegExp(pattern: string) {
  const normalized = normalizeOrigin(pattern);
  const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

export function parseClientOrigins() {
  const configured = process.env.CLIENT_ORIGINS?.split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  if (configured?.length) return configured;
  return ["http://localhost:5173"];
}

export function createOriginMatcher(allowedOrigins: string[]) {
  const exactOrigins = new Set(allowedOrigins.filter((origin) => !origin.includes("*")));
  const wildcardPatterns = allowedOrigins.filter((origin) => origin.includes("*")).map(patternToRegExp);

  return function isOriginAllowed(origin: string | undefined) {
    if (!origin) return true;

    const normalized = normalizeOrigin(origin);
    if (exactOrigins.has(normalized)) return true;

    return wildcardPatterns.some((pattern) => pattern.test(normalized));
  };
}

export function createCorsOriginHandler(
  isOriginAllowed: (origin: string | undefined) => boolean,
  allowedOrigins: string[],
) {
  return (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    console.warn(
      `Blocked CORS origin: ${origin ?? "(missing)"}. Allowed origins: ${allowedOrigins.join(", ")}`,
    );
    callback(null, false);
  };
}
