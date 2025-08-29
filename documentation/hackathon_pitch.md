# HeyMax Shop Telegram Bot: Turn Every Chat Into Miles

## Concise Pitch

**Hook**: What if typing `@HeyMax_shop_bot Pelago` in your group chat instantly earned you free flights?

**The Reality**: 70% of people abandon affiliate links due to friction. HeyMax has 500+ merchants and 11K Telegram users - but they're disconnected.

**HeyMax_shop_bot Solution**: One command in Telegram = instant personalized Max Miles earning links. No apps, no websites, just pure social commerce.

**Traction Ready**: Built on HeyMax's $6M run rate platform with 272M+ Max Miles issued.

**Vision**: Transform Asia's millions of group chats into Max Miles earning machines.

**Future Plans**:
- **Viral Engine**: Real-time anonymized feed shows *"Someone just earned 3,200 Max Miles at Pelago!"* - creating FOMO and social proof that drives organic growth.
- **Community Monetization**: Group owners earn 10% revenue share from member purchases - turning every admin into a HeyMax_shop_bot advocate.
- **Link your HeyMax account**: Allow Telegram group members to link their Telegram username to their HeyMax account for seamless tracking and rewards redemptions.

**Ask**: HeyMax's affiliate merchant dataset access and pilot with HeyMax's existing 11K Telegram community.

## Detailed Hackathon Pitch

### The Problem

Affiliate marketing is broken. Users face **3-5 steps** to get tracking links:
1. Visit rewards sites
2. Register
3. Login
4. Navigate menus
5. Copy links

**Result**: 70% drop-off rates and lost commissions for both merchants and users.

### Our Solution: HeyMax_shop_bot

A Telegram bot that turns group chats into instant shopping experiences powered by HeyMax's rewards ecosystem.

**Single command magic**: `@HeyMax_shop_bot Pelago` → Get personalized Max Miles earning link instantly.

#### Bot response

##### Bot message
```
🎯 @maxtan, your Pelago shopping link is ready!

✨ Earn up to 8 Max Miles per $1 spent on every Pelago purchase. Turn your Pelago shopping into free flights, dining, and more!

👆 @maxtan Tap your personalized link above to start earning
👇 Others: Generate YOUR unique link to earn Max Miles at Pelago too!

💡 Try other merchants: @HeyMax_shop_bot [merchant] (e.g., Adidas, Apple, Starbucks)
```

##### Bot buttons

1. [🛍️ Shop Pelago & Earn Miles (for @maxtan)](https://heymax.com/shop/Pelago?ref={user_id}&utm_source=telegram) 
2. [⚡ Get MY Unique Link for Pelago](TODO)

**Viral Mechanics**: Each bot response creates FOMO in the group chat, encouraging others to generate their own affiliate links and creating a viral growth loop.

### Why Now? Perfect Market Fit

- **HeyMax foundation**: 500+ merchants, 120K+ users, $6M run rate
- **Telegram momentum**: 11K+ HeyMax community members already engaged
- **Proven traction**: 272M+ Max Miles issued, 27M+ redeemed

### Technical Innovation

- **HeyMax integration** with HeyMax's existing merchant affiliates system
- **Real-time affiliate link generation** with Max Miles tracking
- **Group chat native** - no app switching required
- **Anonymized live feed engine** showing community earnings in real-time

### Business Impact

- **3x conversion rates** by eliminating friction
- **Viral growth** through social group dynamics
- **Revenue amplification** for HeyMax's merchant network
- **User engagement boost** in existing Telegram community
- **Network effects**: Each earning notification motivates 5-10 new transactions

### The Vision

Transform every Telegram group into a Max Miles earning opportunity. From **11K community members** to **millions** of social commerce interactions across Asia Pacific.

### Future Plans

- **Viral Engine**: Real-time anonymized feed shows *"Someone just earned 3,200 Max Miles at Pelago!"* - creating FOMO and social proof that drives organic growth.
- **Community Monetization**: Group owners earn 10% revenue share from member purchases - turning every admin into a HeyMax_shop_bot advocate.
- **Link your HeyMax account**: Allow Telegram group members to link their Telegram username to their HeyMax account for seamless tracking and rewards redemptions.

### The Ask

**Partnership** to access HeyMax's merchant affiliate dataset and pilot with existing community.

## Technical implementation

### Bot Response Architecture

**User Flow**:
1. User types `@HeyMax_shop_bot [merchant]` in group chat
2. Bot extracts username and merchant from command
3. Generates unique affiliate link with user tracking and extract up to {{base_mpd}} Max Miles per $1 spent rate
4. Returns formatted message with two CTA buttons

### Button Functionality

#### Button 1: Personal Affiliate Link
- **Label**: `🛍️ Shop [Merchant] & Earn Miles (for @username)`
- **Function**: Direct link to merchant with user's unique affiliate tracking
- **Data**: `affiliate_link: "https://pelago.pxf.io/Wqa5xZ?subid1={{USER_ID}}"`
- **Analytics**: Tracks clicks, conversions, Max Miles earned

#### Button 2: Viral Growth Engine  
- **Label**: `⚡ Get MY Unique Link for [Merchant]`
- **Function**: Triggers bot to generate caller's own personalized response
- **Viral Mechanism**: Each click creates a new bot response in the chat
- **Growth Loop**: New response → More visibility → More clicks → Exponential growth

### Technical Stack

```yaml
Bot Framework: Telegram Bot API
Backend: Python
Affiliate System: HeyMax merchant affiliate data set
User Tracking: Telegram user_id 
Analytics: Real-time click tracking and conversion measurement
Viral Metrics: Group participation rates, user acquisition costs
```

### Viral Growth Mechanics

- **Social Proof**: Each bot response shows real earning opportunities
- **Network Effects**: More users = more visibility = more conversions

### HeyMax merchant affiliate dataset schema

Full dataset in JSON format: `dataset/extracted_affiliation_merchants_sg.json`

Example using Pelago
```json
[
  {
    "base_mpd": "8.0",
    "merchant_name": "Pelago by Singapore Airlines",
    "merchant_slug": "pelago-by-singapore-airlines",
    "tracking_link": "https://pelago.pxf.io/Wqa5xZ?subid1=telegram{{USER_ID}}"
  }
]
```
