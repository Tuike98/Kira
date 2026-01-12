const { EmbedBuilder } = require('discord.js');
const WelcomeSettings = require('../models/welcomeSettings');
const ServerAnalytics = require('../models/serverAnalytics');
const { logger, logError } = require('../../logger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const serverId = member.guild.id;

      // Update analytics
      await updateAnalytics(serverId);

      // Get welcome settings
      const settings = await WelcomeSettings.findOne({
        where: { serverId },
      });

      if (!settings || !settings.goodbyeEnabled) {
        return;
      }

      // Goodbye message in channel
      if (settings.goodbyeChannelId && settings.goodbyeMessage) {
        try {
          const channel = member.guild.channels.cache.get(settings.goodbyeChannelId);
          if (channel) {
            const messageData = processGoodbyeVariables(settings.goodbyeMessage, {
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
                .setColor(messageData.embed.color || '#ff0000');

              if (messageData.embed.footer) {
                embed.setFooter({ text: messageData.embed.footer });
              }

              if (messageData.embed.thumbnail === '{{user.avatar}}') {
                embed.setThumbnail(member.user.displayAvatarURL());
              }

              messageOptions.embeds = [embed];
            }

            await channel.send(messageOptions);
            logger.info(`Sent goodbye message for ${member.user.tag} in ${member.guild.name}`);
          }
        } catch (error) {
          logError('Error sending goodbye message', error);
        }
      }
    } catch (error) {
      logError('Error in guildMemberRemove event', error);
    }
  },
};

async function updateAnalytics(serverId) {
  try {
    const today = new Date().toISOString().split('T')[0];

    let analytics = await ServerAnalytics.findOne({
      where: { serverId, date: today },
    });

    if (!analytics) {
      analytics = await ServerAnalytics.create({
        serverId,
        date: today,
        leaveCount: 1,
      });
    } else {
      await analytics.increment('leaveCount');
    }
  } catch (error) {
    logError('Error updating analytics', error);
  }
}

function processGoodbyeVariables(content, variables) {
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
