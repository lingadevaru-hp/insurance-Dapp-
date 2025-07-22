module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,     // Ganache GUI default port
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",  // Updated to modern Solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};