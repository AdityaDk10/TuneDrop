# SendGrid Email Setup Guide

## 🚀 Quick Setup

### 1. Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for a free account (100 emails/day)
3. Verify your email address

### 2. Get Your API Key
1. In SendGrid dashboard, go to **Settings → API Keys**
2. Click **"Create API Key"**
3. Choose **"Full Access"** or **"Restricted Access"** with **"Mail Send"** permissions
4. **Copy the API key** (you'll only see it once!)

### 3. Set Environment Variables
Add these to your `.env` file in the backend:

```bash
# SendGrid Configuration (Primary)
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=submissions@tunedrop.com
TEST_EMAIL=aditya.dabbirukashyap@gmail.com

# Gmail SMTP (Fallback - Optional)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

### 4. Test the Setup
1. Start your backend server
2. Go to your admin dashboard
3. Use the email test feature or make a submission
4. Check the logs for "✅ SendGrid initialized successfully"

## 🔧 Advanced Configuration

### Domain Verification (Recommended)
1. In SendGrid dashboard, go to **Settings → Sender Authentication**
2. Follow the domain verification process
3. This improves email deliverability

### Email Templates
The system uses beautiful HTML email templates for:
- Submission confirmations
- Approval notifications
- Rejection notifications

## 🛡️ Fallback System

The email service now has a smart fallback system:
1. **Primary**: SendGrid API
2. **Fallback**: Gmail SMTP (if SendGrid fails)
3. **Error Handling**: Detailed logging for debugging

## 📊 Benefits of SendGrid

- ✅ **Better Deliverability**: 99%+ delivery rate
- ✅ **Professional Service**: Built for transactional emails
- ✅ **Analytics**: Track email opens, clicks, bounces
- ✅ **Scalability**: Handles high volume easily
- ✅ **Reliability**: 99.9% uptime SLA

## 🐛 Troubleshooting

### Common Issues:

1. **"API Key not found"**
   - Check your `.env` file has `SENDGRID_API_KEY`
   - Restart your server after adding the key

2. **"Authentication failed"**
   - Verify your API key is correct
   - Check SendGrid account status

3. **"From address not verified"**
   - Verify your sender domain in SendGrid
   - Or use a verified sender email

### Logs to Check:
```
✅ SendGrid initialized successfully
✅ Email sent via SendGrid: [message-id]
❌ SendGrid failed, trying Gmail SMTP: [error]
```

## 🎯 Next Steps

1. **Test with a submission**: Make a test submission to verify emails work
2. **Monitor logs**: Check for successful email delivery
3. **Set up monitoring**: Consider SendGrid's webhook for delivery tracking

## 📞 Support

If you encounter issues:
1. Check SendGrid dashboard for API key status
2. Verify environment variables are set correctly
3. Check server logs for detailed error messages
