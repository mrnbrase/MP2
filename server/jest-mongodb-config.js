module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '6.0.12', // Specify a MongoDB version
      skipMD5: true,
    },
    instance: {
      dbName: 'jest', // Default DB name for tests
    },
    autoStart: false, // Set to false if you want to start it manually
  },
};
