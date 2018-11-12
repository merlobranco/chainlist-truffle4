module.exports = {
     // See <http://truffleframework.com/docs/advanced/configuration>
     // to customize your Truffle configuration!
     networks: {
          ganache: {
               host: "localhost",
               port: 7545,
               network_id: "*" // Match any network id
          },
          chainskills: { // Values stored in the ''.\ChainSkills\private\startnode.cmd' file
               host: "localhost",
               port: 8545,
               network_id: "4224",
               gas: 4700000,
               // from: '0x569d6b15486287048dc7b9d11308cbbedff91799'
          }
     }
};
