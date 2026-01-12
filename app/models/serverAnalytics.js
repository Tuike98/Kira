const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServerAnalytics = sequelize.define('ServerAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serverId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  memberCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  messagesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  joinCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  leaveCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  activeUsers: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Array of user IDs who were active
  },
  topChannels: {
    type: DataTypes.JSON,
    defaultValue: {},
    // { channelId: messageCount }
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['serverId', 'date'], unique: true },
    { fields: ['date'] },
  ],
});

module.exports = ServerAnalytics;
