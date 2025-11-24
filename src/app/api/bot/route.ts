// src/app/api/bot/route.ts
import { Bot, webhookCallback } from "grammy";

export const POST = async (req: Request) => {
    // 1. Read token inside the request, not at the top level
    const token = process.env.BOT_TOKEN;

    if (!token) {
        console.error("BOT_TOKEN is not set");
        return new Response("Configuration Error: BOT_TOKEN missing", { status: 500 });
    }

    // 2. Initialize Bot
    const bot = new Bot(token);

    // 3. Define your commands here
    bot.command("start", (ctx) => ctx.reply("Welcome to RealCheck!"));
    
    // 4. Create the handler for this specific request
    // "std/http" is the adapter for standard Request/Response objects
    return webhookCallback(bot, "std/http")(req);
};
