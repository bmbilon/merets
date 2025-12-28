# TestFlight Setup & SMS Invites for Ments

## 📱 Quick Start: Get Your SMS-Friendly Invite Link

### Prerequisites
- [x] EAS project ID configured (✅ already done)
- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect access

## Step 1: Build for TestFlight

```bash
# Install EAS CLI if needed
npm install -g eas-cli

# Login to your Expo account
eas login

# Configure build profile for iOS
eas build:configure

# Build for TestFlight (takes ~15-20 minutes)
eas build --platform ios --profile production
```

## Step 2: Submit to TestFlight

Once the build completes:

```bash
# Submit directly to App Store Connect
eas submit --platform ios --latest
```

Or manually:
1. Download the `.ipa` file from the build link
2. Go to https://appstoreconnect.apple.com
3. Navigate to **My Apps** → **Ments** → **TestFlight**
4. Upload the `.ipa`

## Step 3: Get Your TestFlight Invite Link

### Method A: Public Link (Easiest for SMS)

1. Go to **App Store Connect** → **TestFlight**
2. Click your app → **Public Link** tab (left sidebar)
3. Enable **Public Link**
4. Copy the link (format: `https://testflight.apple.com/join/XXXXXXXX`)

**This link can be texted to anyone!** 🎉

Example SMS:
```
Hey! Try out Ments beta:
https://testflight.apple.com/join/abc123

Install TestFlight app first if you don't have it.
```

### Method B: Internal Testing (Family Only)

1. Go to **Internal Testing** tab
2. Create a group (e.g., "Family Beta")
3. Add testers by Apple ID email
4. They'll get an email with install link
5. Share that link via SMS

### Method C: External Testing (Up to 10,000 testers)

1. Go to **External Testing** tab
2. Add testers (doesn't require Apple ID)
3. Send invites to their emails
4. Copy the public TestFlight link and SMS it

## Step 4: Tester Instructions for SMS

Send this to your testers:

```
🎯 Join Ments Beta Testing!

1. Install TestFlight app:
   https://apps.apple.com/app/testflight/id899247664

2. Open this link on your iPhone:
   https://testflight.apple.com/join/[YOUR_CODE]

3. Tap "Accept" and "Install"

That's it! The app will auto-update with new versions.
```

## Build Configuration

Your current setup:
- **Bundle ID**: `com.execom.commitmentsstickers`
- **EAS Project**: `65750a9a-f170-4e96-a1d7-5d02fe182511`
- **App Name**: Ments

### Create `eas.json` (if you don't have it):

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "FILL_AFTER_FIRST_SUBMISSION",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

## Quick Commands

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to TestFlight
eas submit --platform ios --latest

# View all builds
eas build:view

# Update app (testers auto-get update)
eas build --platform ios --profile production --auto-submit
```

## TestFlight Limits

- **Internal Testing**: Up to 100 testers (requires Apple ID)
- **External Testing**: Up to 10,000 testers
- **Public Link**: Unlimited (best for SMS invites)
- **Build expiration**: 90 days
- **Auto-updates**: ✅ Yes, testers get notified

## SMS Template Examples

### For Family:
```
👋 Hi! Want to test the Ments app we've been working on?

📱 Install TestFlight: https://apps.apple.com/app/testflight/id899247664
🚀 Join beta: https://testflight.apple.com/join/abc123

Let me know what you think!
```

### For Friends:
```
Hey! I'm testing my new app Ments - helps families 
track chores & allowances. Want to try it?

TestFlight link: https://testflight.apple.com/join/abc123
```

## Troubleshooting

### "Build failed"
- Check bundle identifier matches Apple Developer portal
- Ensure you have a valid provisioning profile
- Run: `eas credentials` to manage certificates

### "Can't find app in TestFlight"
- Wait 5-10 minutes after upload
- Check **Processing** status in App Store Connect
- Verify build passed **Review** (auto for internal)

### "Link doesn't work"
- Ensure Public Link is enabled
- Check if you're using Internal link (requires email invite first)
- Verify tester has TestFlight app installed

## Cost Breakdown

- **Apple Developer Account**: $99/year (required)
- **EAS Builds**: Free tier = 30 builds/month (plenty for beta)
- **TestFlight**: Free (part of App Store Connect)

## Next Steps After SMS Invites

1. **Gather Feedback**: TestFlight has built-in crash reporting
2. **Push Updates**: Just run `eas build` again - testers auto-update
3. **Monitor Analytics**: App Store Connect shows installs, crashes
4. **Go Live**: When ready, submit for App Store Review

---

**Ready to build?** Run: `eas build --platform ios --profile production`

Your TestFlight link will be ready in ~20 minutes! 🚀
