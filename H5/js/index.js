var liquidationStatus = false
var userAdress = ""
var button_ApproveUsdt_isUsed = false
var button_ApproveBkbk_isUsed = false
var Approveing = false
var staking = false

function countDown() {
	let utc = new Date().toUTCString()
	let utc_h = new Date().getUTCHours()
	// let utc_h = 0
	let utc_m = new Date().getUTCMinutes()
	let utc_s = new Date().getUTCSeconds()
	let now = utc_h * 60 * 60 + utc_m * 60 + utc_s
	let end = 24 * 60 * 60
	if (utc_s % 60 == 0) {
		fetchDate()
	}
	let timediff = Math.round((end - now));
	let hour = parseInt(timediff / 3600 % 24) + parseInt(timediff / 3600 / 24) * 24;
	let minute = parseInt(timediff / 60 % 60);
	let second = timediff % 60;
	hour = timerFilter(hour);
	minute = timerFilter(minute);
	second = timerFilter(second);
	if (utc_h < 1 && utc_m < 20) {
		console.log(111);
		setValue('countDown', 'Liquidationing!')
		button_button_wait.show()
		Deposit_pool.hide()
		liquidationStatus = true
		setValue('countDown', timerFilter(utc_h) + " : " + minute + " : " + second)
		return
	} else {
		if (staking) {
			button_button_wait.show()
			if (!Approveing) {
				button_button_wait.hide()
			}
			if (button_ApproveBkbk_isUsed) {
				button_ApproveBkBK.show()
			}
			if (button_ApproveUsdt_isUsed) {
				button_ApproveUsdt.show()
			}
		}
		liquidationStatus = false
	}
	if (!liquidationStatus) {
		setValue('countDown', hour + " : " + minute + " : " + second)

	}

	function timerFilter(params) {
		if (params - 0 < 10) {
			return '0' + params
		} else {
			return params
		}
	}
}
setInterval(() => {
	countDown()
}, 1000)

let Deposit_pool = {
	show: () => {
		document
			.getElementById('Deposit_pool').classList.remove('hidden')
		document
			.getElementById('liquidationing').classList.add('hidden')
	},
	hide: () => {
		document
			.getElementById('Deposit_pool').classList.add('hidden')
		document
			.getElementById('liquidationing').classList.remove('hidden')
	}
}
let logined = {
	show: (address) => {
		document
			.getElementById('notLogin').classList.add('hidden')
		document
			.getElementById('logined').classList.remove('hidden')
		let arr = address.split('')
		let str1 = arr.splice(0, 8).join('')
		let str2 = arr.splice(-8, 8).join('')
		let str = str1 + '...' + str2
		setValue('address', str)
	},
	hide: () => {
		document
			.getElementById('notLogin').classList.remove('hidden')
		document
			.getElementById('logined').classList.add('hidden')
	}
}

let button_deposit = {
	show: () => {
		document.getElementById('deposit').classList.remove('hidden')
		document.getElementById('button_wait').classList.add('hidden')
		document.getElementById('ApproveUsdt').classList.add('hidden')
		document.getElementById('ApproveBkBK').classList.add('hidden')
		button_ApproveBkbk_isUsed = false
		button_ApproveUsdt_isUsed = false
	}
}
let button_button_wait = {
	show: () => {
		document.getElementById('deposit').classList.add('hidden')
		document.getElementById('button_wait').classList.remove('hidden')
		document.getElementById('ApproveUsdt').classList.add('hidden')
		document.getElementById('ApproveBkBK').classList.add('hidden')
		// setTimeout(() => {
		// 	document.getElementById('deposit').classList.remove('hidden')
		// 	document.getElementById('button_wait').classList.add('hidden')
		// }, 10000)
	},
	hide: () => {
		if (!staking) {
			if (!button_ApproveUsdt_isUsed || !button_ApproveBkbk_isUsed) {
				document.getElementById('deposit').classList.remove('hidden')
			}
			document.getElementById('button_wait').classList.add('hidden')
		}
	}
}
let button_ApproveUsdt = {
	show: function() {
		button_ApproveUsdt_isUsed = true
		document.getElementById('deposit').classList.add('hidden')
		document.getElementById('button_wait').classList.add('hidden')
		document.getElementById('ApproveUsdt').classList.remove('hidden')
		document.getElementById('ApproveBkBK').classList.add('hidden')
	},
	hide: function() {
		button_ApproveUsdt_isUsed = false
		document.getElementById('deposit').classList.remove('hidden')
		document.getElementById('ApproveUsdt').classList.add('hidden')
	}
}
let button_ApproveBkBK = {
	isUsed: false,
	show: function() {
		button_ApproveBkbk_isUsed = true
		this.isUsed = !this.isUsed
		document.getElementById('deposit').classList.add('hidden')
		document.getElementById('button_wait').classList.add('hidden')
		document.getElementById('ApproveUsdt').classList.add('hidden')
		document.getElementById('ApproveBkBK').classList.remove('hidden')
	},
	hide: function() {
		button_ApproveBkbk_isUsed = false
		this.isUsed = !this.isUsed
		document.getElementById('deposit').classList.remove('hidden')
		document.getElementById('ApproveBkBK').classList.add('hidden')
	}
}
let dialog = {
	show: () => {
		document.getElementById('dialog').classList.remove('hidden')
	},
	hide: () => {
		document.getElementById('dialog').classList.add('hidden')
	}
}
let input_num = {
	set: (value) => {
		document.getElementById('depoit_num').value = value
	},
	get: () => {
		return document.getElementById('depoit_num').value * 1
	}
}
let input_address = {
	set: (value) => {
		document.getElementById('inputAddress').value = value
	},
	get: () => {
		return document.getElementById('inputAddress').value
	}
}

let fetchDate = () => {
	let num = () => {
		return parseFloat(Math.random() * 4000).toFixed(2)
	}
	return Promise.all([
		common_usdtBalance().then(res => {
			setValue('USDTBalance', res.num)
		}),
		common_bkbkBalance().then(res => {
			// console.log('common_bkbkBalance',res.bigNum.lt(55));
			setValue('BKBKBalance', res.num)
		}),
		common_currentTotalStake().then(res => {
			setValue('current', res.num)
		}),
		common_todayNeedStake().then(res => {
			setValue('todayNeedStake', res.num)
		}),
		common_todayAlreadyStaked().then(res => {
			setValue('todayAlreadyStaked', res.num)
		})
	])

}

let step = 100

async function deposit_add() {

	if (liquidationStatus) {
		Toast("Liquidationing,Plsease waitting!")
		return
	}
	let input = document.getElementById('depoit_num')
	let num = parseInt(userUsdt / step) * step
	let value = input.value * 1 + step
	if (userUsdt < step) {
		Toast('Lack of USDT ')
		return
	}
	if (parseInt(input.value) >= 10000) {
		Toast('The biggest deposit amount to 10000!!')
		input.value = 10000
		return
	}
	input.value = value
}
let deposit_reduction = () => {
	if (liquidationStatus) {
		Toast("Liquidationing,Plsease waitting!")
		return
	}
	let input = document.getElementById('depoit_num')
	if (input.value * 1 == 0) {
		return
	}
	if (input.value * 1 <= step) {
		return
	}
	input.value = parseInt(input.value) - step

}

async function inputChange(v) {
	if (liquidationStatus) {
		Toast("Liquidationing,Plsease waitting!")
		return
	}
	let value = input_num.get()
	if (value < 0) {
		input_num.set(step)
		return
	}
	if (value % step != 0) {
		input_num.set(parseInt(value / step) * step)
	}
	if (value >= 10000) {
		input_num.set(10000)
		return
	}
	input_num.set(value)
}

let buttonApproveUSDT = () => {
	loading.show()
	button_ApproveUsdt.hide()
	button_button_wait.show()
	Approveing = true
	common_approveUsdt().then(res => {
		loading.hide()
		button_button_wait.hide()
		Approveing = false
		if (res.status == 1) {
			Toast("succes!!!")
		} else {
			Toast("fail!!!")
		}
	}).catch(err => {
		loading.hide()
		button_button_wait.hide()
		Toast(err.message)
	})
}
let buttonApproveBKBK = () => {
	loading.show()
	button_ApproveBkBK.hide()
	button_button_wait.show()
	Approveing = true
	common_approveBkbk().then(res => {
		loading.hide()
		button_button_wait.hide()
		Approveing = false
		if (res.status == 1) {
			Toast("succes!!!")
		} else {
			Toast("fail!!!")
		}
	}).catch(err => {
		loading.hide()
		button_button_wait.hide()
		Toast(err.message)
	})
}
let deposit_button = () => {
	let despositValue = input_num.get()
	if (despositValue < step) {
		Toast("USDT less than 100")
		return
	}
	if (despositValue == 0) {
		Toast("USDT less than 100")
		return
	}
	common_onAmountChange(despositValue).then(res => {
		if (res == 1) {
			Toast('USDT not enough')
			return
		}
		if (res == 2) {
			Toast('BKBK not enough to pay fee')
			return
		}
		if (res == 3) {
			Toast('approve USDT please!')
			button_ApproveUsdt.show()
			return
		}
		if (res == 4) {
			Toast('approve BKBK please!')
			button_ApproveBkBK.show()
			return
		}
		if (res == 5) {
			common_hasStaked().then(userStakedStatus => {
				let aaaa = false
				if (userStakedStatus) {
					staking = true
					button_button_wait.show()
					fetchStaked()
					return
				}
				if (!userStakedStatus) {
					dialog.show()
					return
				}
			})

			return
		}
	}).catch(err => {
		Toast(err.message)
	})
}
let Bound = async () => {

	if (liquidationStatus) {
		Toast("Liquidationing,Plsease waitting!")
		return
	}
	let address = input_address.get()
	// console.log(address);
	if (!ethers.utils.isAddress(address)) {
		Toast('The invitees address is wrong!!')
		document.getElementById('inputAddress').value = ""
		return
	}
	// a7aa3dfc3d7504bdf633c9e988a106e29168dbaef6483ac6bf8ec04a21465bbe
	let value = input_num.get() * 1
	if (value == 0) {
		return
	}
	common_hasStaked(address).then(parentStakedStatus => {
		button_button_wait.show()
		if (parentStakedStatus) {
			fetchStaked()
			dialog.hide()
			return
		}
		if (!parentStakedStatus) {
			Toast('The invitees address not staked!!')
			input_address.set('')
			return
		}
	}).catch(err => {
		Toast(err.message)
	})
}

let fetchStaked = () => {
	loading.show()
	common_parentAddress().then(parent => {
		let parentAdress = ""
		if (parent == "0x0000000000000000000000000000000000000000") {
			parentAdress = input_address.get()
		} else {
			parentAdress = parent
		}
		common_stake(input_num.get(), parentAdress).then(res => {
			loading.hide()
			if (res.status == 1) {
				staking = false
				fetchDate().then(() => {
					Toast("succes!!!")
					button_button_wait.hide()
				})
			} else {
				Toast("fail!!!")
			}
		}).catch(err => {
			staking = false
			Toast(err.message)
		})
	}).catch(err => {
		staking = false
		Toast(err.message)
	})
}


let Stick = async () => {
	// console.log(window.Clipboard());
	// document.execCommand('paste')
	let clipboardObj = navigator.clipboard;
	let text = await navigator.clipboard.readText();
	if (text) {
		console.log(text);
		document.getElementById('inputAddress').value = text
	}
}

let goWithdrawal = () => {
	common_hasStaked().then(res => {
		if (!res) {
			Toast('You has not staked!!')
			return
		}
		if (res) {
			window.location.href = "./withdrawal.html"
		}
	})
}
let reload = () => {
	loading.show()
	fetchDate().then(() => {
		loading.hide()
	})
}


window.onload = () => {
	loading.show()
	common_connect().then(res => {
		if (res) {
			userAdress = res
			logined.show(res)
			fetchDate().then(res => {
				loading.hide()
			})
		}
		if (!res) {
			logined.hide()
		}
	})
}
