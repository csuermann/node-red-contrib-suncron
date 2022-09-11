import * as NodeRED from 'node-red'
import { CronJob } from 'cron'
import { SuncronConfig, SuncronEvent } from './SuncronDef'
import * as SunCalc from 'suncalc'
import dayjs from 'dayjs'
import { SuncronLocationState } from './SuncronLocationDef'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType('suncron',
		function (this: NodeRED.Node, config: SuncronConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			let schedule: Array<SuncronEvent> = []
			let msgCrons: Array<CronJob> = []

			const calcScheduleForToday = function (sunTimes: SunCalc.GetTimesResult): Array<SuncronEvent> {
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
			

			function findNextEvent(schedule: Array<SuncronEvent>): SuncronEvent {
				const futureEvents = schedule
					.sort((e1, e2) => e1.cronTime.unix() - e2.cronTime.unix())
					.filter((event) => event.cronTime.isAfter(dayjs()))
				const nextEvent = futureEvents.shift()
				if (nextEvent != undefined) {
					return nextEvent
				} else {
					throw Error('Done for today')
				}
			}

			const installMsgCronjobs = function (schedule: Array<SuncronEvent>): void {
				stopMsgCrons()
	
				for (const event of schedule) {
					const cron = new CronJob({
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
					} catch (error) {
						node.error(error)
					}
				}
	
				setNodeStatusToNextEvent(schedule)
			}

			const setNodeStatus = function (text: string, color: NodeRED.NodeStatusFill = 'grey'): void {
				node.status({
					fill: color,
					shape: 'dot',
					text: text,
				})
			}

			const setNodeStatusToNextEvent = function (schedule: Array<SuncronEvent>): void {
				try {
					const nextEvent = findNextEvent(schedule)
					setNodeStatus(`Scheduled @ ${nextEvent.cronTime.format('HH:mm')}`)
				} catch (error) {
					setNodeStatus((error as Error).message)
				}
			}

			const stopMsgCrons = function (): void {
				if (msgCrons.length > 0) {
					msgCrons.forEach((cron) => {
						cron.stop()
					})
					msgCrons = []
				}
			}

			const ejectMsg = function (event: SuncronEvent): void {
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
					topic: event.topic,
					payload: castPayload(event.payload, event.payloadType),
				})
			}
			
			node.on('close', function () {
				stopMsgCrons()
			})

			try {
				setNodeStatus('Setting up...')
				const location = RED.nodes.getNode(config.location) as NodeRED.Node<SuncronLocationState>
				location.credentials.sunTimes.subscribe({ next: (sunTimes) => {
					if (sunTimes == null) { return }
					schedule = calcScheduleForToday(sunTimes)
					installMsgCronjobs(schedule)
				}})
			} catch (error) {
				node.error(error)
			}
		}
	)
}