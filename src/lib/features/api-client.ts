export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}

/**
 * Parses a JSON API response following CreativeSpace's standard envelope
 * ({ success, data, error }) and throws a descriptive Error on failure.
 */
export async function parseApiResponse<T>(
  response: Response,
  fallbackErrorMessage = "Request failed"
): Promise<T> {
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw new Error(`${fallbackErrorMessage} (HTTP ${response.status})`);
    }
    throw new Error("Invalid JSON response from server");
  }

  if (!response.ok || !payload?.success || payload.data === null) {
    throw new Error(
      payload?.error?.message || `${fallbackErrorMessage} (HTTP ${response.status})`
    );
  }

  return payload.data;
}
