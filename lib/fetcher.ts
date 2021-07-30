export async function fetcher<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type');
    if (!contentType || contentType.indexOf('application/json') === -1) {
      throw await response.text();
    }

    const error = await response.json();
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    throw error;
  }

  const contentType = response.headers.get('Content-Type');
  if (!contentType || contentType.indexOf('application/json') === -1) {
    return (await response.text()) as never;
  }

  return await response.json();
}
