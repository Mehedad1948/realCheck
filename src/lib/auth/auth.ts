import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.JWT_SECRET || "your-super-secret-key-change-this";
const key = new TextEncoder().encode(SECRET_KEY);

export const SESSION_DURATION = 60 * 60 * 24; // 24 hours

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(plain: string, hashed: string) {
    
  return await bcrypt.compare(plain, hashed);
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function login(formData: FormData) {
    // This will be used in our Server Action
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}
