// Exported functions for testing - Bot Utilities
// This file exports functions from the edge function for unit testing

// Import types
export interface TelegramInlineQuery {
  id: string;
  from: TelegramUser;
  query: string;
  offset: string;
  chat_type?: string;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  language_code?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  title?: string;
}

export interface TelegramInlineQueryResult {
  type: "article";
  id: string;
  title: string;
  input_message_content: {
    message_text: string;
    parse_mode: "Markdown";
  };
  reply_markup?: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url?: string;
        callback_data?: string;
      }>
    >;
  };
  description?: string;
  thumbnail_url?: string;
}

export interface Merchant {
  merchant_slug: string;
  merchant_name: string;
  tracking_link: string;
  base_mpd: number;
}

export interface AffiliateData {
  affiliate_link: string;
  tracking_id: string;
  merchant: Merchant;
}

// Utility functions for testing

// Calculate fuzzy match score for merchant search
export function calculateMatchScore(merchantName: string, searchTerm: string): number {
  const name = merchantName.toLowerCase();
  const term = searchTerm.toLowerCase().trim();

  // Handle empty search term
  if (term.length === 0) return 0;

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
export function countCommonChars(str1: string, str2: string): number {
  const chars1 = str1.split("").sort();
  const chars2 = str2.split("").sort();
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

// Generate enhanced bot response
export function generateEnhancedBotResponse(
  userId: number,
  username: string,
  merchant: Merchant,
  _affiliateData: AffiliateData,
): string {
  const displayName = username ? `@${username}` : `User ${userId}`;
  const earnRate = merchant.base_mpd;

  // Calculate potential earnings example
  const exampleSpend = earnRate >= 5 ? 100 : 200;
  const exampleEarnings = Math.round(exampleSpend * earnRate);

  return `🎯 **${displayName}, your ${merchant.merchant_name} link is ready!**

✨ **Earn up to ${earnRate} Max Miles per $1** spent
💰 Example: Spend $${exampleSpend} → Earn up to ${exampleEarnings} Max Miles

🚀 **Your personalized link for ${displayName}:** 👇

⚡ **Others**: Tap "Get MY Link" to earn Max Miles at ${merchant.merchant_name} too!

💡 **Discover more**: Try @heymax_shop_bot amazon, trip.com, klook...

📋 **More details & terms**: https://heymax.ai/merchant/${encodeURIComponent(merchant.merchant_name)}`;
}

// Generate viral keyboard
export function generateViralKeyboard(
  userId: number,
  username: string,
  merchant: Merchant,
  affiliateLink: string,
) {
  const displayName = username ? `@${username}` : `User ${userId}`;

  return {
    inline_keyboard: [
      [
        {
          text: `🛍️ Shop ${merchant.merchant_name} & Earn Miles (${displayName})`,
          url: affiliateLink,
        },
      ],
      [
        {
          text: `⚡ Get MY Unique Link for ${merchant.merchant_name}`,
          callback_data: `generate:${merchant.merchant_slug}:${userId}`,
        },
      ],
    ],
  };
}

// Validate inline query structure
export function validateInlineQueryStructure(query: TelegramInlineQuery): boolean {
  return !!(
    query &&
    query.id &&
    query.from &&
    typeof query.from.id === "number" &&
    typeof query.query === "string"
  );
}

// Generate affiliate link with tracking
export function generateAffiliateLink(
  userId: number,
  merchantSlug: string,
  trackingLink: string,
): AffiliateData {
  // Replace placeholder with actual user ID
  const affiliateLink = trackingLink.replace("{{USER_ID}}", userId.toString());

  // Add comprehensive UTM parameters for tracking
  const utmParams = new URLSearchParams({
    utm_source: "telegram",
    utm_medium: "heymax_shop_bot",
    utm_campaign: "viral_social_commerce",
    utm_content: merchantSlug,
    utm_term: `user_${userId}`,
    heymax_ref: `telegram_${userId}`,
    timestamp: Date.now().toString(),
  });

  // Add UTM parameters to the link
  const separator = affiliateLink.includes("?") ? "&" : "?";
  const finalLink = `${affiliateLink}${separator}${utmParams.toString()}`;

  // Generate unique tracking ID for this specific link generation
  const trackingId = `tg_${userId}_${merchantSlug}_${Date.now()}`;

  return {
    affiliate_link: finalLink,
    tracking_id: trackingId,
    merchant: {
      merchant_slug: merchantSlug,
      merchant_name: merchantSlug, // Mock for testing
      tracking_link: trackingLink,
      base_mpd: 5, // Mock value
    },
  };
}

// Validate user upsert data structure
export function validateUserUpsertData(userId: number, username: string) {
  return {
    id: userId,
    username: username,
    first_seen: new Date().toISOString(),
  };
}

// Generate inline query result
export function generateInlineQueryResult(
  id: string,
  title: string,
  description: string,
  message_text: string,
  reply_markup?: any,
): TelegramInlineQueryResult {
  return {
    type: "article",
    id,
    title,
    description,
    input_message_content: {
      message_text,
      parse_mode: "Markdown",
    },
    reply_markup,
    thumbnail_url: "https://storage.googleapis.com/max-sg/assets/heymax_logo_square.png",
  };
}

// Mock merchants for testing
export const MOCK_MERCHANTS: Merchant[] = [
  {
    merchant_slug: "amazon",
    merchant_name: "Amazon Singapore",
    tracking_link: "https://amazon.sg/?ref={{USER_ID}}",
    base_mpd: 4.0,
  },
  {
    merchant_slug: "shopee",
    merchant_name: "Shopee Singapore",
    tracking_link: "https://shopee.sg/?ref={{USER_ID}}",
    base_mpd: 6.5,
  },
  {
    merchant_slug: "klook",
    merchant_name: "Klook",
    tracking_link: "https://klook.com/?ref={{USER_ID}}",
    base_mpd: 8.0,
  },
];
