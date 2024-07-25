require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { Client, GatewayIntentBits } = require('discord.js');
const bodyParser = require('body-parser');
const multer = require('multer'); // For file uploads
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.login(process.env.BOT_TOKEN).catch(err => {
  console.error("Error logging in to Discord:", err);
  process.exit(1);
});

client.once('ready', () => {
  console.log('Discord client is ready!');
});


// Database setup
const dbPath = path.join(__dirname, 'database', 'database.sqlite');

const desiredColumns = [
  { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
  { name: 'key', type: 'TEXT UNIQUE' },
  { name: 'guildId', type: 'TEXT' },
  { name: 'expirationDate', type: 'TEXT' },
];

const guildProperties = {
  name: 'name',
  iconUrl: 'iconURL',
  id: 'id',
};

const serverProperties = {
  ...guildProperties,
  admin: 'admin',
  added: 'added',
  licenseExpiration: 'licenseExpiration',
};

const migrateDatabase = async (db) => {
  const existingColumns = await db.all(`PRAGMA table_info('licenses')`);
  const existingColumnNames = existingColumns.map(col => col.name);

  const promises = desiredColumns.map(async (column) => {
    if (!existingColumnNames.includes(column.name)) {
      await db.exec(`ALTER TABLE licenses ADD COLUMN ${column.name} ${column.type}`);
      console.log(`Added column ${column.name} to licenses table`);
    }
  });

  await Promise.all(promises);
};

// Dodaj poniższe linie na początku, przed initializeDatabase
const ensureDatabasePath = () => {
  const dir = path.dirname(dbPath);
  if (!require('fs').existsSync(dir)) {
    require('fs').mkdirSync(dir, { recursive: true });
  }
};

ensureDatabasePath();

const initializeDatabase = async () => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await migrateDatabase(db);

    console.log('Database initialized');

    return db;
  } catch (error) {
    console.error('Error initializing database', error);
    throw new Error('Database initialization failed');
  }
};

let db;
initializeDatabase()
  .then(database => {
    db = database;
  })
  .catch(err => {
    console.error('Error initializing database', err);
    process.exit(1);
  });

// Helper functions
const getUserLicenseDays = () => 30;

const getUserServers = async (accessToken) => {
  try {
    const userGuilds = client.guilds.cache;

    const licenses = await db.all('SELECT * FROM licenses');
    const licenseMap = new Map(licenses.map(license => [license.guildId, license.expirationDate]));

const getUserServers = async (userGuilds) => {
  try {
    const userServers = Array.from(userGuilds.values()).map(guild => {
      try {
        const member = guild.members.cache.get(client.user.id);
        if (!member) {
          console.warn(`Member not found for guild ${guild.id}`);
          return null;
        }

        const channelsCount = guild.channels.cache.size;
        const membersCount = guild.memberCount;

        return {
          id: guild.id,
          name: guild.name,
          iconUrl: guild.iconURL() || 'https://cdn.discordapp.com/icons/guild_id/guild_icon.png',
          admin: member.permissions.has('ADMINISTRATOR'),
          added: true,
          licenseExpiration: licenseMap.get(guild.id) || 'Brak licencji',
          channelsCount,
          membersCount,
          roles: member.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
          })),
        };
      } catch (error) {
        console.error(`Error processing guild ${guild.id}:`, error.message);
        return null;
      }
    }).filter(server => server !== null);

    return userServers;
  } catch (error) {
    console.error('Error fetching user servers:', error.message);
    throw new Error('Failed to fetch user servers');
  }
};

const getGuildMembers = async (guildId) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch();
    return members.map(member => ({
      userId: member.user.id,
      username: member.user.username,
      tag: member.user.tag,
      avatar: member.user.displayAvatarURL(),
      displayName: member.displayName,
      joinedAt: member.joinedAt,
      roles: member.roles.cache.map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
      })),
      presence: member.presence ? member.presence.status : 'offline',
      isOwner: member.id === guild.ownerId,
    }));
  } catch (error) {
    console.error('Error fetching guild members:', error.message);
    throw new Error('Failed to fetch guild members');
  }
};


    const getGuildRoles = async (guildId) => {
      try {
        const guild = await client.guilds.fetch(guildId);
        const roles = guild.roles.cache;

        const rolesDetailed = roles.map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          managed: role.managed,
          mentionable: role.mentionable,
          permissions: role.permissions.toArray(),
          membersCount: role.members.size
        }));

        return Array.from(rolesDetailed);
      } catch (error) {
        console.error('Error fetching guild roles:', error.message);
        throw new Error('Failed to fetch guild roles');
      }
    };

const getGuildChannels = async (guildId) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = guild.channels.cache;

    const channelDetails = Array.from(channels.values()).map(channel => {
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position,
        parentId: channel.parentId,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        userLimit: channel.userLimit || null,
        bitrate: channel.bitrate || null,
        rateLimitPerUser: channel.rateLimitPerUser || null
      };
    });

    // Optional: Sort channels by their position
    channelDetails.sort((a, b) => a.position - b.position);

    return channelDetails;
  } catch (error) {
    console.error('Error fetching guild channels:', error.message);
    throw new Error('Failed to fetch guild channels');
  }
};

const getRolePermissions = async (guildId, roleId) => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(roleId);
    if (!role) throw new Error('Role not found');

    const membersWithRole = role.members.map(member => ({
      id: member.user.id,
      username: member.user.username,
      tag: member.user.tag,
      displayName: member.displayName
    }));

    return {
      id: role.id,
      name: role.name,
      color: role.hexColor,
      hoist: role.hoist,
      managed: role.managed,
      mentionable: role.mentionable,
      permissions: role.permissions.toArray(),
      members: membersWithRole
    };
  } catch (error) {
    console.error('Error fetching role permissions:', error.message);
    throw new Error('Failed to fetch role permissions');
  }
};

// Passport setup
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'guilds', 'guilds.members.read']
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'super secret key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/discord');
};

// Routes
app.get('/', (req, res) => {
  const licenseDays = getUserLicenseDays();
  res.render('index', { user: req.user, licenseDays });
});

app.get('/servers', isLoggedIn, async (req, res) => {
  try {
    const userServers = await getUserServers(req.user.accessToken);
    const licenseDays = getUserLicenseDays();
    res.render('servers', { user: req.user, servers: userServers, licenseDays });
  } catch (error) {
    console.error('Error fetching servers:', error);
    res.status(500).send('Error fetching servers');
  }
});

// W `app.get('/license')`, około linia 217
app.get('/license', isLoggedIn, async (req, res) => {
  try {
    const userServers = await getUserServers(req.user.accessToken);
    const licensedServers = userServers.filter(server => server[serverProperties.licenseExpiration] && server[serverProperties.licenseExpiration] !== 'Brak licencji');
    const licenseDays = getUserLicenseDays();
    res.render('license', { user: req.user, licenseDays, licensedServers });
  } catch (error) {
    console.error('Error fetching license info:', error);
    res.status(500).send('Error fetching license info');
  }
});

app.get('/license/add', isLoggedIn, async (req, res) => {
  try {
    const userServers = await getUserServers(req.user.accessToken);
    res.render('add-license', { user: req.user, servers: userServers });
  } catch (error) {
    console.error('Error fetching user servers:', error);
    res.status(500).send('Error fetching user servers');
  }
});

app.post('/license/add', isLoggedIn, async (req, res) => {
  const { licenseKey, guildId } = req.body;

  const existingLicense = await db.get('SELECT * FROM licenses WHERE key = ? AND guildId = ?', [licenseKey, guildId]);
  if (existingLicense) {
    return res.status(400).send('Klucz licencyjny jest już używany dla tego serwera.');
  }

  try {
    await db.run('INSERT INTO licenses (key, guildId, expirationDate) VALUES (?, ?, ?)', [licenseKey, guildId, new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]);
    res.redirect('/license');
  } catch (error) {
    console.error('Błąd podczas dodawania klucza licencyjnego', error);
    res.status(500).send('Wystąpił błąd podczas dodawania klucza licencyjnego.');
  }
});

// Define the route for dashboard
app.get('/dashboard/:guildId', isLoggedIn, async (req, res) => {
  try {
    const guildId = req.params.guildId;
    const userServers = await getUserServers(req.user.accessToken);

    const server = userServers.find(server => server.id === guildId);
    if (!server) {
      return res.status(404).send('Server not found.');
    }

    const users = await getGuildMembers(guildId);
    const roles = await getGuildRoles(guildId);
    const channels = await getGuildChannels(guildId);
    const customCommands = await db.all('SELECT * FROM commands WHERE guildId = ?', [guildId]);
    const auditLogs = await db.all('SELECT * FROM audit_logs WHERE guildId = ?', [guildId]);
    const events = await db.all('SELECT * FROM events WHERE guildId = ?', [guildId]);
    const modLogs = await db.all('SELECT * FROM moderation_logs WHERE guildId = ?', [guildId]);
    const polls = await db.all('SELECT * FROM polls WHERE guildId = ?', [guildId]);
    const giveaways = await db.all('SELECT * FROM giveaways WHERE guildId = ?', [guildId]);
    const warnings = await db.all('SELECT * FROM warnings WHERE guildId = ?', [guildId]);
    const tickets = await db.all('SELECT * FROM tickets WHERE guildId = ?', [guildId]);
    const categories = await db.all('SELECT * FROM categories WHERE guildId = ?', [guildId]);
    const emojis = await db.all('SELECT * FROM emojis WHERE guildId = ?', [guildId]);
    const botConfig = await db.get('SELECT * FROM bot_config WHERE guildId = ?', [guildId]);
    const boosters = await db.all('SELECT * FROM boosters WHERE guildId = ?', [guildId]);
    const serverStats = {
      totalMembers: users.length,
      onlineMembers: users.filter(user => user.presence?.status === 'online').length,
      textChannels: channels.filter(channel => channel.type === 'text').length,
      voiceChannels: channels.filter(channel => channel.type === 'voice').length,
    };
    const autoModSettings = await db.get('SELECT settings FROM automod_settings WHERE guildId = ?', [guildId]);

    // Fetch permissions for each role
    const permissions = await Promise.all(
      roles.map(async (role) => {
        const rolePermissions = await getRolePermissions(guildId, role.id);
        return {
          roleId: role.id,
          permissions: rolePermissions
        };
      })
    );

    res.render('dashboard', {
      user: req.user,
      server,
      users,
      roles,
      channels,
      permissions,
      customCommands,
      auditLogs,
      events,
      modLogs,
      polls,
      giveaways,
      warnings,
      tickets,
      categories,
      emojis,
      botConfig: botConfig || { prefix: '' },
      boosters,
      serverStats,
      autoModSettings: autoModSettings?.settings || ''
    });
  } catch (error) {
    console.error('Error fetching server details:', error.message);
    res.status(500).send('Error fetching server details');
  }
});


app.post('/dashboard/:guildId/settings', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { serverName, serverIcon } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.setName(serverName);
    await guild.setIcon(serverIcon);

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error updating server settings:', error.message);
    res.status(500).send('Error updating server settings');
  }
});

// Custom commands management
    app.post('/dashboard/:guildId/commands', isLoggedIn, async (req, res) => {
      const guildId = req.params.guildId;
      const { commandName, commandResponse, commandId, action } = req.body;

      try {
        // Walidacja danych wejściowych
        if (!commandName || !commandResponse) {
          return res.status(400).send('Command name and response are required.');
        }

        if (action === 'add') {
          // Dodawanie nowej komendy
          await db.run(
            'INSERT INTO commands (guildId, name, response) VALUES (?, ?, ?)', 
            [guildId, commandName, commandResponse]
          );
        } else if (action === 'update' && commandId) {
          // Aktualizacja istniejącej komendy
          await db.run(
            'UPDATE commands SET name = ?, response = ? WHERE id = ? AND guildId = ?',
            [commandName, commandResponse, commandId, guildId]
          );
        } else if (action === 'delete' && commandId) {
          // Usuwanie komendy
          await db.run(
            'DELETE FROM commands WHERE id = ? AND guildId = ?',
            [commandId, guildId]
          );
        } else {
          return res.status(400).send('Invalid action or missing command ID.');
        }

        res.redirect(`/dashboard/${guildId}`);
      } catch (error) {
        console.error('Error handling custom command:', error.message);
        res.status(500).send('Error handling custom command');
      }
    });

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
// W funkcji welcome message, około linia 307
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// W funkcji leave message, około linia 319
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting leave message:', error.message);
    res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// Leave message
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('test', error.message); res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// Leave message
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting leave message:', error.message);
    res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// Leave message
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting leave message:', error.message);
    res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// Leave message
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting leave message:', error.message);
    res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});
// Server settings update
app.post('/dashboard/:guildId/settings', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { serverName, serverIcon } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.setName(serverName);
    await guild.setIcon(serverIcon);

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error updating server settings:', error.message);
    res.status(500).send('Error updating server settings');
  }
});

// Custom commands management
app.post('/dashboard/:guildId/commands', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { commandName, commandResponse } = req.body;

  try {
    await db.run('INSERT INTO commands (guildId, name, response) VALUES (?, ?, ?)', [guildId, commandName, commandResponse]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error adding custom command:', error.message);
    res.status(500).send('Error adding custom command');
  }
});

// File upload endpoint for custom welcome images
app.post('/dashboard/:guildId/welcomeimage', isLoggedIn, upload.single('welcomeImage'), async (req, res) => {
  const guildId = req.params.guildId;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const filePath = `/uploads/${file.filename}`;
    await db.run('INSERT INTO welcome_images (guildId, filePath) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET filePath=excluded.filePath', [guildId, filePath]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error uploading welcome image:', error.message);
    res.status(500).send('Error uploading welcome image.');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Event management
app.post('/dashboard/:guildId/events', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { eventName, eventDate } = req.body;

  try {
    await db.run('INSERT INTO events (guildId, name, date) VALUES (?, ?, ?)', [guildId, eventName, eventDate]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating event:', error.message);
    res.status(500).send('Error creating event');
  }
});

// Welcome message
app.post('/dashboard/:guildId/welcome', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { welcomeMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'welcome', welcomeMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting welcome message:', error.message);
    res.status(500).send('Error setting welcome message');
  }
});

// Leave message
app.post('/dashboard/:guildId/leave', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { leaveMessage } = req.body;

  try {
    await db.run('INSERT INTO messages (guildId, type, message) VALUES (?, ?, ?) ON CONFLICT(guildId, type) DO UPDATE SET message = excluded.message', [guildId, 'leave', leaveMessage]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting leave message:', error.message);
    res.status(500).send('Error setting leave message');
  }
});

// Auto role
app.post('/dashboard/:guildId/autorole', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { autoRole } = req.body;

  try {
    await db.run('INSERT INTO auto_roles (guildId, roleId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET roleId=excluded.roleId', [guildId, autoRole]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting auto role:', error.message);
    res.status(500).send('Error setting auto role');
  }
});

// Poll management
app.post('/dashboard/:guildId/polls', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { pollQuestion, pollOptions } = req.body;

  try {
    await db.run('INSERT INTO polls (guildId, question, options) VALUES (?, ?, ?)', [guildId, pollQuestion, pollOptions]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error creating poll:', error.message);
    res.status(500).send('Error creating poll');
  }
});

// Reaction roles management
app.post('/dashboard/:guildId/reactionroles', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { reactionMessageId, reactionRole } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(reactionRole);
    const channel = guild.channels.cache.find(ch => ch.messages.cache.has(reactionMessageId));
    const message = await channel.messages.fetch(reactionMessageId);

    if (!role || !channel || !message) {
      return res.status(400).send('Invalid role, channel, or message ID.');
    }

    message.react('👍'); // You can customize the emoji

    client.on('messageReactionAdd', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.add(role);
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (reaction.message.id === reactionMessageId && reaction.emoji.name === '👍') {
        const member = await guild.members.fetch(user.id);
        await member.roles.remove(role);
      }
    });

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting up reaction roles:', error.message);
    res.status(500).send('Error setting up reaction roles.');
  }
});

// Announcement channels
app.post('/dashboard/:guildId/announcements', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { announcementChannel } = req.body;

  try {
    await db.run('INSERT INTO announcementChannels (guildId, channelId) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId', [guildId, announcementChannel]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting announcement channel:', error.message);
    res.status(500).send('Error setting announcement channel');
  }
});

// Backup & Restore
app.post('/dashboard/:guildId/backup', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;

  try {
    // Logic for backing up the server configuration
    const backupData = await db.all('SELECT * FROM guild_data WHERE guildId = ?', [guildId]);
    const backupFilePath = path.join(__dirname, 'backups', `${guildId}_backup.json`);
    require('fs').writeFileSync(backupFilePath, JSON.stringify(backupData));
    res.download(backupFilePath);
  } catch (error) {
    console.error('Error creating backup:', error.message);
    res.status(500).send('Error creating backup');
  }
});

app.post('/dashboard/:guildId/restore', isLoggedIn, upload.single('backupFile'), async (req, res) => {
  const { guildId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const backupData = JSON.parse(require('fs').readFileSync(file.path, 'utf8'));
    await db.run('DELETE FROM guild_data WHERE guildId = ?', [guildId]);
    for (const entry of backupData) {
      await db.run('INSERT INTO guild_data (guildId, key, value) VALUES (?, ?, ?)', [guildId, entry.key, entry.value]);
    }
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error restoring backup:', error.message);
    res.status(500).send('Error restoring backup');
  }
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Bot Configuration Route
app.post('/dashboard/:guildId/config', isLoggedIn, upload.single('botAvatar'), async (req, res) => {
  const guildId = req.params.guildId;
  const { botPrefix, botName } = req.body;
  const botAvatar = req.file;

  try {
    // Update bot prefix and name in the database
    await db.run('INSERT INTO bot_config (guildId, prefix, name) VALUES (?, ?, ?) ON CONFLICT(guildId) DO UPDATE SET prefix=excluded.prefix, name=excluded.name', [guildId, botPrefix, botName]);

    // Update bot name
    if (botName) {
      await client.user.setUsername(botName);
    }

    // Update bot avatar
    if (botAvatar) {
      const avatarPath = path.join(__dirname, 'uploads', botAvatar.filename);
      const avatarData = fs.readFileSync(avatarPath);
      await client.user.setAvatar(avatarData);
      fs.unlinkSync(avatarPath); // remove the file after setting the avatar
    }

    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error saving bot configuration:', error.message);
    res.status(500).send('Error saving bot configuration');
  }
});


// Role Assignment
app.post('/dashboard/:guildId/roles', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { roleUser, roleAssign } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(roleUser);
    await member.roles.add(roleAssign);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error assigning role:', error.message);
    res.status(500).send('Error assigning role');
  }
});

// Custom Emojis
app.post('/dashboard/:guildId/emojis', isLoggedIn, upload.single('emojiFile'), async (req, res) => {
  const guildId = req.params.guildId;
  const { emojiName } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    await guild.emojis.create({ attachment: file.path, name: emojiName });
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error uploading emoji:', error.message);
    res.status(500).send('Error uploading emoji');
  }
});

// Auto Moderation
app.post('/dashboard/:guildId/automod', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { modSettings } = req.body;

  try {
    await db.run('INSERT INTO automod_settings (guildId, settings) VALUES (?, ?) ON CONFLICT(guildId) DO UPDATE SET settings=excluded.settings', [guildId, modSettings]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error saving auto moderation settings:', error.message);
    res.status(500).send('Error saving auto moderation settings');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Audit Logs Management
app.post('/dashboard/:guildId/auditlogs', isLoggedIn, async (req, res) => {
  const { guildId } = req.params;
  const { auditLogChannel, logEvents } = req.body;

  try {
    // Insert or update audit log channel and events in the database
    await db.run('INSERT INTO audit_logs (guildId, channelId, events) VALUES (?, ?, ?) ON CONFLICT(guildId) DO UPDATE SET channelId = excluded.channelId, events = excluded.events', [guildId, auditLogChannel, logEvents]);
    res.redirect(`/dashboard/${guildId}`);
  } catch (error) {
    console.error('Error setting audit logs:', error.message);
    res.status(500).send('Error setting audit logs');
  }
});

// Function to log events
const logEvent = async (guildId, event) => {
  try {
    const { channelId, events } = await db.get('SELECT channelId, events FROM audit_logs WHERE guildId = ?', [guildId]);
    if (events.includes(event.type)) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        channel.send(`Audit Log: ${event.message}`);
      }
    }
  } catch (error) {
    console.error('Error logging event:', error.message);
  }
};



// Example usage of logEvent function
client.on('guildMemberAdd', member => {
  logEvent(member.guild.id, { type: 'GUILD_MEMBER_ADD', message: `${member.user.tag} joined the server.` });
});

client.on('guildMemberRemove', member => {
  logEvent(member.guild.id, { type: 'GUILD_MEMBER_REMOVE', message: `${member.user.tag} left the server.` });
});

// Other events can be logged similarly
client.on('messageDelete', message => {
  logEvent(message.guild.id, { type: 'MESSAGE_DELETE', message: `A message by ${message.author.tag} was deleted in ${message.channel.name}.` });
});

client.on('messageUpdate', (oldMessage, newMessage) => {
  logEvent(newMessage.guild.id, { type: 'MESSAGE_UPDATE', message: `A message by ${oldMessage.author.tag} was edited in ${oldMessage.channel.name}.` });
});

// Edit Role
    app.post('/dashboard/:guildId/roles/edit', isLoggedIn, async (req, res) => {
      const guildId = req.params.guildId;
      const { roleId, roleName, roleColor, rolePermissions, action } = req.body;

      try {
        const guild = await client.guilds.fetch(guildId);

        if (action === 'edit') {
          const role = await guild.roles.fetch(roleId);
          if (role) {
            await role.setName(roleName);
            await role.setColor(roleColor);
            await role.setPermissions(rolePermissions.split(','));
            res.redirect(`/dashboard/${guildId}`);
          } else {
            res.status(404).send('Role not found');
          }
        } else if (action === 'delete') {
          const role = await guild.roles.fetch(roleId);
          if (role) {
            await role.delete();
            res.redirect(`/dashboard/${guildId}`);
          } else {
            res.status(404).send('Role not found');
          }
        } else if (action === 'create') {
          await guild.roles.create({
            name: roleName,
            color: roleColor,
            permissions: rolePermissions.split(',')
          });
          res.redirect(`/dashboard/${guildId}`);
        } else {
          res.status(400).send('Invalid action');
        }
      } catch (error) {
        console.error('Error editing role:', error.message);
        res.status(500).send('Error editing role');
      }
    });

// Delete Role
app.post('/dashboard/:guildId/roles/delete', isLoggedIn, async (req, res) => {
  const guildId = req.params.guildId;
  const { roleId } = req.body;

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = await guild.roles.fetch(roleId);
    if (role) {
      await role.delete();
      res.redirect(`/dashboard/${guildId}`);
    } else {
      res.status(404).send('Role not found');
    }
  } catch (error) {
    console.error('Error deleting role:', error.message);
    res.status(500).send('Error deleting role');
  }
});


// Authentication routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Error during logout.');
    }
    res.redirect('/');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});