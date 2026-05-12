export async function getJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} for ${url}: ${body}`);
  }

  return response.json();
}
