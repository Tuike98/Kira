const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MessageTemplate = sequelize.define('MessageTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  serverId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('welcome', 'rules', 'events', 'announcements', 'other'),
    defaultValue: 'other',
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false,
    // Structure: { message: "...", embed: { title, description, color, footer } }
  },
  variables: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Available variables like ["{{server.name}}", "{{user.mention}}"]
  },
  usageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastUsed: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['serverId'] },
    { fields: ['category'] },
  ],
});

module.exports = MessageTemplate;
