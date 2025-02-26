const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("VotingSystem", (m) => {
  const VotingSystem = m.contract("VotingSystem", [
    ["Apple", "Banana", "Orange"],
  ]);

  return { VotingSystem };
});
