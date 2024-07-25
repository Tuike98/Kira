const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    util: require.resolve('util/'),
    os: require.resolve('os-browserify/browser')
  };
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ]);
  return config;
};