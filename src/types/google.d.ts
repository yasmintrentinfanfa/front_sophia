/**
 * Tipagem mínima do script `https://accounts.google.com/gsi/client`.
 * Cobre só o que o botão "Continuar com Google" usa (OAuth2 Token Client).
 */

export {};

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (resposta: GoogleTokenResponse) => void;
    error_callback?: (erro: { type: string; message?: string }) => void;
  }) => GoogleTokenClient;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleOAuth2;
      };
    };
  }
}
