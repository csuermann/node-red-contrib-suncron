const CronJob = require('cron').CronJob
const SunCalc = require('suncalc')
const BehaviorSubject = require('rxjs').BehaviorSubject


module.exports = function (RED) {
	function SuncronLocationNode(config) {
	  RED.nodes.createNode(this, config)

		const node = this
		node.sunTimes = new BehaviorSubject()
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
			} catch (e) {
				node.error(e)
				setTimeout(updateSunTimes, 60000)
			}
		}

		const installDailyCronjob = function () {
			// run daily cron 5 seconds past midnight (except for debugging: 5 seconds past the full minute)
			const cronTime = RED.settings.suncronMockTimes
				? '5 * * * * *'
				: '5 0 0 * * *'
  
			const cron = new CronJob({
				cronTime,
				onTick: () => {
					updateSunTimes()
				},
			})
			cron.start()
			return cron
		}

		node.on('close', function () {
			dailyCron.stop()
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
