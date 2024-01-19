import { createServerClient } from "@supabase/ssr";
import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public";

const createSupabaseClient: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      // NOTE: defaulting path to '/' here to support Sveltekit v2 which requires it to be
      // specified.
      set: (key, value, options) => {
        event.cookies.set(key, value, { path: "/", ...options });
      },
      remove: (key, options) => {
        event.cookies.delete(key, { path: "/", ...options });
      }
    }
  });

  /**
   * a little helper that is written for convenience so that instead
   * of calling `const { data: { session } } = await supabase.auth.getSession()`
   * you just call this `await getSession()`
   */
  event.locals.getSession = async () => {
    const {
      data: { session }
    } = await event.locals.supabase.auth.getSession();
    return session;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      // supabase needs the content-range header
      return name === "content-range";
    }
  });
};

export let handle: Handle;

if (PUBLIC_SUPABASE_URL !== "XXX") {
  handle = sequence(createSupabaseClient);
}
