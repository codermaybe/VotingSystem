// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingSystem {
    //设置投票选项
    struct VoteOption {
        string name;
        uint256 voteCount;
    }
    //设置投票组
    VoteOption[] public VoteBox;
    //记录参与投票名单
    mapping(address => bool) public votedNameList;
    //管理员记录
    address public admin;
    //管理员权限修饰符
    modifier OnlyAdmin() {
        require(msg.sender == admin, unicode"仅管理员可调用");
        _;
    }
    //可投票状态
    bool public canVoteStatus;

    //终止投票状态
    function stopVote() public OnlyAdmin {
        canVoteStatus = false;
    }

    //创建投票项目,输入投屏选项，设置管理员
    constructor(string[] memory Options) {
        admin = msg.sender;
        for (uint i = 0; i < Options.length; i++) {
            VoteBox.push(VoteOption(Options[i], 0));
        }
        canVoteStatus = true;
    }

    //用户投票功能
    function vote(uint256 index) public {
        require(canVoteStatus, unicode"投票已结束");
        require(index < VoteBox.length, unicode"投票选项不存在");
        require(!votedNameList[msg.sender], unicode"您已经投票过了");
        votedNameList[msg.sender] = true;
        VoteBox[index].voteCount++;
    }

    //查看票数
    function getCurrentVoteResult() public view returns (VoteOption[] memory) {
        return VoteBox;
    }

    //查看赢家,同票数优先报名者获胜
    function getFinalVoteWinner() public view returns (VoteOption memory) {
        require(!canVoteStatus, unicode"投票尚未结束");
        uint WinnerIndex = 0;
        for (uint i = 0; i < VoteBox.length; i++) {
            if (VoteBox[i].voteCount > VoteBox[WinnerIndex].voteCount) {
                WinnerIndex = i;
            }
        }
        return VoteBox[WinnerIndex];
    }
}
