require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const { Strategy: DiscordStrategy } = require('passport-discord');
const session = require('express-session');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const sequelize = require('./app/config/database');
const User = require('./app/models/user');
const License = require('./app/models/license');
const ServerSettings = require('./app/models/serverSettings');
const BotSettings = require('./app/models/botSettings');
const { ensureAuthenticated } = require('./middlewares/auth');
const { logger, logError } = require('./logger');
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for React dev
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - update with your frontend URL
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());

sequelize.sync().then(() => {
  logger.info('Database synchronized');
}).catch(error => logError('Database synchronization error', error));

const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

bot.once('ready', () => {
  logger.info(`Logged in as ${bot.user.tag}`);
});

bot.login(process.env.DISCORD_BOT_TOKEN).catch(error => logError('Bot login error', error));

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Handle username (discriminator is deprecated in Discord API)
    const username = profile.discriminator && profile.discriminator !== '0'
      ? `${profile.username}#${profile.discriminator}`
      : profile.username;

    const [user, created] = await User.findOrCreate({
      where: { id: profile.id },
      defaults: {
        username: username,
        isAdmin: false,
      },
    });

    // Update username if changed
    if (user.username !== username) {
      await user.update({ username });
    }

    profile.accessToken = accessToken;
    profile.isAdmin = user.isAdmin;

    logger.info(`User ${created ? 'created' : 'logged in'}: ${username}`);
    return done(null, profile);
  } catch (error) {
    logError('Error in Discord Strategy', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/');
});

app.get('/auth/check', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, username: req.user.username });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.get('/protected', ensureAuthenticated, (req, res) => {
  res.send('You are authenticated');
});

axiosRetry(axios, {
  retries: 3,
  retryCondition: (error) => {
    return error.response && error.response.status === 429;
  },
  retryDelay: (retryCount, error) => {
    const retryAfter = error.response ? error.response.headers['retry-after'] : null;
    return retryAfter ? retryAfter * 1000 : axiosRetry.exponentialDelay(retryCount);
  },
});

const messageRoutes = require('./routes/messages');
const roleRoutes = require('./routes/roles');
const memberRoutes = require('./routes/members');
const channelRoutes = require('./routes/channels');
const serverSettingsRoutes = require('./routes/serverSettings');
const botSettingsRoutes = require('./routes/botSettings');
const licensesRoutes = require('./routes/licenses');
const serversRoutes = require('./routes/servers');

app.use('/api/server/:id/message', messageRoutes(bot));
app.use('/api/server/:id/roles', roleRoutes(bot));
app.use('/api/server/:id/members', memberRoutes(bot));
app.use('/api/server/:id/channels', channelRoutes(bot));
app.use('/api/servers', serversRoutes(bot));
app.use('/api/licenses', licensesRoutes);
app.use('/api/server/:id/serversettings', serverSettingsRoutes(bot));
app.use('/api/server/:id/botsettings', botSettingsRoutes(bot));

app.use(express.static(path.join(__dirname, 'panel/build')));

// Error handling middleware
app.use((err, req, res, next) => {
  logError('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'panel/build/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});