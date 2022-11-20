import * as NodeRED from 'node-red'
import { BehaviorSubject } from 'rxjs'
import * as SunCalc from 'suncalc'

export interface SuncronLocationConfig extends NodeRED.NodeDef {
	lat: number
	lon: number
}

export interface SuncronLocationState {
	sunTimes: BehaviorSubject<SunCalc.GetTimesResult | undefined>
}

export type SunEvent = keyof SunCalc.GetTimesResult
