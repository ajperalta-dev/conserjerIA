import { serverClient } from "./server";
export async function verifiedSubject(): Promise<string | null> {
  try {
    const client = await serverClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
