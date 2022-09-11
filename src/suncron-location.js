const CronJob = require('cron').CronJob
const SunCalc = require('suncalc')
const BehaviorSubject = require('rxjs').BehaviorSubject


module.exports = function (RED) {
	function SuncronLocationNode(config) {
	  RED.nodes.createNode(this, config)

		const node = this
		node.sunTimes = new BehaviorSubject()
		let updateRetry
		let dailyCron = []

		const letsGo = function () {
			updateSunTimes()
			dailyCron = installDailyCronjob()
		}

		const updateSunTimes = function () {
			try {
				const today = new Date()
				const midday = new Date(
					today.getFullYear(),
					today.getMonth(),
					today.getDate(),
					12,
					0,
					0,
					0,
					0
				)
				const sunTimes = SunCalc.getTimes(midday, config.lat, config.lon)
				node.sunTimes.next(sunTimes)
				updateRetry = undefined
			} catch (e) {
				node.error(e)
				updateRetry = setTimeout(updateSunTimes, 60000)
			}
		}

		const installDailyCronjob = function () {  
			const cron = new CronJob({
				cronTime: '5 0 0 * * *',
				onTick: () => {
					updateSunTimes()
				},
			})
			cron.start()
			return cron
		}

		node.on('close', function () {
			dailyCron.stop()
			clearTimeout(updateRetry)
		})
		;(function () {
			// on startup:
			try {
				letsGo()
			} catch (e) {
				node.error(e)
			}
	  })()
	}

	RED.nodes.registerType('suncron-location', SuncronLocationNode)
}
