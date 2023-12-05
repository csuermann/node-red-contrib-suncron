import * as NodeRED from 'node-red'
import { SuncronLocationState } from './SuncronLocationDef'
import { SunTimeOfDayRuntimeConfig, SuncronDataPoint } from './SunTimeOfDayDef'
import dayjs from 'dayjs'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType('sun-time-of-day',
		function (this: NodeRED.Node, config: SunTimeOfDayRuntimeConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			const location = RED.nodes.getNode(config.location) as NodeRED.Node<SuncronLocationState>

			node.on('input', function(msg) {
				if (config.outputs == 0) {
					return
				}
				const retVal = Array<NodeRED.NodeMessageInFlow | null>(config.outputs)
				retVal.fill(null)
				const sunTimes = location.credentials.sunTimes.value
				const now = dayjs(Date.now())
				const getTime = function (dataPoint: SuncronDataPoint): dayjs.Dayjs | null {
					if (dataPoint.event == 'midnight') {
						if (dataPoint.offset < 0) {
							return null
						}
						return now
							.set('h', (dataPoint.offset / 60) % 24)
							.set('m', dataPoint.offset % 60)
							.set('s', 0)
							.set('ms', 0)
							.add(dataPoint.offset / 60 / 24, 'day')
					}
					const eventType = dataPoint.event
					const sunEventTime = dayjs(sunTimes[eventType])
					if (sunEventTime.isValid()) {
						return sunEventTime.add(dataPoint.offset, 'm')
					} else {
						return null
					}
				}
				for (let i = 0; i < config.outputs; i++) {
					const first = getTime(config.dataPoints[i])
					if (first == null) { continue }
					const second = getTime(config.dataPoints[i + 1])
					if (second == null) { continue }
					if (first.isBefore(second)) {
						if (first.isBefore(now) && now.isBefore(second)) {
							retVal[i] = msg
							node.send(retVal)
							break
						}
					} else {
						if (first.isBefore(now) || now.isBefore(second)) {
							retVal[i] = msg
							node.send(retVal)
							break
						}
					}
				}
			})
		}
	)
}
