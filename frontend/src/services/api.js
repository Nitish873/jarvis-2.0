const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const sendCommand = async (command) => {
  const response = await fetch(`${API_URL}/jarvis/command`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.response || data.message || "Failed to communicate with Jarvis.");
  return data;
};
