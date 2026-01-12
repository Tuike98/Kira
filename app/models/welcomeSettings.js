const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WelcomeSettings = sequelize.define('WelcomeSettings', {
  serverId: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  welcomeEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  welcomeChannelId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  welcomeMessage: {
    type: DataTypes.JSON,
    allowNull: true,
    // Structure: { message: "...", embed: { ... } }
  },
  goodbyeEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  goodbyeChannelId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  goodbyeMessage: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  dmNewMembers: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dmMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  autoRoleId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = WelcomeSettings;
