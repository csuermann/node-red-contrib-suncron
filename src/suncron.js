const CronJob = require('cron').CronJob
const dayjs = require('dayjs')

module.exports = function (RED) {
	function SuncronNode(config) {
		RED.nodes.createNode(this, config)

		const node = this

		let schedule
		let msgCrons = []

		const letsGo = function () {
			setNodeStatus('Setting up...')
			const location = RED.nodes.getNode(config.location)
			location.sunTimes.subscribe({ next: (sunTimes) => {
				if (sunTimes == null) { return }
				schedule = calcScheduleForToday(sunTimes)
				installMsgCronjobs(schedule)
				debug(schedule)
			}})
		}

		const calcScheduleForToday = function (sunTimes) {
			const eventType = config.sunEventType
			const payload = config.payload
			const payloadType = config.payloadType
			const topic = config.topic
			const sunEventTime = dayjs(sunTimes[eventType])
			const offset = config.offset
			const cronTime = dayjs(sunEventTime).add(offset, 'minute')

			return [
				{
					cronTime,
					payload,
					payloadType,
					topic,
				}
			]
		}

		function findNextEvent(schedule) {
			let futureEvents = schedule
				.sort((e1, e2) => e1.cronTime.unix() - e2.cronTime.unix())
				.filter((event) => event.cronTime.isAfter(dayjs()))

			if (futureEvents.length > 0) {
				return futureEvents.shift()
			} else {
				throw new Error('Done for today')
			}
		}

		const installMsgCronjobs = function (schedule) {
			stopMsgCrons()

			for (const event of schedule) {
				// override cronTimes for debugging purpose
				if (RED.settings.suncronMockTimes) {
					event.cronTime = dayjs().add(i * 5, 'second')
				}

				let cron = new CronJob({
					cronTime: event.cronTime.toDate(),
					onTick: () => {
						ejectMsg(event)
						setNodeStatus(
							'Sending message',
							'green'
						)
						setTimeout(() => {
							setNodeStatusToNextEvent(schedule)
						}, 2000)
					},
				})

				try {
					cron.start()
					msgCrons.push(cron)
				} catch (err) {
					debug(`${event.name}: ${err.message}`)
				}
			}

			debug(`${schedule.length} msg crons installed`)
			setNodeStatusToNextEvent(schedule)
		}

		const debug = function (debugMsg) {
			if (RED.settings.suncronDebug) {
				node.warn(debugMsg)
			}
		}

		const setNodeStatus = function (text, color = 'grey') {
			node.status({
				fill: color,
				shape: 'dot',
				text: text,
			})
		}

		const setNodeStatusToNextEvent = function (schedule) {
			try {
				const nextEvent = findNextEvent(schedule)
				setNodeStatus(
					`Scheduled @ ${nextEvent.cronTime.format('HH:mm')}`
				)
			} catch (err) {
				setNodeStatus(err.message)
			}
		}

		const stopMsgCrons = function () {
			if (msgCrons.length > 0) {
				msgCrons.forEach((cron) => {
					cron.stop()
				})

				debug(`${msgCrons.length} msg crons deleted`)
				msgCrons = []
			}
		}

		const ejectMsg = function ({ payload, payloadType, topic }) {
			const castPayload = (payload, payloadType) => {
				if (payloadType === 'num') {
					return Number(payload)
				} else if (payloadType === 'bool') {
					return payload === 'true'
				} else if (payloadType === 'json') {
					return JSON.parse(payload)
				} else {
					return payload
				}
			}

			node.send({
				topic,
				payload: castPayload(payload, payloadType),
			})
		}

		node.on('close', function () {
			stopMsgCrons()
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

	RED.nodes.registerType('suncron', SuncronNode)
}
