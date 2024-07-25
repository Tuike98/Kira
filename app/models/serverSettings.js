const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class ServerSettings extends Model {}

ServerSettings.init({
  serverId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  welcomeMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  autoRole: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'ServerSettings'
});

module.exports = ServerSettings;