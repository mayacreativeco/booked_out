import { kv } from '@vercel/kv';

export type Client = {
  name: string;
  createdAt: string;
  data: Record<string, unknown>;
};

export async function getClientByToken(token: string): Promise<Client | null> {
  return kv.get<Client>(`client:${token}`);
}

export async function createClient(
  name: string,
  data: Client['data'],
): Promise<{ token: string; url: string }> {
  const token = crypto.randomUUID();
  const client: Client = {
    name,
    createdAt: new Date().toISOString(),
    data,
  };
  await kv.set(`client:${token}`, client);
  const url = `https://booked-out.mayacreativeco.com/dashboard/${token}`;
  return { token, url };
}
