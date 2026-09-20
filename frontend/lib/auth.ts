import { setAccessTokenProvider } from "./api";
import { supabase } from "./supabase";

export function initializeAuthTokenProvider(): void {
  setAccessTokenProvider(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  });
}