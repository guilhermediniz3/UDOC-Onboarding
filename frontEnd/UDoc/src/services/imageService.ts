const BASE_URL = "http://localhost:8081";

function getToken(): string {
  return localStorage.getItem("udoc-token") ?? "";
}

export function uploadImage(file: File): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const token  = getToken();
    const params = new URLSearchParams({ filename: file.name });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/cards/images/upload?${params.toString()}`);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 60_000;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error("Resposta inválida do servidor")); }
      } else {
        let msg = `Erro ${xhr.status} ao fazer upload da imagem`;
        try { msg = JSON.parse(xhr.responseText)?.error ?? msg; } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror   = () => reject(new Error("Erro de rede ao enviar imagem"));
    xhr.ontimeout = () => reject(new Error("Timeout ao enviar imagem"));

    xhr.send(file);
  });
}
