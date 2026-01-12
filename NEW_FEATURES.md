# New Features - Kira Discord Bot

## Overview

This update adds three major new features to the Kira Discord Bot:

1. **Message Templates Library**
2. **Server Analytics Dashboard**
3. **Welcome/Goodbye System**

---

## 1. Message Templates Library 📝

Zarz manage and reuse message templates across your Discord server.

### Features

- **Create & Save Templates**: Save frequently used messages and embeds
- **Categorization**: Organize templates by category (Welcome, Rules, Events, Announcements, Other)
- **Variable Support**: Use dynamic variables in templates:
  - `{{server.name}}` - Server name
  - `{{server.members}}` - Member count
  - `{{server.icon}}` - Server icon URL
- **Usage Tracking**: See how many times each template has been used
- **Quick Deploy**: Send templates to any channel with one click

### How to Use

1. Navigate to `/dashboard/:serverId/templates`
2. Click "Create Template"
3. Fill in template details:
   - Name
   - Category
   - Message content (optional)
   - Embed details (optional)
4. Use variables like `{{server.name}}` for dynamic content
5. Save and deploy to channels

### API Endpoints

```
GET    /api/templates/:serverId              - Get all templates
GET    /api/templates/:serverId/:id          - Get single template
POST   /api/templates/:serverId              - Create template
PUT    /api/templates/:serverId/:id          - Update template
DELETE /api/templates/:serverId/:id          - Delete template
POST   /api/templates/:serverId/:id/use      - Use template (send to channel)
```

### Database Model

```javascript
MessageTemplate {
  id: UUID,
  serverId: String,
  name: String,
  category: ENUM('welcome', 'rules', 'events', 'announcements', 'other'),
  content: JSON,
  variables: JSON,
  usageCount: Integer,
  lastUsed: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 2. Server Analytics Dashboard 📊

Comprehensive analytics and insights for your Discord server.

### Features

- **Real-time Statistics**:
  - Total members
  - Online members
  - Messages today
  - Channel count
  - Joins/leaves today

- **Historical Charts**:
  - Member growth over time
  - Message activity trends
  - Join/leave patterns

- **Top Lists**:
  - Most active users
  - Most active channels
  - Activity trends

- **Time Ranges**: View data for 7, 30, or 90 days

### How to Use

1. Navigate to `/dashboard/:serverId/analytics`
2. View real-time stats at the top
3. Select time range (7/30/90 days)
4. Explore charts and activity data

### API Endpoints

```
GET /api/analytics/:serverId/summary    - Get dashboard summary
GET /api/analytics/:serverId/members    - Get member analytics
GET /api/analytics/:serverId/messages   - Get message analytics
GET /api/analytics/:serverId/activity   - Get activity analytics
```

### Database Model

```javascript
ServerAnalytics {
  id: UUID,
  serverId: String,
  date: DATEONLY,
  memberCount: Integer,
  messagesCount: Integer,
  joinCount: Integer,
  leaveCount: Integer,
  activeUsers: JSON (Array),
  topChannels: JSON (Object),
  createdAt: Date,
  updatedAt: Date
}
```

### Data Collection

Analytics are automatically collected via Discord bot events:
- Member joins/leaves
- Message activity
- User presence

---

## 3. Welcome/Goodbye System 👋

Automatically greet new members and say goodbye to leaving members.

### Features

- **Welcome Messages**:
  - Custom welcome messages in specified channel
  - Support for text and embeds
  - Dynamic variables (user, server info)

- **Goodbye Messages**:
  - Custom goodbye messages
  - Same variable support as welcome

- **Direct Messages**:
  - Optionally DM new members
  - Custom DM content

- **Auto-Role**:
  - Automatically assign role to new members
  - Configurable role selection

- **Test Function**:
  - Test messages before enabling
  - Preview how they'll look

### How to Use

1. Navigate to `/dashboard/:serverId/welcome`
2. Enable welcome/goodbye messages
3. Select channels for each
4. Customize messages with variables:
   - `{{user}}` - User's tag
   - `{{user.mention}}` - Mention the user
   - `{{server}}` - Server name
   - `{{memberCount}}` - Member count
   - `{{user.avatar}}` - User's avatar URL
5. Test messages before enabling
6. Optionally configure DM and auto-role
7. Save settings

### API Endpoints

```
GET  /api/welcome/:serverId       - Get welcome settings
PUT  /api/welcome/:serverId       - Update welcome settings
POST /api/welcome/:serverId/test  - Send test message
```

### Database Model

```javascript
WelcomeSettings {
  serverId: String (PK),
  welcomeEnabled: Boolean,
  welcomeChannelId: String,
  welcomeMessage: JSON,
  goodbyeEnabled: Boolean,
  goodbyeChannelId: String,
  goodbyeMessage: JSON,
  dmNewMembers: Boolean,
  dmMessage: Text,
  autoRoleId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Event Handlers

Two new event handlers automatically trigger:

**guildMemberAdd.js**:
- Sends welcome message
- DMs new member (if enabled)
- Assigns auto-role (if configured)
- Updates analytics

**guildMemberRemove.js**:
- Sends goodbye message
- Updates analytics

---

## Installation & Setup

### 1. Install Dependencies

No new dependencies required! All features use existing packages.

### 2. Database Migration

Run the server to auto-create new tables:

```bash
node index.js
```

Sequelize will automatically create:
- `MessageTemplates`
- `WelcomeSettings`
- `ServerAnalytics`

### 3. Bot Permissions

Ensure your bot has these permissions:
- `GUILD_MEMBERS` intent (already enabled)
- `GUILD_MESSAGES` intent (newly added)
- `GUILD_PRESENCES` intent (newly added)
- Manage Roles (for auto-role feature)
- Send Messages (for welcome/goodbye)

### 4. Frontend Build

Rebuild the frontend to include new pages:

```bash
cd panel
npm install
npm run build
cd ..
```

---

## Navigation

New routes added to the application:

- `/dashboard/:id/templates` - Message Templates
- `/dashboard/:id/analytics` - Server Analytics
- `/dashboard/:id/welcome` - Welcome/Goodbye Settings

Update your navigation menu to include links to these pages.

---

## Configuration

### Environment Variables

No new environment variables required. All features work with existing configuration.

### Bot Intents

Updated bot client initialization in `index.js`:

```javascript
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,      // NEW
    GatewayIntentBits.GuildPresences      // NEW
  ]
});
```

---

## Features Comparison

| Feature | Before | After |
|---------|--------|-------|
| Message Templates | ❌ | ✅ |
| Analytics | ❌ | ✅ |
| Welcome Messages | ❌ | ✅ |
| Goodbye Messages | ❌ | ✅ |
| Auto-Role | ❌ | ✅ |
| DM New Members | ❌ | ✅ |
| Variable Support | ❌ | ✅ |

---

## Best Practices

### Templates
- Use clear, descriptive names
- Categorize properly for easy finding
- Test templates before using them widely
- Update templates regularly

### Analytics
- Check analytics regularly to understand server trends
- Use insights to improve engagement
- Monitor spikes in joins/leaves
- Identify most active times and channels

### Welcome System
- Keep messages friendly and informative
- Direct new members to rules and important channels
- Use mentions sparingly to avoid spam
- Test thoroughly before enabling
- Choose appropriate auto-role (not admin!)

---

## Troubleshooting

### Templates Not Saving
- Check server permissions
- Ensure message or embed content is provided
- Verify category is valid

### Analytics Not Updating
- Analytics update once per day
- Member joins/leaves update immediately
- Message counts update as messages are sent

### Welcome Messages Not Sending
- Verify bot has permission to send messages in selected channel
- Check that welcome system is enabled
- Ensure channel still exists
- Test messages work before enabling

### Auto-Role Not Working
- Bot needs "Manage Roles" permission
- Bot's role must be higher than auto-role in hierarchy
- Role must still exist on server

---

## Future Enhancements

Potential future additions:
- Embed builder UI for templates
- Scheduled templates
- Custom commands using templates
- More analytics charts (Recharts integration)
- Export analytics as CSV
- Reaction roles
- Ticket system
- Custom commands
- Multi-language support

---

## API Documentation

Full API documentation available at:
- Templates: `/routes/templates.js`
- Analytics: `/routes/analytics.js`
- Welcome: `/routes/welcomeSettings.js`

All endpoints require authentication via session cookies.

---

## Support

For issues or questions:
1. Check server logs: `tail -f server.log`
2. Review error messages
3. Test in development environment first
4. Check Discord bot permissions

---

## Credits

Developed as part of Kira Discord Bot enhancement project.

**Version**: 2.0.0
**Date**: January 2026
**Author**: Claude AI Assistant
