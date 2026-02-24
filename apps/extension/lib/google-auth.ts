import { supabase } from "./supabase";

const GOOGLE_CLIENT_ID =
  "555640882274-be7oj8m49l5fid20dv38a9v9kq43s6bk.apps.googleusercontent.com";

/**
 * Sign in with Google using chrome.identity.launchWebAuthFlow().
 * Must be called from the background service worker.
 */
export async function signInWithGoogle() {
  const redirectUrl = chrome.identity.getRedirectURL();
  const nonce = crypto.randomUUID();

  // Hash the nonce with SHA-256 before sending to Google.
  // Supabase expects the raw nonce and hashes it internally to compare with the token claim.
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(nonce));
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Build Google OAuth URL requesting id_token via implicit flow
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("response_type", "id_token token");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("nonce", hashedNonce); // Send hashed nonce to Google
  authUrl.searchParams.set("prompt", "select_account");

  // Open Google consent popup
  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) {
    return { data: null, error: { message: "Login cancelado" } };
  }

  // Extract id_token from hash fragment
  const hash = responseUrl.split("#")[1];
  if (!hash) {
    return { data: null, error: { message: "Resposta inválida do Google" } };
  }

  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");

  if (!idToken) {
    return { data: null, error: { message: "Token não recebido do Google" } };
  }

  // Authenticate with Supabase using the Google id_token
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce,
  });

  return { data, error };
}
