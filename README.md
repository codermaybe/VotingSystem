# 目前1.0是单个项目的投票项目，后续会进行拆分



## VotingSystem1.0
- 由管理员创建并控制开奖时间，人员参与可头投票，投票结果可显示  已实现
- 人均1次投票，投票结果可获取 已实现
- 预计加入前端页面，实现真正的玩家交互，连接钱包  待定

## 1.0部署方式
- `git clone https://github.com/codermaybe/VotingSystem.git`
- npm install
- 编辑.envdemo中的配置文件，修改为.env 或者直接修改hardhat.config.js中的参数
- 部署 ：npx hardhat ignition deploy ignition/modules/VotingSystem.js --network xxx
- 测试 ：npx hardhat test --network xxx

## VotingSystem2.0
- 预计引入多项目同时投票功能  已实现
- 预计引入非管理员控制自动开奖功能（时间戳控制）已实现
- 预计放开项目创建与关闭权限 已实现 （管理员与创建者）
- 尽量详细的测试 已实现

## 2.0部署方式
- git clone `git clone https://github.com/codermaybe/VotingSystem.git`
- npm install
- 编辑.envdemo中的配置文件，修改为.env 或者直接修改hardhat.config.js中的参数
- 自行编辑hardhat.config.js中的参数，部署到指定的链上
- 部署 ：npx hardhat ignition deploy ignition/modules/VotingSystem2.js --network xxx
- 例: `npx hardhat ignition deploy ignition/modules/VotingSystem2.js --network localHardhat`
- 测试 ：npx hardhat test 【testfile】 --network xxx
-  例: `npx hardhat test ./test/VotingSystem2.js --network localHardhat `

## VotingSystem3.0
- 预计引入openzeppelin权限控制
- 预计修复2.0潜在问题

  