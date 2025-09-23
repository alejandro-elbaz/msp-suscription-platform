import { ApiResponse } from "@shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    // Handle non-successful responses (e.g., 500, 404)
    const errorText = await res.text();
    // Try to parse as JSON error, but fall back to text
    try {
      const json = JSON.parse(errorText) as ApiResponse<never>;
      if (json.success === false && json.error) {
        throw new Error(json.error);
      }
    } catch (e) {
      // Not a JSON error, throw the raw text
      throw new Error(`Request failed with status ${res.status}: ${errorText || res.statusText}`);
    }
    // Fallback for unexpected shapes
    throw new Error(`Request failed with status ${res.status}: ${res.statusText}`);
  }
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const json = (await res.json()) as ApiResponse<T>;
    if (json.success) {
      if (json.data === undefined) {
        // This can be valid for DELETE requests that return success:true with no data
        return {} as T;
      }
      return json.data;
    } else if (json.success === false) {
      throw new Error(json.error || 'Request failed');
    } else {
      throw new Error('Received an unexpected API response format');
    }
  }
  // Handle cases where the response is not JSON but still successful (e.g., 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }
  // If we expect JSON but get something else, it's an error.
  const responseText = await res.text();
  throw new Error(`Expected JSON response, but received ${contentType}. Response body: ${responseText}`);
}