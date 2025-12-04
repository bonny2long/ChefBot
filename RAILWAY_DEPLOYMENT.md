# 🚂 Railway Deployment Guide for ChefBot Backend

This guide will help you deploy your ChefBot backend to Railway.

## Prerequisites

- A [Railway account](https://railway.app/) (free tier available)
- Your GitHub repository with the ChefBot code
- Anthropic API key for Claude AI

## Step-by-Step Deployment

### 1. Create a New Railway Project

1. Go to [Railway.app](https://railway.app/)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account
5. Select your **ChefBot** repository

### 2. Configure the Service

Railway will automatically detect your Node.js application. The `railway.json` file in your repository will configure the deployment settings.

### 3. Set Environment Variables

In your Railway project dashboard:

1. Click on your service
2. Go to the **"Variables"** tab
3. Add the following environment variables:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
CLAUDE_API_URL=https://api.anthropic.com/v1/messages
NODE_ENV=production
```

**Important**: Replace `sk-ant-your-actual-api-key-here` with your actual Anthropic API key.

### 4. Deploy

Railway will automatically deploy your application. You can monitor the deployment in the **"Deployments"** tab.

### 5. Get Your Backend URL

Once deployed:

1. Go to the **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Your backend will be available at: `https://your-app-name.up.railway.app`

### 6. Update Your Frontend

Update your frontend environment variables to point to your new Railway backend URL:

```env
VITE_API_URL=https://your-app-name.up.railway.app
```

## Configuration Files

### `railway.json`

This file configures how Railway builds and deploys your application:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `package.json`

Ensure your `package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude AI | ✅ Yes |
| `CLAUDE_API_URL` | Claude API endpoint (default: https://api.anthropic.com/v1/messages) | ⚠️ Optional |
| `PORT` | Port number (Railway sets this automatically) | ❌ No |
| `NODE_ENV` | Environment mode (set to "production") | ⚠️ Recommended |

## Testing Your Deployment

1. **Check Health**: Visit `https://your-app-name.up.railway.app` in your browser
2. **Test API**: Use a tool like Postman or curl to test the `/claude-proxy` endpoint:

```bash
curl -X POST https://your-app-name.up.railway.app/claude-proxy \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Give me a simple pasta recipe"}'
```

## Monitoring and Logs

- **View Logs**: In Railway dashboard, go to your service → "Deployments" → Click on a deployment → "View Logs"
- **Metrics**: Railway provides CPU, Memory, and Network metrics in the "Metrics" tab

## Troubleshooting

### Deployment Fails

- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify `railway.json` is in the root directory

### API Key Not Working

- Double-check the `ANTHROPIC_API_KEY` in Railway variables
- Ensure there are no extra spaces or quotes
- Check the Railway logs for "API Key loaded: YES"

### CORS Errors

- Verify your frontend URL is allowed in `server.js`
- Update the `allowedOriginRegex` if needed

## Cost Considerations

Railway offers:
- **Free Tier**: $5 of usage per month (sufficient for development/testing)
- **Pro Plan**: $20/month for production apps
- **Usage-Based**: Pay only for what you use

## Advantages of Railway

✅ **Automatic Deployments**: Push to GitHub → Auto-deploy  
✅ **Easy Environment Variables**: Simple UI for managing secrets  
✅ **Built-in Monitoring**: Logs and metrics out of the box  
✅ **Fast Deployments**: Typically under 2 minutes  
✅ **Free SSL**: HTTPS enabled by default  
✅ **Generous Free Tier**: Great for hobby projects  

## Migration from Render

If you're migrating from Render:

1. ✅ All code changes are already done (server.js updated)
2. ✅ Configuration file created (railway.json)
3. ⚠️ Copy environment variables from Render to Railway
4. ⚠️ Update frontend to use new Railway URL
5. ⚠️ Test thoroughly before switching production traffic

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app/)

---

**Need Help?** Check the Railway logs first, then consult the documentation or community Discord.
