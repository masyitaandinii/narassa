export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(path, {
    method: opts.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan, coba lagi.");
  return data as T;
}

export function toast(message: unknown, type: "success" | "error" | "warning" = "success") {
  let msg = "Terjadi kesalahan.";
  if (typeof message === "string") {
    msg = message;
  } else if (message instanceof Error) {
    msg = message.message;
  } else if (message && typeof message === "object") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msg = (message as any).message || (message as any).error || "Terjadi kesalahan pada aksi.";
    if (msg.startsWith("[object")) {
      msg = "Terjadi kesalahan pada aksi.";
    }
  }
  window.dispatchEvent(new CustomEvent("narassa:toast", { detail: { message: msg, type } }));
}
