// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem2 {
    // 创建整个投票项目，设置管理员
    constructor() {
        admin = msg.sender;
    }

    //----------------管理员功能--------------------
    // 管理员记录
    address public admin;

    // 管理员权限修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, unicode"仅管理员可调用");
        _;
    }

    // 转移管理员权限
    function transferAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), unicode"新管理员地址不能为零地址");
        admin = newAdmin;
        emit AdminTransferred(msg.sender, newAdmin);
    }

    //-----------------投票项目结构----------------
    // 设置投票选项
    struct VoteOption {
        string name;
        uint256 voteCount;
    }

    // 投票项目结构
    struct VoteProject {
        string name;
        VoteOption[] options;
        mapping(address => bool) hasVoted;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
    }

    // 投票项目映射: 项目名称 => 项目结构
    mapping(string => VoteProject) public voteProjects;

    // 记录所有项目名称
    string[] public projectNames;

    // 事件
    event ProjectCreated(
        string projectName,
        uint256 numberOfOptions,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCast(string projectName, address voter, uint256 optionIndex);
    event ProjectStatusChanged(string projectName, bool isActive);
    event AdminTransferred(address oldAdmin, address newAdmin);

    //----------------项目管理功能--------------------
    // 创建新的投票项目
    function createVoteProject(
        string memory projectName,
        string[] memory optionNames,
        uint256 durationInMinutes
    ) public onlyAdmin {
        require(bytes(projectName).length > 0, unicode"项目名称不能为空");
        require(optionNames.length >= 2, unicode"至少需要两个投票选项");
        require(
            voteProjects[projectName].startTime == 0,
            unicode"该项目名称已存在"
        );

        VoteProject storage newProject = voteProjects[projectName];
        newProject.name = projectName;
        newProject.isActive = true;
        newProject.startTime = block.timestamp;
        newProject.endTime = block.timestamp + (durationInMinutes * 1 minutes);

        for (uint i = 0; i < optionNames.length; i++) {
            newProject.options.push(
                VoteOption({name: optionNames[i], voteCount: 0})
            );
        }

        projectNames.push(projectName);

        emit ProjectCreated(
            projectName,
            optionNames.length,
            newProject.startTime,
            newProject.endTime
        );
    }

    // 更改项目状态
    function setProjectStatus(
        string memory projectName,
        bool status
    ) public onlyAdmin {
        require(voteProjects[projectName].startTime > 0, unicode"项目不存在");
        voteProjects[projectName].isActive = status;
        emit ProjectStatusChanged(projectName, status);
    }

    // 获取项目的所有选项
    function getProjectOptions(
        string memory projectName
    ) public view returns (VoteOption[] memory) {
        require(voteProjects[projectName].startTime > 0, unicode"项目不存在");
        return voteProjects[projectName].options;
    }

    // 获取项目数量
    function getProjectCount() public view returns (uint256) {
        return projectNames.length;
    }

    //----------------投票功能--------------------
    // 投票
    function vote(string memory projectName, uint256 optionIndex) public {
        VoteProject storage project = voteProjects[projectName];

        require(project.startTime > 0, unicode"项目不存在");
        require(project.isActive, unicode"投票已结束或暂停");
        require(block.timestamp <= project.endTime, unicode"投票时间已结束");
        require(optionIndex < project.options.length, unicode"投票选项不存在");
        require(!project.hasVoted[msg.sender], unicode"您已经投票过了");

        project.hasVoted[msg.sender] = true;
        project.options[optionIndex].voteCount++;

        emit VoteCast(projectName, msg.sender, optionIndex);
    }

    // 获取投票状态
    function getVoteStatus(
        string memory projectName
    )
        public
        view
        returns (
            bool isActive,
            uint256 startTime,
            uint256 endTime,
            uint256 timeLeft,
            bool hasEnded
        )
    {
        VoteProject storage project = voteProjects[projectName];
        require(project.startTime > 0, unicode"项目不存在");

        isActive = project.isActive;
        startTime = project.startTime;
        endTime = project.endTime;

        if (block.timestamp < endTime) {
            timeLeft = endTime - block.timestamp;
            hasEnded = false;
        } else {
            timeLeft = 0;
            hasEnded = true;
        }
    }

    // 检查用户是否已投票
    function hasVoted(
        string memory projectName,
        address voter
    ) public view returns (bool) {
        require(voteProjects[projectName].startTime > 0, unicode"项目不存在");
        return voteProjects[projectName].hasVoted[voter];
    }

    // 获取当前投票结果
    function getCurrentVoteResult(
        string memory projectName
    ) public view returns (VoteOption[] memory) {
        require(voteProjects[projectName].startTime > 0, unicode"项目不存在");
        return voteProjects[projectName].options;
    }

    // 获取赢家，同票数优先报名者获胜
    function getFinalVoteWinner(
        string memory projectName
    ) public view returns (VoteOption memory) {
        VoteProject storage project = voteProjects[projectName];
        require(project.startTime > 0, unicode"项目不存在");
        require(
            block.timestamp > project.endTime || !project.isActive,
            unicode"投票尚未结束"
        );

        uint winnerIndex = 0;
        for (uint i = 0; i < project.options.length; i++) {
            if (
                project.options[i].voteCount >
                project.options[winnerIndex].voteCount
            ) {
                winnerIndex = i;
            }
        }

        return project.options[winnerIndex];
    }
}
