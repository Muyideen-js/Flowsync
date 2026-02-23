# Meta API Setup Guide (WhatsApp & Instagram)

This guide walks you through setting up a Meta Developer account and obtaining the necessary credentials for the FlowSync WhatsApp and Instagram integrations.

## 1. Create a Meta Developer Account

1.  Go to [Meta for Developers](https://developers.facebook.com/).
2.  Log in with your Facebook account.
3.  Click **"My Apps"** in the top right corner.
4.  If you haven't already, register as a developer (you might need to verify your phone number).

## 2. Create a Business App

1.  Click **"Create App"**.
2.  Select **"Other"** -> **"Next"**.
3.  Select **"Business"** as the app type -> **"Next"**.
4.  Enter an **App Name** (e.g., "FlowSync Automation").
5.  Enter your **Contact Email**.
6.  (Optional) Select a Business Account if you have one.
7.  Click **"Create App"**.

---

## Troubleshooting: Stuck on "Testing your use cases"?

If you see a page about "Testing your use cases" or don't see WhatsApp/Instagram:

1.  **You are in the wrong view.** Click **"Dashboard"** in the left sidebar.
2.  Look for a section called **"Add products to your app"**.
3.  If you still don't see WhatsApp:
    *   Click **"My Apps"** (top right).
    *   **Delete** the current app (optional, to avoid confusion).
    *   Create a **New App**.
    *   **Crucial:** Select **"Other"** (at the bottom) -> **Next**.
    *   Select **"Business"** ( Briefcase icon) -> **Next**.
    *   Enter name -> **Create App**.

---

## 3. WhatsApp Business API Setup

### A. Add WhatsApp Product
1.  In your app dashboard, scroll down to **"WhatsApp"** and click **"Set up"**.
2.  Select your Business Account (or create a new one).

### B. Get Temporary Credentials (for Testing)
1.  Go to **WhatsApp** -> **API Setup** in the left sidebar.
2.  You will see:
    *   **Temporary Access Token**: Copy this. (Valid for 24 hours).
    *   **Phone Number ID**: Copy this.
    *   **WhatsApp Business Account ID**: Copy this.
3.  **Important:** Add your own phone number to the **"To"** field in the "Send and receive messages" section and click **"Manage phone number list"** to verify it for testing.

### C. Configure Webhooks (Required for receiving messages)
1.  Go to **WhatsApp** -> **Configuration**.
2.  Click **"Edit"** in the "Callback URL" section.
3.  **Callback URL:** Since we are developing locally, you need a public URL (using ngrok or similar, or your Vercel deployment URL).
    *   Example: `https://your-vercel-app.vercel.app/api/whatsapp/webhook`
4.  **Verify Token:** Create a verification string (e.g., `flowsync_verify_token`).
5.  Click **"Verify and Save"**.
6.  Click **"Manage"** under Webhook fields and subscribe to `messages`.

---

## 4. Instagram Graph API Setup

### A. Prerequisites
1.  **Instagram Business Account:** Your Instagram account must be a Business or Creator account.
2.  **Facebook Page:** Your Instagram account must be connected to a Facebook Page.

### B. Add Instagram Product
1.  In your app dashboard, scroll down to **"Instagram Graph API"** and click **"Set up"**.

### C. Get Access Token
1.  Go to **Tools** -> **Graph API Explorer** (in the top menu under Tools).
2.  Select your App in the "Meta App" dropdown.
3.  User or Page: **"Get User Access Token"**.
4.  Permissions: Add the following permissions:
    *   `instagram_basic`
    *   `instagram_content_publish`
    *   `instagram_manage_comments`
    *   `instagram_manage_insights`
    *   `pages_show_list`
    *   `pages_read_engagement`
5.  Click **"Generate Access Token"**.
6.  Follow the login flow to authorize your Instagram Business account.

### D. Get Instagram Business Account ID
1.  In the Graph API Explorer, make a GET request to `me/accounts`.
2.  Find your Page ID.
3.  Make a GET request to `/{page-id}?fields=instagram_business_account`.
4.  Copy the JSON response `id` (this is your Instagram Business Account ID).

---

## 5. Update Your .env File (Optional)

You can either set credentials in `.env` or connect via the Accounts page UI.

```env
# Meta WhatsApp Cloud API (optional — can also connect via Accounts UI)
WHATSAPP_TOKEN=your_temporary_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WABA_ID=your_whatsapp_business_account_id
WHATSAPP_VERIFY_TOKEN=flowsync_verify_token

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_id
```

## 6. Connect via FlowSync Accounts Page

1. Go to **Accounts** in the app.
2. Click **Connect WhatsApp via API**.
3. Enter **Access Token**, **Phone Number ID**, and **WABA ID** from API Setup.
4. Click **Connect**. The app validates credentials and marks WhatsApp connected on success.
5. Configure the webhook in Meta: `https://your-backend-url/api/whatsapp/webhook`
