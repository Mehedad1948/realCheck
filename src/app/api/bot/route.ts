// src/app/api/bot/route.ts
import { Bot, webhookCallback, InlineKeyboard } from "grammy";

export const POST = async (req: Request) => {
    const token = process.env.BOT_TOKEN;
    if (!token) return new Response("BOT_TOKEN missing", { status: 500 });

    const bot = new Bot(token);

    // --- COMMANDS ---

    bot.command("start", async (ctx) => {
        // 1. Define the Web App URL
        // IMPORTANT: Must be HTTPS. 'localhost' won't work with Telegram directly.
        // Use your Vercel URL or a tunneling service (like ngrok) for local dev.
        const webAppUrl = "https://real-check.vercel.app/app"; 

        // 2. Create the keyboard button
        const keyboard = new InlineKeyboard()
            .webApp("🚀 Start Earning (RealCheck)", webAppUrl);

        // 3. Send the message with the button
        await ctx.reply("Welcome to RealCheck! \n\nComplete tasks to verify data and earn TON.", {
            reply_markup: keyboard,
        });
    });

    return webhookCallback(bot, "std/http")(req);
};
