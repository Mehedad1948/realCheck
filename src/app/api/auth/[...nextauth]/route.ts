// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth" // Import from the file we just created
export const { GET, POST } = handlers
