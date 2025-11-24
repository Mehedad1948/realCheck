
import { Bot, webhookCallback } from "grammy";

const token = process.env.BOT_TOKEN;
const bot = new Bot(token!);

bot.command("start", (ctx) => ctx.reply("Welcome to RealCheck!"));
export const POST = webhookCallback(bot, "std/http");
