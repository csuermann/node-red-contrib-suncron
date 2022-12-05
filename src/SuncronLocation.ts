import * as NodeRED from 'node-red'
import { BehaviorSubject } from 'rxjs'
import { CronJob } from 'cron'
import * as SunCalc from 'suncalc'
import { SuncronLocationRuntimeConfig, SuncronLocationState } from './SuncronLocationDef'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType('suncron-location',
		function (this: NodeRED.Node<SuncronLocationState>, config: SuncronLocationRuntimeConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			node.credentials = {
				sunTimes: new BehaviorSubject<SunCalc.GetTimesResult | undefined>(undefined)
			}

			const updateSunTimes = function (): void {
				const today = new Date()
				const midday = new Date(
					today.getFullYear(),
					today.getMonth(),
					today.getDate(),
					12,
					0,
					0,
					0
				)
				const sunTimes = SunCalc.getTimes(midday, config.lat, config.lon)
				node.credentials.sunTimes.next(sunTimes)
			}

			const dailyCron = new CronJob({
				cronTime: '1 0 0 * * *',
				onTick: () => {
					updateSunTimes()
				},
			})
			
			updateSunTimes()
			dailyCron.start()

			node.on('close', function (): void {
				dailyCron.stop()
			})
		}
	)
}
