// HeyMax Shop Bot - Telegram Edge Function
// TDD Implementation: Supabase Edge Function with TypeScript/Deno

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types for Telegram API
interface TelegramUpdate {
  update_id: number;
  inline_query?: TelegramInlineQuery;
  message?: TelegramMessage;
}

interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: string;
  title?: string;
}

interface TelegramInlineQueryResult {
  type: "article";
  id: string;
  title: string;
  input_message_content: {
    message_text: string;
    parse_mode: "Markdown";
  };
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      url: string;
    }>>;
  };
  description?: string;
  thumbnail_url?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response("ok", { 
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE"
        }
      });
    }

    // Parse Telegram webhook update
    const update: TelegramUpdate = await req.json();
    
    // Handle inline queries (core bot functionality)
    if (update.inline_query) {
      await handleInlineQuery(update.inline_query);
      return new Response("OK", { status: 200 });
    }

    // Handle regular messages (for debugging/monitoring)
    if (update.message) {
      console.log("Received message:", update.message.text);
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Error processing update:", error);
    return new Response("Error", { status: 500 });
  }
});

// Handle inline queries: @HeyMax_shop_bot [merchant]
async function handleInlineQuery(query: TelegramInlineQuery) {
  const userId = query.from.id;
  const username = query.from.username || `user_${userId}`;
  const searchTerm = query.query.toLowerCase().trim();

  try {
    // Upsert user in database
    await upsertUser(userId, username);

    // Search merchants based on query
    const merchants = await searchMerchants(searchTerm);

    // Generate inline query results
    const results: TelegramInlineQueryResult[] = merchants.map((merchant, index) => {
      const personalizedLink = merchant.tracking_link.replace('{{USER_ID}}', userId.toString());
      
      return {
        type: "article",
        id: `${merchant.merchant_slug}_${index}`,
        title: `🛍️ Shop ${merchant.merchant_name}`,
        description: `Earn up to ${merchant.base_mpd} Max Miles per $1 spent`,
        input_message_content: {
          message_text: `🛍️ **${merchant.merchant_name}** - Earn up to **${merchant.base_mpd} Max Miles per $1** spent\n\n` +
                       `*Exclusive link for @${username}* 👆`,
          parse_mode: "Markdown"
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `🛍️ Shop ${merchant.merchant_name} & Earn Miles (for @${username})`,
                url: personalizedLink
              }
            ],
            [
              {
                text: "⚡ Get MY Unique Link",
                url: `https://t.me/HeyMax_shop_bot?start=${merchant.merchant_slug}`
              }
            ]
          ]
        },
        thumbnail_url: "https://storage.googleapis.com/max-sg/assets/heymax_logo_square.png"
      };
    });

    // Send results back to Telegram
    await sendInlineQueryAnswer(query.id, results);

    // Track link generation for viral analytics
    if (merchants.length > 0 && searchTerm) {
      await trackLinkGeneration(userId, merchants[0].merchant_slug, query);
    }

  } catch (error) {
    console.error("Error handling inline query:", error);
    
    // Send error result to user
    const errorResult: TelegramInlineQueryResult = {
      type: "article",
      id: "error",
      title: "⚠️ Search Error",
      description: "Try searching for a merchant name (e.g., 'shopee', 'grab', 'klook')",
      input_message_content: {
        message_text: "⚠️ Something went wrong. Please try searching again with a merchant name like 'shopee' or 'grab'.",
        parse_mode: "Markdown"
      }
    };
    
    await sendInlineQueryAnswer(query.id, [errorResult]);
  }
}

// Database Operations

async function upsertUser(userId: number, username: string) {
  const { error } = await supabase
    .from('users')
    .upsert(
      { id: userId, username: username, first_seen: new Date().toISOString() },
      { onConflict: 'id' }
    );
  
  if (error) {
    console.error("Error upserting user:", error);
    throw error;
  }
}

async function searchMerchants(searchTerm: string) {
  if (!searchTerm) {
    // Return top merchants if no search term
    const { data, error } = await supabase
      .from('merchants')
      .select('merchant_slug, merchant_name, tracking_link, base_mpd')
      .order('base_mpd', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    return data || [];
  }

  // Search by merchant name
  const { data, error } = await supabase
    .from('merchants')
    .select('merchant_slug, merchant_name, tracking_link, base_mpd')
    .ilike('merchant_name', `%${searchTerm}%`)
    .order('base_mpd', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data || [];
}

async function trackLinkGeneration(userId: number, merchantSlug: string, query: TelegramInlineQuery) {
  const { error } = await supabase
    .from('link_generations')
    .insert({
      user_id: userId,
      merchant_slug: merchantSlug,
      generated_at: new Date().toISOString(),
      chat_id: null, // Will be updated when user actually shares the link
      chat_type: query.chat_type || 'unknown',
      unique_link: `telegram_${userId}_${merchantSlug}_${Date.now()}`
    });
  
  if (error) {
    console.error("Error tracking link generation:", error);
  }
}

// Telegram API Operations

async function sendInlineQueryAnswer(queryId: string, results: TelegramInlineQueryResult[]) {
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerInlineQuery`;
  
  const response = await fetch(telegramApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inline_query_id: queryId,
      results: results,
      cache_time: 300, // Cache results for 5 minutes
      is_personal: true, // Results are personalized per user
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Telegram API error:", error);
    throw new Error(`Telegram API error: ${response.status}`);
  }
}