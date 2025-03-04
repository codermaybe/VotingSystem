const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingSystem", (m) => {
  const VotingSystem = m.contract("VotingSystem2", []);
  return { VotingSystem };
});
