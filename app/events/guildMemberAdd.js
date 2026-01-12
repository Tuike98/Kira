const { EmbedBuilder } = require('discord.js');
const WelcomeSettings = require('../models/welcomeSettings');
const ServerAnalytics = require('../models/serverAnalytics');
const { logger, logError } = require('../../logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const serverId = member.guild.id;

      // Update analytics
      await updateAnalytics(serverId, 'join');

      // Get welcome settings
      const settings = await WelcomeSettings.findOne({
        where: { serverId },
      });

      if (!settings) {
        logger.info(`No welcome settings for server ${serverId}`);
        return;
      }

      // Auto-role
      if (settings.autoRoleId) {
        try {
          const role = member.guild.roles.cache.get(settings.autoRoleId);
          if (role) {
            await member.roles.add(role);
            logger.info(`Added auto-role ${role.name} to ${member.user.tag}`);
          }
        } catch (error) {
          logError('Error adding auto-role', error);
        }
      }

      // Welcome message in channel
      if (settings.welcomeEnabled && settings.welcomeChannelId && settings.welcomeMessage) {
        try {
          const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
          if (channel) {
            const messageData = processWelcomeVariables(settings.welcomeMessage, {
              userTag: member.user.tag,
              userMention: `<@${member.id}>`,
              serverName: member.guild.name,
              memberCount: member.guild.memberCount,
              userAvatar: member.user.displayAvatarURL(),
            });

            const messageOptions = {};

            if (messageData.message) {
              messageOptions.content = messageData.message;
            }

            if (messageData.embed) {
              const embed = new EmbedBuilder()
                .setTitle(messageData.embed.title || null)
                .setDescription(messageData.embed.description || null)
                .setColor(messageData.embed.color || '#00ff00');

              if (messageData.embed.footer) {
                embed.setFooter({ text: messageData.embed.footer });
              }

              if (messageData.embed.thumbnail === '{{user.avatar}}') {
                embed.setThumbnail(member.user.displayAvatarURL());
              }

              messageOptions.embeds = [embed];
            }

            await channel.send(messageOptions);
            logger.info(`Sent welcome message for ${member.user.tag} in ${member.guild.name}`);
          }
        } catch (error) {
          logError('Error sending welcome message', error);
        }
      }

      // DM new member
      if (settings.dmNewMembers && settings.dmMessage) {
        try {
          const processedDM = settings.dmMessage
            .replace(/\{\{user\}\}/g, member.user.tag)
            .replace(/\{\{server\}\}/g, member.guild.name)
            .replace(/\{\{memberCount\}\}/g, member.guild.memberCount);

          await member.send(processedDM);
          logger.info(`Sent DM welcome message to ${member.user.tag}`);
        } catch (error) {
          logError('Error sending DM welcome message', error);
        }
      }
    } catch (error) {
      logError('Error in guildMemberAdd event', error);
    }
  },
};

async function updateAnalytics(serverId, type) {
  try {
    const today = new Date().toISOString().split('T')[0];

    let analytics = await ServerAnalytics.findOne({
      where: { serverId, date: today },
    });

    if (!analytics) {
      analytics = await ServerAnalytics.create({
        serverId,
        date: today,
        joinCount: type === 'join' ? 1 : 0,
        leaveCount: type === 'leave' ? 1 : 0,
      });
    } else {
      await analytics.increment(type === 'join' ? 'joinCount' : 'leaveCount');
    }
  } catch (error) {
    logError('Error updating analytics', error);
  }
}

function processWelcomeVariables(content, variables) {
  const processed = JSON.parse(JSON.stringify(content));

  const replacements = {
    '{{user}}': variables.userTag,
    '{{user.mention}}': variables.userMention,
    '{{server}}': variables.serverName,
    '{{memberCount}}': variables.memberCount,
    '{{user.avatar}}': variables.userAvatar,
  };

  if (processed.message) {
    Object.entries(replacements).forEach(([key, value]) => {
      processed.message = processed.message.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
  }

  if (processed.embed) {
    ['title', 'description', 'footer', 'thumbnail'].forEach(field => {
      if (processed.embed[field]) {
        Object.entries(replacements).forEach(([key, value]) => {
          processed.embed[field] = processed.embed[field].replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      }
    });
  }

  return processed;
}
