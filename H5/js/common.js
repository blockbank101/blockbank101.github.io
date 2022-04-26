let checkSigle = false
let browser = {
	versions: function() {
		let u = navigator.userAgent,
			app = navigator.appVersion;
		return {
			trident: u.indexOf('Trident') > -1,
			presto: u.indexOf('Presto') > -1,
			webKit: u.indexOf('AppleWebKit') > -1,
			gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,
			mobile: !!u.match(/AppleWebKit.*Mobile.*/),
			ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
			android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1,
			iPhone: u.indexOf('iPhone') > -1,
			iPad: u.indexOf('iPad') > -1,
			webApp: u.indexOf('Safari') == -1,
			weixin: u.indexOf('MicroMessenger') > -1,
			qq: u.match(/\sQQ/i) == " qq"
		};
	}(),
};

function Toast(msg, duration) {
	if (checkSigle) {
		return
	}
	duration = isNaN(duration) ? 3000 : duration;
	var m = document.createElement('div');
	m.innerHTML = msg;
	m.style.cssText =
		"max-width:100%;min-width: 250px;padding:14px;;color: rgb(255, 255, 255);line-height: 1.5;text-align: center;border-radius: 4px;position: fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);z-index: 999999;background: rgba(100,27,98,0.7);font-size: 16px;";
	document.body.appendChild(m);
	checkSigle = true
	setTimeout(function() {
		var d = 0.5;
		m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
		m.style.opacity = '0';
		setTimeout(function() {
			document.body.removeChild(m)
		}, d * 1000);
		checkSigle = false
	}, duration);
}

let loading = {
	show: () => {
		let loadEffect = document.createElement('div')
		// loadEffect.classList.add('loadEffect')
		loadEffect.id = 'loading'
		loadEffect.innerHTML = `<div class="loadEffect">
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
				<span></span>
			</div>`
		document.body.appendChild(loadEffect)
		setTimeout(() => {
			let load = document.getElementById('loading')
			if (load) {
				document.body.removeChild(load)
			}
		}, 2000)
	},
	hide: () => {
		let loadEffect = document.getElementById('loading')
		if (loadEffect) {
			document.body.removeChild(loadEffect)
		}
	}
}


var isLogin = false
var hasParent = false
var provider;
var signer;
var pool;
var bkbk;
var usdt;
var userUsdt;
var userBKBK;
const DAY = 24 * 60 * 60;
// const DAY = 60*10;

function to18(number) {
	return ethers.BigNumber.from(number).mul(ethers.BigNumber.from(10).pow(18));
}

function setValue(dom, value) {
	let node = document.getElementById(dom)
	if (node) {
		node.innerHTML = value
	}
}

async function common_connect() {
	provider = new ethers.providers.Web3Provider(window.ethereum, "any");
	await provider.send("eth_requestAccounts", []);
	signer = provider.getSigner();
	let address = await signer.getAddress()
	if (address) {
		bkbk = new ethers.Contract(bkbkAddress, bkbkABI, signer);
		pool = new ethers.Contract(poolAddress, ABI, signer);
		console.log(pool);
		usdt = new ethers.Contract(usdtAddress, usdtABI, signer);
	}
	return address
}
async function common_projectAddress() {
	let a = await pool.projectAddress();
	return parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2)
}
async function common_currentTotalStake() {
	let a = await pool.totalStaking();
	return {
		num: parseInt(ethers.utils.formatUnits(a, 18)),
		bigNum: a
	}
	return parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2)
}
async function common_todayNeedStake() {
	let a = await pool.todayNeedStake();
	return {
		num: parseInt(ethers.utils.formatUnits(a, 18)),
		bigNum: a
	}
	// return parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2)
}
async function common_todayAlreadyStaked() {
	let timestamp = Date.parse(new Date()) / 1000;
	let t = timestamp - timestamp % DAY;
	let a = await pool.stakingAmountPerDay(t);
	return {
		num: parseInt(ethers.utils.formatUnits(a, 18)),
		bigNum: a
	}
	return parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2)
}
async function common_usdtBalance() {
	let a = await usdt.balanceOf(await signer.getAddress());
	return {
		num: parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2),
		bigNum: a
	}
}
async function common_bkbkBalance() {
	let a = await bkbk.balanceOf(await signer.getAddress());
	return {
		num: parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2),
		bigNum: a
	}
}
async function common_allowanceUsdt() {
	let a = await usdt.allowance(await signer.getAddress(), poolAddress);
	return {
		num: parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2),
		bigNum: a
	}
}
async function common_allowanceBkbk() {
	let a = await bkbk.allowance(await signer.getAddress(), poolAddress);
	return {
		num: parseFloat(ethers.utils.formatUnits(a, 18)).toFixed(2),
		bigNum: a
	}
}
async function common_fee(amount) {
	let a = await bkbk.usdtPrice();
	let b = to18(amount).mul(ethers.utils.parseUnits("1")).mul(3).div(100).div(a);
	return b
}
async function common_approveUsdt() {
	let tx = await usdt.approve(poolAddress, to18("100000000000000"));
	// console.log(tx);  
	return provider.waitForTransaction(tx.hash)
}
async function common_approveBkbk() {
	let tx = await bkbk.approve(poolAddress, to18("100000000000000"));
	// console.log(tx);  
	return provider.waitForTransaction(tx.hash)
}
async function common_hasStaked(address) {
	let value = await signer.getAddress()
	if (address) {
		value = address
	}
	let a = await pool.hasStaked(value);
	return a
}
async function common_onAmountChange(amount) {
	let value = amount
	amount = to18(amount);
	let userAddress = await signer.getAddress();
	let usdtBalance = await usdt.balanceOf(userAddress);
	if (usdtBalance.lt(amount)) {
		// alert("usdt not enough");
		return 1;
	}
	let fee = await common_fee(value);
	console.log(fee);
	let bkbkBalance = await bkbk.balanceOf(userAddress);
	if (bkbkBalance.lt(fee)) {

		console.log(111111111);
		return 2;
	}
	let allowanceUsdt = await usdt.allowance(userAddress, poolAddress);
	if (allowanceUsdt.lt(amount)) {

		return 3;
	}
	let allowanceBkbk = await bkbk.allowance(userAddress, poolAddress);
	if (allowanceBkbk.lt(fee)) {
		return 4;
	}
	return 5
}
async function common_stake(amount, address) {
	let tx = await pool.stake(to18(amount),
		address
	);
	return provider.waitForTransaction(tx.hash)
}
async function common_userBalance() {
	let a = await pool.userBalance(await signer.getAddress());
	return {
		num: parseFloat(ethers.utils.formatUnits(a[0], 18)).toFixed(2),
		bigNum: a[0]
	}
}
async function common_parentAddress() {
	let a = await pool.parents(await signer
		.getAddress());
	return a
}
async function common_withdraw() {
	let tx = await pool.withdraw();
	console.log(tx);
	return provider.waitForTransaction(tx.hash)
}
async function common_stakingList() {
	let timestamp = Date.parse(new Date()) / 1000;
	let t = timestamp - timestamp % DAY;

	console.log('t', t);
	let list = [];
	let userAddress = await signer.getAddress();
	let totalAmount = ethers.BigNumber.from(0),
		totalInterest = ethers.BigNumber.from(0);
	let result = {
		totalAmount: 0,
		totalInterest: 0,
		list: []
	}
	for (let i = t - DAY * 5; i <= t; i += DAY) {

		let amount = await pool.userStaking(userAddress, i);

		if (amount.gt(0)) {
			let interest = amount.mul(10).div(100);
			totalAmount = totalAmount.add(amount);
			totalInterest = totalInterest.add(interest);
			let stakNum = ethers.utils.formatUnits(amount, 18)
			let interestNum = ethers.utils.formatUnits(interest, 18)
			let deadline = i
			let obj = {
				stakNum: stakNum,
				interestNum: interestNum,
				deadline: deadline
			}
			result.list.push(obj)
		}
	}
	result.totalAmount = ethers.utils.formatUnits(totalAmount, 18)
	result.totalInterest = ethers.utils.formatUnits(totalInterest, 18)
	return result
}

async function slToday() {
	let timeStamp = Date.parse(new Date()) / 1000
	let tx= await pool.hasSettleliq(timeStamp - timeStamp % DAY)
	return tx
}
