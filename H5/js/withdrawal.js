let fetchDate = () => {
	return Promise.all([
		common_userBalance().then(res => {
			setValue('userBalance', res.num)
		}),
		common_stakingList().then(res => {
			console.log(res);
			setValue('totalAmount', res.totalAmount)
			setValue('totalInterest', res.totalInterest)
			for (let i = 0; i < res.list.length; i++) {
				let item = res.list[i]
				createListItem(item.stakNum, item.interestNum, item.deadline)
			}
			console.log('common_stakingList', res);
		}),
		common_parentAddress().then(res => {
			if (res != "0x0000000000000000000000000000000000000000") {
				setValue('parentAddress', res)
			}
		})
	])
}

function createListItem(s, i, d) {
	console.log(d);
	let deadline = (new Date(parseInt(d * 1000))).toLocaleDateString()
	let depositList_item = document.createElement('div')
	depositList_item.classList.add('depositList_item')
	depositList_item.innerHTML = `<div class="flex mb_20">
						<div class="depositList_item_content">
							<div class="fontSize_28 mb_13">
								Deposit Pool
							</div>
							<div class="flex flex_end">
								<div class="fontSize_28">
									${s}
								</div>
								<div class="fontSize_20 ml_5">
									USDT
								</div>
							</div>
						</div>
						<div class="depositList_item_content">
							<div class="fontSize_28 mb_13">
								Cumulative Interest
							</div>
							<div class="flex flex_end">
								<div class="fontSize_28">
									${i}
								</div>
								<div class="fontSize_20 ml_5">
									USDT
								</div>
							</div>
						</div>
					</div>

					<div class="depositList_item_line mb_20">
					</div>
					<div class="depositList_item_time fontSize_28">
						Release Time: ${deadline}
					</div>`
	document.getElementById('depositList').appendChild(depositList_item)

	function timerFilter(params) {
		if (params - 0 < 10) {
			return '0' + params
		} else {
			return params
		}
	}
}
let button_withdraw = () => {
	loading.show()
	common_withdraw().then(res => {
		loading.hide()
		if (res.status == 1) {
			Toast("succes!!!")
			fetchDate()
		} else {
			Toast("fail!!!")
		}
	}).catch(err => {
		Toast(err.message)
	})
}

window.onload = () => {
	common_connect().then(res => {
		console.log(res);
		if (res) {
			fetchDate()
		}
	})
}
