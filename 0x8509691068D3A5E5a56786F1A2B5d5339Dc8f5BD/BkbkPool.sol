//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./Bkbk.sol";

// helper methods for interacting with ERC20 tokens and sending ETH that do not consistently return true/false
library TransferHelper {
    function safeApprove(
        address token,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('approve(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferHelper::safeApprove: approve failed"
        );
    }

    function safeTransfer(
        address token,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transfer(address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferHelper::safeTransfer: transfer failed"
        );
    }

    function safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TransferHelper::transferFrom: transferFrom failed"
        );
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "TransferHelper::safeTransferETH: ETH transfer failed");
    }
}

contract BkbkPool is Ownable,ReentrancyGuard{

    struct LiqNetStaked{
        uint256 net;
        uint256 staked;
    }

    event Stake(address indexed user,uint256 amount,address parent);

    event Withdraw(address indexed user,uint256 amount);

    event WithdrawFee(address indexed user,uint256 amount);

    event Settlement(uint256 indexed time,uint256 principal,uint256 principalInterest);

    event Liquidition(uint256 indexed time,uint256 net,uint256 staked);

    uint64 public constant DAY=600;
    uint64 public constant PERIOD=DAY*5;
    uint64 public constant LIQ_RANGE=60;

    //testnet 0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684
    //mainnet 0x55d398326f99059fF775485246999027B3197955
    address public constant USDT_ADDRESS=0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684;
    address public bkbkAddress=0x97697430f9898f3440429419ebdf782a098c7221;

    address public immutable projectAddress;
    address public immutable addrA;
    address public immutable addrB;
    address public immutable addrC;
    address public immutable addrD;

    mapping(address=>address) public parents;

    mapping(address=>bool) public hasStaked;

    mapping(address=>uint256) public shareholderBkbk;

    mapping(address=>uint256) public shareholderLevel;

    mapping(address=>mapping(uint256=>uint256)) public userStaking;

    mapping(address=>uint256[]) public userStakingDays;

    mapping(uint256=>address[]) public stakingAddressPerDay;

    mapping(uint256=>uint256) public stakingAmountPerDay;

    uint256 public totalUserBalance;

    mapping(address=>bool) public manager;

    mapping(uint256=>uint256) public hasSettleliq;

    mapping(uint256=>LiqNetStaked) public liqNet;

    mapping(address=>int256) public lastWithdrawIndex;

    uint256 public lastSettleliqTime;

    modifier onlyManager() {
        require(manager[msg.sender], "Caller is not the manager");
        _;
    } 

    constructor() {
        manager[msg.sender]=true;
        projectAddress = ;
        hasStaked[]=true;
        lastWithdrawIndex[]=-1;
        addrA=;
        addrB=;
        addrC=;
        addrD=;        
        uint256 t=block.timestamp-block.timestamp%DAY;
        hasSettleliq[t]=1; 
        lastSettleliqTime=t;
    }    

    function totalStaking() external view returns(uint256){
        uint256 time=block.timestamp-block.timestamp%DAY;
        uint256 total;
        uint256 i;
        for(;i<=5;++i){
            uint256 t=time-i*DAY;
            total+=stakingAmountPerDay[t];
            if(hasSettleliq[t]==2){
                break;
            }
        }
        return total;
    }

    function todayNeedStake() public view returns(uint256){
        uint256 time=block.timestamp-block.timestamp%DAY;
        uint256 pre4total;
        uint256 payed;
        uint256 i;
        for(;i<=4;++i){
            uint256 t=time-i*DAY;
            pre4total+=stakingAmountPerDay[t];
            if(hasSettleliq[t]==2){
                break;
            }
        }
        if(i==5){
            payed=stakingAmountPerDay[time-PERIOD];
        }
        uint256 balance=ERC20(USDT_ADDRESS).balanceOf(address(this));
        uint256 netBalance=balance-totalUserBalance;        
        if(9*pre4total+11*payed>=10*netBalance){
            return 9*pre4total+11*payed-10*netBalance;
        }
        return 0;
    }
    
    function userBalance(address user) public view returns(uint256,int256){
        if(!hasStaked[user]){
            return (0,-1);
        }
        int256 last=lastWithdrawIndex[user];
        uint256 begin=last>=0?uint256(last)+1:0;
        uint256 balance;
        uint256[] memory list=userStakingDays[user];
        uint256 lastLiqTime;
        for(;begin<list.length;++begin){
            if(list[begin]<lastLiqTime){
                continue;
            }
            for(uint256 j=1;j<=6;++j){
                uint256 t=list[begin]+DAY*j;
                uint256 slState=hasSettleliq[t];
                if(slState==1){
                    if(j==6){
                        balance+=userStaking[user][list[begin]]*11/10;
                    }
                }
                else if(slState==2){
                    uint256 yesterday=userStaking[user][t-DAY];
                    if(yesterday>0){
                        balance+=yesterday*11/10;
                    }
                    LiqNetStaked memory lns=liqNet[t];
                    uint256 amount=getUserTotalAmountByRange(user,list[begin],j-1);
                    balance+=amount*lns.net/lns.staked;
                    lastLiqTime=t;
                }
                else{
                    return (balance,int256(begin)-1);
                }
            }
        }
        return (balance,int256(begin)-1);
    }

    
    function getUserTotalAmountByRange(address user,uint256 d,uint256 len) private view returns(uint256){
        uint256 amount;
        for(uint256 i=0;i<len;++i){
            amount+=userStaking[user][d+i*DAY];
        }
        return amount;
    }

    function withdraw() external nonReentrant{
        require(block.timestamp%DAY>LIQ_RANGE,"no allowed withdraw");
        (uint256 amount,int256 lastIndex)=userBalance(msg.sender);
        require(amount>0,"no money to withdraw");
        TransferHelper.safeTransfer(USDT_ADDRESS, msg.sender, amount);
        totalUserBalance-=amount;
        lastWithdrawIndex[msg.sender]=lastIndex;
        emit Withdraw(msg.sender,amount);
    }

   
    function withdrawFee() external nonReentrant{
        uint256 level=shareholderLevel[msg.sender];
        require(msg.sender==addrA||msg.sender==addrB||msg.sender==addrC||msg.sender==addrD||level==1||level==2||level==3||level==4,"Not shareholder");
        uint256 amount=shareholderBkbk[msg.sender];
        require(shareholderBkbk[msg.sender]>0,"No amount can withdraw");
        TransferHelper.safeTransfer(bkbkAddress, msg.sender, amount);
        delete shareholderBkbk[msg.sender];
        emit WithdrawFee(msg.sender,amount);
    }

   
    function setttleliq() external onlyManager nonReentrant {
        uint256 time=block.timestamp-block.timestamp%DAY;
        require(hasSettleliq[time]==0,"Had settleliq");
        for(uint256 t=lastSettleliqTime+DAY;t<=time;t+=DAY){
            setttleliq(t);
        }
        lastSettleliqTime=time;
    }

    
    function setttleliq(uint256 time) private {
        if(hasSettleliq[time]>0){
            return;
        }
        uint256 pre5total;
        uint256 payed;
        uint256 i;
        for(;i<=5;++i){
            uint256 t=time-i*DAY;
            pre5total+=stakingAmountPerDay[t];
            if(hasSettleliq[t]==2){
                break;
            }
        }
        if(i==6){
            payed=stakingAmountPerDay[time];
        }
        uint256 balance=ERC20(USDT_ADDRESS).balanceOf(address(this));
        if(balance>=totalUserBalance)
        {
            uint256 payed11=payed;
            uint256 netBalance=balance-totalUserBalance;
            if(10*netBalance>=pre5total*9){
                if(payed>0){
                    totalUserBalance+=payed11;
                }
                hasSettleliq[time]=1;
                emit Settlement(time,payed,payed11);
                return;
            }
        }       
        uint256 yesterday=time-DAY;
        uint256 yesterdayAmount=stakingAmountPerDay[yesterday];
        totalUserBalance+=yesterdayAmount;
        uint256 net=balance-totalUserBalance;
        uint256 ts=pre5total+payed;
        totalUserBalance+=net;
        liqNet[time]=LiqNetStaked(net,ts);
        hasSettleliq[time]=2;
        emit Liquidition(time,net,ts);
    }    

   
    function stake(uint256 amount,address parent) external nonReentrant{
        uint256 time=block.timestamp-block.timestamp%DAY;
        require(hasSettleliq[time]>0,"No settleliq today");
        require(block.timestamp>LIQ_RANGE,"No allowed staking");
        require(msg.sender!=projectAddress&&msg.sender!=parent);
        require(amount>=10*10**18&&amount<=10000*10**18,"Amount must >=10 and <=10000 usdt");
        Bkbk bkbk=Bkbk(bkbkAddress);
        uint256 usdtPrice=bkbk.usdtPrice();
        uint256 a=amount/10000*10**18/usdtPrice;
        require(bkbk.balanceOf(msg.sender)>=a*300,"Bkbk not enough to pay fee");
        if(parents[msg.sender]==address(0)&&!hasStaked[msg.sender]){
            require(hasStaked[parent],"Parent no staking record"); 
            parents[msg.sender]=parent;
        }
        require(parents[msg.sender]==parent,"Parent error");
        TransferHelper.safeTransferFrom(USDT_ADDRESS, msg.sender, address(this), amount);
        if(userStaking[msg.sender][time]==0){
            stakingAddressPerDay[time].push(msg.sender);
            userStakingDays[msg.sender].push(time);
        }
        userStaking[msg.sender][time]+=amount;   
        stakingAmountPerDay[time]+=amount;
        if(!hasStaked[msg.sender]){        
            hasStaked[msg.sender]=true;
            lastWithdrawIndex[msg.sender]=-1;
        }      
        emit Stake(msg.sender,amount,parent);
        if(parent==projectAddress){
            TransferHelper.safeTransferFrom(bkbkAddress, msg.sender, projectAddress, a*200);
            shareholderBkbk[projectAddress]+=a*70;
        }
        else{
            uint256 ownShareholderLevel=shareholderLevel[parent];
            address ownShareholder;
            if(ownShareholderLevel>0){
                ownShareholder=parent;
            }
            TransferHelper.safeTransferFrom(bkbkAddress, msg.sender, parent, a*100);
            address tempP=parent;
            uint256 n=1;
            while(n<=5&&parents[tempP]!=projectAddress){
                tempP=parents[tempP];
                if(ownShareholderLevel==0){
                    if(shareholderLevel[tempP]>0){
                        ownShareholderLevel=shareholderLevel[tempP];
                        ownShareholder=tempP;
                    }
                }
                TransferHelper.safeTransferFrom(bkbkAddress, msg.sender, tempP, a*20);
                ++n;
            }
            if(ownShareholderLevel==0&&n>5&&parents[tempP]!=projectAddress){
                while(ownShareholderLevel==0&&parents[tempP]!=projectAddress){
                    tempP=parents[tempP];
                    if(shareholderLevel[tempP]>0){
                        ownShareholderLevel=shareholderLevel[tempP];
                        ownShareholder=tempP;
                        break;
                    }
                }
            }
            if(n<=5){
                TransferHelper.safeTransferFrom(bkbkAddress, msg.sender, projectAddress, a*(100-(n-1)*20));
            }    
            if(ownShareholderLevel==4){
                shareholderBkbk[ownShareholder]+=a*30;
                address pp=parents[ownShareholder];
                while(shareholderLevel[pp]!=3){
                    pp=parents[pp];
                }
                shareholderBkbk[pp]+=a*20;
                shareholderBkbk[parents[pp]]+=a*10;
                shareholderBkbk[parents[parents[pp]]]+=a*10;
            }        
            else if(ownShareholderLevel==3){
                shareholderBkbk[ownShareholder]+=a*50;
                shareholderBkbk[parents[ownShareholder]]+=a*10;
                shareholderBkbk[parents[parents[ownShareholder]]]+=a*10;
            }
            else if(ownShareholderLevel==2){
                shareholderBkbk[ownShareholder]+=a*60;
                shareholderBkbk[parents[ownShareholder]]+=a*10;
            }
            else if(ownShareholderLevel==1){
                shareholderBkbk[ownShareholder]+=a*70;
            }
            else{
                shareholderBkbk[projectAddress]+=a*70;
            }
        }
        uint a1=a*10;
        uint a2=a*5;
        shareholderBkbk[addrA]+=a1;
        shareholderBkbk[addrB]+=a1;
        shareholderBkbk[addrC]+=a2;
        shareholderBkbk[addrD]+=a2;
        TransferHelper.safeTransferFrom(bkbkAddress, msg.sender, address(this), a*100);
    }

    
    function addShareholder(address parent,address current) external onlyOwner{
        if(parent==projectAddress){
            require(parents[current]==address(0),"current address already staked");
            parents[current]=parent;
            hasStaked[current]=true;
            lastWithdrawIndex[current]=-1;
            shareholderLevel[current]=1;
            return;
        }
        uint256 parentLevel=shareholderLevel[parent];
        require(parentLevel==1||parentLevel==2,"parent level must =1 or =2");
        require(parents[current]==address(0),"current address already staked");
        parents[current]=parent;
        hasStaked[current]=true;
        lastWithdrawIndex[current]=-1;
        shareholderLevel[current]=parentLevel+1;
    }

    
    function addLevel4Shareholder(address current) external onlyOwner{
        uint256 currentLevel=shareholderLevel[current];
        require(currentLevel==0,"already shareholder");
        address pp=parents[current];
        require(pp!=address(0),"current address no parent");
        require(pp!=projectAddress,"project referenced user cann't be level 4");
        while(shareholderLevel[pp]!=3){
            pp=parents[pp];
            if(pp==projectAddress){
                revert("can't find level 3 shareholder");
            }
        }
        shareholderLevel[current]=4;
    }

   
    function addManager(address adr) external onlyOwner{
        manager[adr]=true;
    }

    
    function removeManager(address adr) external onlyOwner{
        manager[adr]=false;
    }
}