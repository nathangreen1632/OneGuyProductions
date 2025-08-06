export async function fetchOrders(): Promise<any[]> {
  try {
    const res = await fetch('/api/order', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('❌ Server returned error:', data.error || res.statusText);
      return [];
    }

    if (!Array.isArray(data)) {
      console.error('❌ Unexpected response format:', data);
      return [];
    }

    return data;
  } catch (err) {
    console.error('❌ Fetch error:', err);
    return [];
  }
}
