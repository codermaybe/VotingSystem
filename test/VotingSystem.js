const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("VotingSystem 合约测试", function () {
  // 定义一个可重用的部署函数
  async function deployVotingSystemFixture() {
    const options = ["Apple", "Banana", "Orange"];
    const [admin, voter1, voter2, nonAdmin] = await ethers.getSigners();
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    const votingSystem = await VotingSystem.deploy(options);
    await votingSystem.waitForDeployment();

    return { votingSystem, admin, voter1, voter2, nonAdmin, options };
  }

  // 测试初始化
  it("应该正确初始化投票选项和管理员", async function () {
    const { votingSystem, admin, options } = await loadFixture(
      deployVotingSystemFixture
    );
    expect(await votingSystem.admin()).to.equal(admin.address);
    expect(await votingSystem.canVoteStatus()).to.be.true;
    const voteBox = await votingSystem.getCurrentVoteResult();
    expect(voteBox.length).to.equal(options.length);
    expect(voteBox[0].name).to.equal("Apple");
    expect(voteBox[1].name).to.equal("Banana");
    expect(voteBox[2].name).to.equal("Orange");
    expect(voteBox[0].voteCount).to.equal(0);
  });

  // 测试投票功能
  it("应该允许用户投票并增加票数", async function () {
    const { votingSystem, voter1 } = await loadFixture(
      deployVotingSystemFixture
    );
    await votingSystem.connect(voter1).vote(1); // 投给 "Banana"
    const voteBox = await votingSystem.getCurrentVoteResult();
    expect(voteBox[1].voteCount).to.equal(BigInt(1)); // 显式转为 BigInt
    expect(await votingSystem.votedNameList(voter1.address)).to.be.true; // 检查映射
  });

  it("应该阻止重复投票", async function () {
    const { votingSystem, voter1 } = await loadFixture(
      deployVotingSystemFixture
    );
    await votingSystem.connect(voter1).vote(0);
    await expect(votingSystem.connect(voter1).vote(1)).to.be.revertedWith(
      "您已经投票过了"
    );
  });

  it("应该阻止无效选项的投票", async function () {
    const { votingSystem, voter1 } = await loadFixture(
      deployVotingSystemFixture
    );
    await expect(votingSystem.connect(voter1).vote(3)).to.be.revertedWith(
      "投票选项不存在"
    );
  });

  // 测试结束投票
  it("只有管理员能结束投票", async function () {
    const { votingSystem, admin, nonAdmin } = await loadFixture(
      deployVotingSystemFixture
    );
    await expect(votingSystem.connect(nonAdmin).stopVote()).to.be.revertedWith(
      "仅管理员可调用"
    );
    await votingSystem.connect(admin).stopVote();
    expect(await votingSystem.canVoteStatus()).to.be.false;
  });

  it("投票结束后不能继续投票", async function () {
    const { votingSystem, admin, voter1 } = await loadFixture(
      deployVotingSystemFixture
    );
    await votingSystem.connect(admin).stopVote();
    await expect(votingSystem.connect(voter1).vote(0)).to.be.revertedWith(
      "投票已结束"
    );
  });

  // 测试获胜者
  it("应该正确返回获胜者（同票数优先第一个）", async function () {
    const { votingSystem, admin, voter1, voter2 } = await loadFixture(
      deployVotingSystemFixture
    );
    await votingSystem.connect(voter1).vote(0); // Apple 得 1 票
    await votingSystem.connect(voter2).vote(1); // Banana 得 1 票
    await votingSystem.connect(admin).stopVote();
    const winner = await votingSystem.getFinalVoteWinner();
    expect(winner.name).to.equal("Apple"); // 同票数时，Apple（索引 0）胜出
    expect(winner.voteCount).to.equal(1);
  });

  it("投票未结束时不能查看获胜者", async function () {
    const { votingSystem } = await loadFixture(deployVotingSystemFixture);
    await expect(votingSystem.getFinalVoteWinner()).to.be.revertedWith(
      "投票尚未结束"
    );
  });

  // 测试无人投票的情况
  it("无人投票时返回第一个选项作为获胜者", async function () {
    const { votingSystem, admin } = await loadFixture(
      deployVotingSystemFixture
    );
    await votingSystem.connect(admin).stopVote();
    const winner = await votingSystem.getFinalVoteWinner();
    expect(winner.name).to.equal("Apple");
    expect(winner.voteCount).to.equal(0);
  });
});
