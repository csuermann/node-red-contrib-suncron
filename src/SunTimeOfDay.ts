// https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/function/10-switch.html
// https://github.com/node-red/node-red/blob/master/packages/node_modules/%40node-red/nodes/core/function/10-switch.js
import * as NodeRED from 'node-red'
import { SuncronLocationState } from './SuncronLocationDef'
import { SunTimeOfDayRuntimeConfig, SunTimeOfDayDataPoint } from './SunTimeOfDayDef'
import dayjs from 'dayjs'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType('sun-time-of-day',
		function (this: NodeRED.Node, config: SunTimeOfDayRuntimeConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			const location = RED.nodes.getNode(config.location) as NodeRED.Node<SuncronLocationState>

			node.on('input', function(msg) {
				const outputCount = config.dataPoints.length < 2 ? 0 : config.dataPoints.length - 1
				if (outputCount == 0) {
					return []
				}
				const retVal = Array<NodeRED.NodeMessageInFlow | null>(outputCount)
				retVal.fill(null)
				const sunTimes = location.credentials.sunTimes.value
				if (sunTimes == undefined) {
					node.error('Tried to use sun-time-of-day but sun times are not available yet.')
					return retVal
				}
				const now = dayjs(Date.now())
				const getTime = function (dataPoint: SunTimeOfDayDataPoint): dayjs.Dayjs | null {
					if (dataPoint.event == 'midnight') {
						if (dataPoint.offset < 0) {
							return null
						}
						return now
							.set('h', dataPoint.offset / 60)
							.set('m', dataPoint.offset % 60)
							.set('s', 0)
							.set('ms', 0)
					}
					const eventType = dataPoint.event
					const sunEventTime = dayjs(sunTimes[eventType])
					if (sunEventTime.isValid()) {
						return sunEventTime.add(dataPoint.offset, 'm')
					} else {
						return null
					}
				}
				for (let i = 0; i < config.dataPoints.length - 1; i++) {
					const first = getTime(config.dataPoints[i])
					if (first == null) { continue }
					const second = getTime(config.dataPoints[i + 1])
					if (second == null) { continue }
					// TODO: handle second event happening before first event
					if (first < now && now < second) {
						retVal[i] = msg
						break
					}
				}
				return retVal
			})
		}
	)
}
