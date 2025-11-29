import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '../prisma';

export async function getSessionUser() {
  const cookieStore = await cookies();
  const initData = cookieStore.get('tg_init_data')?.value || defaultDevUser;

  console.log('✅✅✅✅', initData);

  if (!initData) return null;

  // 1. Parse the initData string into an object
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  const userStr = urlParams.get('user');

  if (!hash || !userStr) return null;

  // 2. VERIFY SIGNATURE (Crucial Step)
  // In production, you MUST verify the hash matches your BOT_TOKEN
  // If you skip this, anyone can hack your app.

  /* UNCOMMENT THIS IN PRODUCTION
  const dataCheckString = Array.from(urlParams.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN!)
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    console.error("Invalid Telegram Signature");
    return null;
  }
  */

  // 3. Return User from Database
  const telegramUser = JSON.parse(userStr);

  // Find existing user or create new one (Upsert)
  // Note: In a real high-traffic app, maybe don't upsert on every single read.
  const dbUser = await prisma.user.upsert({
    where: { telegramId: telegramUser.id.toString() },
    update: { username: telegramUser.username },
    create: {
      telegramId: telegramUser.id.toString(),
      username: telegramUser.username,
      balance: 0,
    },
  });

  return dbUser;
}


const defaultDevUser = `user={"id":5490614113,"first_name":"Mehrdad","last_name":"N","username":"Mnourib13","language_code":"en","allows_write_to_pm":true,"photo_url":"https:\/\/t.me\/i\/userpic\/320\/4nPtd7W3fKkolTSWspsd7j910RNEfQUx2y6V943UsW0bTfZEHiFsm3ZP_seyi4QJ.svg"}&chat_instance=8657732856900867016&chat_type=private&auth_date=1764431880&signature=NTj4D9ftX-AOs4TgoE0iVG1eahsrl983XShrp6VAYqWSKPobL4dDpsEzwpO51duFZOPvqeBObVDsuEoCVDJ1BQ&hash=7d7e2f7694ee108de15b3ceeff28d212ade0d64a041e9e3db81b531a9d5a6ec2`