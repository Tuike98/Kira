const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Zakładam, że masz plik konfiguracyjny do połączenia z bazą danych

const License = sequelize.define('License', {
  license_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  serverId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

module.exports = License;