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
    // Upsert user in database with enhanced tracking
    await upsertUser(userId, username);

    // Handle empty query - show popular merchants
    if (!searchTerm) {
      const results = await generatePopularMerchantResults(userId, username);
      await sendInlineQueryAnswer(query.id, results);
      return;
    }

    // Enhanced merchant search with fuzzy matching
    const merchants = await searchMerchantsEnhanced(searchTerm);

    if (merchants.length === 0) {
      const noResultsResult: TelegramInlineQueryResult = {
        type: "article",
        id: "no_results",
        title: `❌ No merchants found for "${searchTerm}"`,
        description: "Try popular brands: shopee, grab, klook, lazada, foodpanda",
        input_message_content: {
          message_text: `🔍 No merchants found for "${searchTerm}"

` +
                       `💡 Try popular merchants: shopee, grab, klook, lazada, foodpanda

` +
                       `Type @HeyMax_shop_bot followed by a merchant name to discover earning opportunities!`,
          parse_mode: "Markdown"
        }
      };
      
      await sendInlineQueryAnswer(query.id, [noResultsResult]);
      return;
    }

    // Generate enhanced inline query results with viral mechanics
    const results: TelegramInlineQueryResult[] = await Promise.all(
      merchants.slice(0, 8).map(async (merchant, index) => {
        const affiliateData = await generateAffiliateLink(userId, merchant.merchant_slug);
        
        return {
          type: "article",
          id: `${merchant.merchant_slug}_${index}`,
          title: `🛍️ ${merchant.merchant_name}`,
          description: `Earn ${merchant.base_mpd} Max Miles per $1 • ${Math.round(merchant.match_score * 100)}% match`,
          input_message_content: {
            message_text: await generateEnhancedBotResponse(userId, username, merchant, affiliateData),
            parse_mode: "Markdown"
          },
          reply_markup: await generateViralKeyboard(userId, username, merchant, affiliateData.affiliate_link),
          thumbnail_url: merchant.logo_url || "https://storage.googleapis.com/max-sg/assets/heymax_logo_square.png"
        };
      })
    );

    // Send results back to Telegram
    await sendInlineQueryAnswer(query.id, results);

    // Enhanced analytics tracking
    await trackEnhancedLinkGeneration(userId, merchants, searchTerm, query);

  } catch (error) {
    console.error("Error handling inline query:", error);
    
    // Enhanced error handling with helpful suggestions
    const errorResult: TelegramInlineQueryResult = {
      type: "article",
      id: "error",
      title: "⚠️ Temporary Service Issue",
      description: "Please try again in a moment",
      input_message_content: {
        message_text: `⚠️ We're experiencing a temporary issue

` +
                     `Please try again in a moment, or search for popular merchants like:
` +
                     `• shopee • grab • klook • lazada • foodpanda

` +
                     `🔧 If the issue persists, our team has been notified.`,
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

// Enhanced Sprint 2 Functions for Core Bot Functionality

// Enhanced merchant search with fuzzy matching and scoring
async function searchMerchantsEnhanced(searchTerm: string) {
  const { data, error } = await supabase
    .from('merchants')
    .select('merchant_slug, merchant_name, tracking_link, base_mpd')
    .or(`merchant_name.ilike.%${searchTerm}%,merchant_slug.ilike.%${searchTerm}%`)
    .order('base_mpd', { ascending: false })
    .limit(15);
  
  if (error) throw error;
  
  // Add fuzzy match scoring
  const merchants = (data || []).map(merchant => ({
    ...merchant,
    match_score: calculateMatchScore(merchant.merchant_name, searchTerm)
  }));
  
  // Sort by match score, then by MPD value
  return merchants.sort((a, b) => {
    if (Math.abs(a.match_score - b.match_score) < 0.1) {
      return b.base_mpd - a.base_mpd; // Higher MPD first if similar match
    }
    return b.match_score - a.match_score; // Higher match score first
  });
}

// Calculate fuzzy match score for merchant search
function calculateMatchScore(merchantName: string, searchTerm: string): number {
  const name = merchantName.toLowerCase();
  const term = searchTerm.toLowerCase();
  
  // Exact match
  if (name === term) return 1.0;
  
  // Starts with search term
  if (name.startsWith(term)) return 0.9;
  
  // Contains search term
  if (name.includes(term)) return 0.8;
  
  // Word boundary match - split on spaces, hyphens, underscores
  const words = name.split(/[ \-_]+/);
  for (const word of words) {
    if (word.startsWith(term)) return 0.7;
    if (word.includes(term)) return 0.6;
  }
  
  // Basic similarity for fuzzy matching
  const commonChars = countCommonChars(name, term);
  const similarity = commonChars / Math.max(name.length, term.length);
  
  return similarity > 0.5 ? similarity * 0.5 : 0;
}

// Count common characters between two strings
function countCommonChars(str1: string, str2: string): number {
  const chars1 = str1.split('').sort();
  const chars2 = str2.split('').sort();
  let i = 0, j = 0, common = 0;
  
  while (i < chars1.length && j < chars2.length) {
    if (chars1[i] === chars2[j]) {
      common++;
      i++;
      j++;
    } else if (chars1[i] < chars2[j]) {
      i++;
    } else {
      j++;
    }
  }
  
  return common;
}

// Generate popular merchant results for empty queries
async function generatePopularMerchantResults(userId: number, username: string): Promise<TelegramInlineQueryResult[]> {
  const { data: popularMerchants, error } = await supabase
    .from('merchants')
    .select('merchant_slug, merchant_name, tracking_link, base_mpd')
    .order('base_mpd', { ascending: false })
    .limit(6);
  
  if (error) throw error;
  
  if (!popularMerchants || popularMerchants.length === 0) {
    return [{
      type: "article",
      id: "help",
      title: "🔍 Search for merchants to earn Max Miles",
      description: "Type a merchant name after @HeyMax_shop_bot",
      input_message_content: {
        message_text: `🎯 Welcome to HeyMax Shop Bot!

` +
                     `💡 **How to earn Max Miles:**
` +
                     `Type @HeyMax_shop_bot followed by a merchant name

` +
                     `🛍️ **Popular merchants:** shopee, grab, klook, lazada, foodpanda

` +
                     `⚡ Generate personalized earning links instantly!`,
        parse_mode: "Markdown"
      }
    }];
  }
  
  return await Promise.all(popularMerchants.map(async (merchant, index) => {
    const affiliateData = await generateAffiliateLink(userId, merchant.merchant_slug);
    
    return {
      type: "article",
      id: `popular_${merchant.merchant_slug}_${index}`,
      title: `⭐ ${merchant.merchant_name}`,
      description: `Top earner: ${merchant.base_mpd} Max Miles per $1 spent`,
      input_message_content: {
        message_text: await generateEnhancedBotResponse(userId, username, merchant, affiliateData),
        parse_mode: "Markdown"
      },
      reply_markup: await generateViralKeyboard(userId, username, merchant, affiliateData.affiliate_link),
      thumbnail_url: "https://storage.googleapis.com/max-sg/assets/heymax_logo_square.png"
    };
  }));
}

// Enhanced affiliate link generation with UTM tracking
async function generateAffiliateLink(userId: number, merchantSlug: string) {
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('merchant_slug', merchantSlug)
    .single();

  if (error || !merchant) {
    throw new Error(`Merchant ${merchantSlug} not found`);
  }

  // Replace placeholder with actual user ID
  let affiliateLink = merchant.tracking_link.replace('{{USER_ID}}', userId.toString());
  
  // Add comprehensive UTM parameters for tracking
  const utmParams = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'heymax_shop_bot',
    utm_campaign: 'viral_social_commerce',
    utm_content: merchantSlug,
    utm_term: `user_${userId}`,
    heymax_ref: `telegram_${userId}`,
    timestamp: Date.now().toString()
  });
  
  // Add UTM parameters to the link
  const separator = affiliateLink.includes('?') ? '&' : '?';
  const finalLink = `${affiliateLink}${separator}${utmParams.toString()}`;

  // Generate unique tracking ID for this specific link generation
  const trackingId = `tg_${userId}_${merchantSlug}_${Date.now()}`;

  return {
    affiliate_link: finalLink,
    tracking_id: trackingId,
    merchant: merchant
  };
}

// Enhanced bot response with engaging UX and viral mechanics
async function generateEnhancedBotResponse(userId: number, username: string, merchant: any, affiliateData: any): Promise<string> {
  const displayName = username ? `@${username}` : `User ${userId}`;
  const earnRate = merchant.base_mpd;
  
  // Calculate potential earnings example
  const exampleSpend = earnRate >= 5 ? 100 : 200;
  const exampleEarnings = Math.round(exampleSpend * earnRate);
  
  return `🎯 **${displayName}, your ${merchant.merchant_name} link is ready!**

` +
         `✨ **Earn ${earnRate} Max Miles per $1** spent
` +
         `💰 Example: Spend $${exampleSpend} → Earn ${exampleEarnings} Max Miles

` +
         `🚀 **Your personalized link:** 👆

` +
         `⚡ **Others**: Tap "Get MY Link" to earn Max Miles at ${merchant.merchant_name} too!

` +
         `💡 **Discover more**: Try @HeyMax_shop_bot shopee, grab, klook...`;
}

// Enhanced viral keyboard with better UX
async function generateViralKeyboard(userId: number, username: string, merchant: any, affiliateLink: string) {
  return {
    inline_keyboard: [
      [
        {
          text: `🛍️ Shop ${merchant.merchant_name} & Earn Miles`,
          url: affiliateLink
        }
      ],
      [
        {
          text: `⚡ Get MY Unique Link for ${merchant.merchant_name}`,
          callback_data: `generate:${merchant.merchant_slug}:${userId}`
        }
      ]
    ]
  };
}

// Enhanced analytics tracking with detailed metrics
async function trackEnhancedLinkGeneration(userId: number, merchants: any[], searchTerm: string, query: TelegramInlineQuery) {
  try {
    // Log enhanced link generation with more details
    const { error: insertError } = await supabase
      .from('link_generations')
      .insert({
        user_id: userId,
        merchant_slug: merchants.length > 0 ? merchants[0].merchant_slug : 'no_results',
        generated_at: new Date().toISOString(),
        search_term: searchTerm,
        results_count: merchants.length,
        chat_type: query.chat_type || 'unknown'
      });

    if (insertError) {
      console.error("Error in enhanced tracking:", insertError);
    }

    // Update user link count
    await supabase
      .from('users')
      .update({ 
        link_count: supabase.raw('link_count + 1'),
        last_activity: new Date().toISOString()
      })
      .eq('id', userId);

  } catch (error) {
    console.error("Error in enhanced tracking:", error);
    // Don't throw - tracking failures shouldn't break core functionality
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