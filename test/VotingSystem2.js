const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem2", function () {
  let VotingSystem2;
  let vs2;
  let admin;
  let user1, user2, user3;

  beforeEach(async function () {
    //!仅在hardhat中使用
    VotingSystem2 = await ethers.getContractFactory("VotingSystem2");
    [admin, user1, user2, user3] = await ethers.getSigners();

    vs2 = await VotingSystem2.deploy();
    await vs2.waitForDeployment();
  });

  describe("管理员功能", function () {
    it("应该在部署时正确设置管理员", async function () {
      expect(await vs2.admin()).to.equal(admin.address);
    });

    it("应该允许管理员转移管理员权限", async function () {
      await vs2.transferAdmin(user1.address);
      expect(await vs2.admin()).to.equal(user1.address);
    });

    it("应该拒绝非管理员尝试转移管理员权限", async function () {
      await expect(
        vs2.connect(user1).transferAdmin(user2.address)
      ).to.be.revertedWith("仅管理员可调用");
    });

    it("应该拒绝将新管理员地址设置为零地址", async function () {
      await expect(
        vs2.transferAdmin("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("新管理员地址不能为零地址");
    });
  });

  describe("项目管理", function () {
    it("应该允许任何人创建新的投票项目", async function () {
      await vs2.createVoteProject("测试项目", ["选项A", "选项B"], 1);
      expect(await vs2.getProjectCount()).to.equal(1);
    });

    it("应该拒绝项目名称为空的情况", async function () {
      await expect(
        vs2.createVoteProject("", ["选项A", "选项B"], 1)
      ).to.be.revertedWith("项目名称不能为空");
    });

    it("应该拒绝选项数量少于2或超过255的情况", async function () {
      await expect(
        vs2.createVoteProject("测试项目", ["选项A"], 1)
      ).to.be.revertedWith("投票选项数数量必须在2到255之间");

      const manyOptions = Array(256).fill("选项");
      await expect(
        vs2.createVoteProject("测试项目", manyOptions, 1)
      ).to.be.revertedWith("投票选项数数量必须在2到255之间");
    });

    it("应该允许管理员删除项目", async function () {
      const projectName1 = "测试项目由用户创建管理删除";
      await vs2
        .connect(user1)
        .createVoteProject(projectName1, ["选项A", "选项B"], 1);
      await vs2.deleteProject(projectName1);
      expect(await vs2.getProjectCount()).to.equal(0); //需满足两次创建两次删除后项目数为0
    });
    it("应该允许创建者删除项目", async function () {
      const projectName1 = "测试项目由用户创建用户删除";
      await vs2
        .connect(user1)
        .createVoteProject(projectName1, ["选项A", "选项B"], 1);
      await vs2.connect(user1).deleteProject(projectName1);
      const projectName2 = "测试项目由用户创建管理员删除";
      await vs2
        .connect(user1)
        .createVoteProject(projectName2, ["选项A", "选项B"], 1);
      await vs2.deleteProject(projectName2);
      expect(await vs2.getProjectCount()).to.equal(0); //需满足两次创建两次删除后项目数为0
    });

    it("应该拒绝非管理员或非创建者尝试删除项目", async function () {
      const projectName = "测试项目";
      await vs2
        .connect(user1)
        .createVoteProject(projectName, ["选项A", "选项B"], 1);

      await expect(
        vs2.connect(user2).deleteProject(projectName)
      ).to.be.revertedWith("仅管理员或项目创建者可调用");
    });

    it("应该允许管理员更改项目状态", async function () {
      const projectName = "测试项目";
      await vs2
        .connect(user1)
        .createVoteProject(projectName, ["选项A", "选项B"], 1);

      await vs2.connect(admin).setProjectStatus(projectName, false);
      const project = await vs2.voteProjects(projectName);
      expect(project.isActive).to.be.false;
    });

    it("应该允许创建者更改项目状态", async function () {
      const projectName = "测试项目";
      await vs2
        .connect(user1)
        .createVoteProject(projectName, ["选项A", "选项B"], 1);

      await vs2.connect(user1).setProjectStatus(projectName, false);
      const project = await vs2.voteProjects(projectName);
      expect(project.isActive).to.be.false;
    });
  });

  describe("投票功能", function () {
    let projectName;
    beforeEach(async function () {
      projectName = "测试项目";
      await vs2.createVoteProject(projectName, ["选项A", "选项B"], 1);
    });

    it("应该允许用户投票", async function () {
      await vs2.connect(user1).vote(projectName, 1);
      const options = await vs2.getCurrentVoteResult(projectName);

      expect(options[1].voteCount).to.be.equal(1);
    });

    it("应该拒绝用户在投票结束后投票", async function () {
      await vs2.connect(admin).setProjectStatus(projectName, false);
      await expect(vs2.connect(user1).vote(projectName, 0)).to.be.revertedWith(
        "投票已结束或暂停"
      );
    });

    it("应该拒绝用户在投票时间结束后投票", async function () {
      // 快进时间到投票结束之后
      await ethers.provider.send("evm_increaseTime", [60]); // 增加60秒
      await ethers.provider.send("evm_mine"); // 挖出一个区块

      await expect(vs2.connect(user1).vote(projectName, 0)).to.be.revertedWith(
        "投票时间已结束"
      );
    });

    it("应该拒绝用户重复投票", async function () {
      await vs2.connect(user1).vote(projectName, 0);
      await expect(vs2.connect(user1).vote(projectName, 0)).to.be.revertedWith(
        "您已经投票过了"
      );
    });

    it("应该返回正确的投票结果", async function () {
      await vs2.connect(user1).vote(projectName, 0);
      await vs2.connect(user2).vote(projectName, 1);

      const results = await vs2.getCurrentVoteResult(projectName);
      expect(results[0].voteCount).to.equal(1);
      expect(results[1].voteCount).to.equal(1);
    });

    it("应该返回投票赢家", async function () {
      await vs2.connect(user1).vote(projectName, 0);
      await vs2.connect(user2).vote(projectName, 0);
      await vs2.connect(user3).vote(projectName, 1);
      await vs2.setProjectStatus(projectName, false); //管理员结束投票公布结果
      const winner = await vs2.getFinalVoteWinner(projectName);
      expect(winner.name).to.equal("选项A");
    });
  });
});
