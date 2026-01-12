const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');
const ServerAnalytics = require('../app/models/serverAnalytics');
const { logger, logError } = require('../logger');
const { Op } = require('sequelize');

module.exports = (bot) => {
  // Get member analytics
  router.get('/:serverId/members', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = await ServerAnalytics.findAll({
        where: {
          serverId,
          date: {
            [Op.gte]: startDate.toISOString().split('T')[0],
          },
        },
        order: [['date', 'ASC']],
      });

      // Get current guild data
      const guild = await bot.guilds.fetch(serverId);
      const currentStats = {
        memberCount: guild.memberCount,
        onlineCount: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
        botsCount: guild.members.cache.filter(m => m.user.bot).size,
      };

      // Calculate growth
      const growth = analytics.length > 0
        ? guild.memberCount - analytics[0].memberCount
        : 0;

      logger.info(`Fetched member analytics for server ${serverId}`);
      res.json({
        analytics,
        currentStats,
        growth,
      });
    } catch (error) {
      logError('Error fetching member analytics', error);
      res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Get message analytics
  router.get('/:serverId/messages', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = await ServerAnalytics.findAll({
        where: {
          serverId,
          date: {
            [Op.gte]: startDate.toISOString().split('T')[0],
          },
        },
        order: [['date', 'ASC']],
      });

      // Calculate top channels
      const topChannelsMap = {};
      analytics.forEach(day => {
        if (day.topChannels) {
          Object.entries(day.topChannels).forEach(([channelId, count]) => {
            topChannelsMap[channelId] = (topChannelsMap[channelId] || 0) + count;
          });
        }
      });

      // Get channel names
      const guild = await bot.guilds.fetch(serverId);
      const topChannels = Object.entries(topChannelsMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([channelId, count]) => {
          const channel = guild.channels.cache.get(channelId);
          return {
            id: channelId,
            name: channel?.name || 'Unknown Channel',
            count,
          };
        });

      const totalMessages = analytics.reduce((sum, day) => sum + (day.messagesCount || 0), 0);

      logger.info(`Fetched message analytics for server ${serverId}`);
      res.json({
        analytics,
        topChannels,
        totalMessages,
      });
    } catch (error) {
      logError('Error fetching message analytics', error);
      res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Get activity analytics
  router.get('/:serverId/activity', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const analytics = await ServerAnalytics.findAll({
        where: {
          serverId,
          date: {
            [Op.gte]: startDate.toISOString().split('T')[0],
          },
        },
        order: [['date', 'ASC']],
      });

      // Calculate most active users
      const activeUsersMap = {};
      analytics.forEach(day => {
        if (day.activeUsers && Array.isArray(day.activeUsers)) {
          day.activeUsers.forEach(userId => {
            activeUsersMap[userId] = (activeUsersMap[userId] || 0) + 1;
          });
        }
      });

      // Get user details
      const guild = await bot.guilds.fetch(serverId);
      const topUsers = Object.entries(activeUsersMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId, days]) => {
          const member = guild.members.cache.get(userId);
          return {
            id: userId,
            username: member?.user.username || 'Unknown User',
            avatar: member?.user.displayAvatarURL() || null,
            activeDays: days,
          };
        });

      const totalJoins = analytics.reduce((sum, day) => sum + (day.joinCount || 0), 0);
      const totalLeaves = analytics.reduce((sum, day) => sum + (day.leaveCount || 0), 0);

      logger.info(`Fetched activity analytics for server ${serverId}`);
      res.json({
        analytics,
        topUsers,
        totalJoins,
        totalLeaves,
        netGrowth: totalJoins - totalLeaves,
      });
    } catch (error) {
      logError('Error fetching activity analytics', error);
      res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
    }
  });

  // Get dashboard summary
  router.get('/:serverId/summary', ensureAuthenticated, async (req, res) => {
    try {
      const { serverId } = req.params;

      const guild = await bot.guilds.fetch(serverId);
      if (!guild) {
        return res.status(404).json({ error: 'Server not found' });
      }

      // Get today's analytics
      const today = new Date().toISOString().split('T')[0];
      const todayAnalytics = await ServerAnalytics.findOne({
        where: { serverId, date: today },
      });

      // Get yesterday's for comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayAnalytics = await ServerAnalytics.findOne({
        where: { serverId, date: yesterday.toISOString().split('T')[0] },
      });

      const summary = {
        serverName: guild.name,
        serverIcon: guild.iconURL(),
        memberCount: guild.memberCount,
        onlineCount: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
        channelCount: guild.channels.cache.size,
        roleCount: guild.roles.cache.size,
        todayMessages: todayAnalytics?.messagesCount || 0,
        todayJoins: todayAnalytics?.joinCount || 0,
        todayLeaves: todayAnalytics?.leaveCount || 0,
        yesterdayComparison: {
          messages: yesterdayAnalytics ? (todayAnalytics?.messagesCount || 0) - yesterdayAnalytics.messagesCount : 0,
          members: yesterdayAnalytics ? guild.memberCount - yesterdayAnalytics.memberCount : 0,
        },
      };

      logger.info(`Fetched summary for server ${serverId}`);
      res.json(summary);
    } catch (error) {
      logError('Error fetching summary', error);
      res.status(500).json({ error: 'Failed to fetch summary', message: error.message });
    }
  });

  return router;
};
