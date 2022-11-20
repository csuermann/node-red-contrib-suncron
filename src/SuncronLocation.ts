import * as NodeRED from 'node-red'
import { BehaviorSubject } from 'rxjs'
import { CronJob } from 'cron'
import * as SunCalc from 'suncalc'
import { SuncronLocationRuntimeConfig, SuncronLocationState } from './SuncronLocationDef'

export = (RED: NodeRED.NodeAPI): void => {
	RED.nodes.registerType<NodeRED.Node<SuncronLocationState>, SuncronLocationRuntimeConfig, {}, {}>('suncron-location',
		function (this: NodeRED.Node<SuncronLocationState>, config: SuncronLocationRuntimeConfig): void {
			RED.nodes.createNode(this, config)
			const node = this
			let closed = false
			let updateRetry: NodeJS.Timeout | undefined
			let dailyCron: CronJob | undefined

			const updateSunTimes = function (): void {
				try {
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
				} catch (e) {
					node.error(e)
					if (!closed) {
						updateRetry = setTimeout(updateSunTimes, 60_000)
					}
				}
			}

			const installDailyCronjob = function (): CronJob {  
				const cron = new CronJob({
					cronTime: '5 0 0 * * *',
					onTick: () => {
						updateSunTimes()
					},
				})
				cron.start()
				return cron
			}

			node.on('close', function (): void {
				closed = true
				dailyCron?.stop()
				clearTimeout(updateRetry)
			})

			try {
				updateSunTimes()
				dailyCron = installDailyCronjob()
			} catch (error) {
				node.error(error)
			}
		},
		{
			credentials: {
				sunTimes: new BehaviorSubject(undefined)
			}
		}
	)
}
