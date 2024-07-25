const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BotSettings = sequelize.define('BotSettings', {
  serverId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  prefix: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Add more settings fields as needed
}, {
  tableName: 'bot_settings'
});

module.exports = BotSettings;