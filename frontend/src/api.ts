export async function request<T>(path: string, data?: object): Promise<T> {
  const response = await fetch(path, data
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
    : undefined);
  const body: unknown = await response.json();
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
      ? body.error
      : 'The server could not complete the request.';
    throw new Error(message);
  }
  return body as T;
}
