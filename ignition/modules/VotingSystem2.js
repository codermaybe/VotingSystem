const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingSystem2", (m) => {
  const VotingSystem2 = m.contract("VotingSystem2", []);
  return { VotingSystem2 };
});
