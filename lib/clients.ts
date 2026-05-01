import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export type Client = {
  name: string;
  createdAt: string;
  data: Record<string, unknown>;
};

export async function getClientByToken(token: string): Promise<Client | null> {
  return redis.get<Client>(`client:${token}`);
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
  await redis.set(`client:${token}`, client);
  const url = `https://booked-out.mayacreativeco.com/dashboard/${token}`;
  return { token, url };
}
