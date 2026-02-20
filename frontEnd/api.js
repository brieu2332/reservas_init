const API_URL = "http://localhost:5000";

// Genérico: tratamento da resposta
async function handleResponse(response) {
  const data = await response.json().catch(() => null);
  return {
    status: response.status,
    data: data,
    ok: response.ok,
    statusText: response.statusText
  };
}

// AUTENTICAÇÃO
export async function register(userData) {
  try {
    const response = await fetch(`${API_URL}/cadastro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(userData)
    });
    return await handleResponse(response);
  } catch (error) {
    return { ok: false, error: "Erro de conexão com o servidor" };
  }
}

export async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await handleResponse(response);
  } catch (error) {
    return { ok: false, error: "Erro de conexão com o servidor" };
  }
}

// RESERVA
export async function bookRoom(bookingData) {
  try {
    const response = await fetch(`${API_URL}/api/reservas/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });

    return await handleResponse(response);
  } catch (error) {
    return { ok: false, error: error.message || "Erro na reserva" };
  }
}