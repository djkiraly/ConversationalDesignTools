# Setting Up OpenAI API for the Workflow Builder

This guide explains how to obtain and configure an OpenAI API key for use with the Conversational AI Workflow Builder application.

## Why OpenAI API is Required

The Conversational AI Workflow Builder uses OpenAI's API for several key features:

- Generating conversation flow suggestions
- Creating agent personas
- Providing workflow optimization recommendations
- Generating action plans based on use cases
- Summarizing customer journeys

Without a valid API key, these AI-powered features will not function.

## Getting an OpenAI API Key

### Step 1: Create an OpenAI Account

1. Visit [OpenAI's website](https://platform.openai.com/signup)
2. Sign up for an account or log in if you already have one

### Step 2: Navigate to API Keys

1. Once logged in, go to the [API keys page](https://platform.openai.com/api-keys)
2. Click on "Create new secret key"
3. Give your key a name (e.g., "Conversation AI Workflow Builder")
4. Copy the generated key immediately (you won't be able to see it again)

### Step 3: Set Up Payment Method

1. Go to the [Billing section](https://platform.openai.com/account/billing/overview)
2. Add a payment method
3. Set usage limits if desired to control costs

## Configuring the Application

### Adding the API Key to Your Environment

1. Open your `.env` file in the project root
2. Find or add the `OPENAI_API_KEY` line
3. Set it to your API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
4. Save the file

### Verifying the API Key

The application will automatically verify your OpenAI API key when you start the server. If there's an issue with the key, you'll see error messages in the server logs.

You can also manually verify your key:

1. Go to Settings in the application
2. Look for OpenAI API status
3. If it shows "Connected", your key is working correctly

## API Usage and Costs

### Understanding OpenAI's Pricing

OpenAI charges based on the number of tokens processed. A token is roughly 4 characters or 0.75 words.

The application primarily uses:
- GPT-4 for complex reasoning tasks
- GPT-3.5 Turbo for simpler generations

### Estimating Costs

Typical usage for a small team might cost:
- $10-30 per month for occasional use
- $50-100 per month for moderate use
- $100+ for intensive use

### Managing Costs

To control API usage costs:

1. Set usage limits in your OpenAI account
2. Monitor usage in the OpenAI dashboard
3. Use the application's caching features to reduce redundant API calls
4. Consider using GPT-3.5 for more tasks if costs are a concern

## Troubleshooting

### Common Issues

1. **"Invalid Authentication" errors**:
   - Verify your API key is correctly copied with no extra spaces
   - Ensure the key is active in your OpenAI dashboard

2. **"Insufficient quota" errors**:
   - Check your OpenAI account balance
   - Verify your payment method is working

3. **"Rate limit" errors**:
   - These occur when making too many requests too quickly
   - The application has built-in rate limiting, but you may need to adjust your usage patterns

### Getting Help

If you continue to experience issues:

1. Check OpenAI's [status page](https://status.openai.com/) for service disruptions
2. Review your API usage in the OpenAI dashboard
3. Contact your system administrator if using a shared API key

## Best Practices

1. **Security**: Never share your API key or commit it to version control
2. **Rotation**: Periodically rotate your API key for better security
3. **Monitoring**: Regularly check your usage to avoid unexpected costs
4. **Testing**: Use a separate API key for development and production environments