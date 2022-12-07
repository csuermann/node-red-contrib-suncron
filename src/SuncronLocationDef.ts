import * as NodeRED from 'node-red'
import * as EditorClient from '@node-red/editor-client'
import { BehaviorSubject } from 'rxjs'
import * as SunCalc from 'suncalc'

export interface SuncronLocationRuntimeConfig extends SuncronLocationConfig, NodeRED.NodeDef {}
export interface SuncronLocationEditorConfig extends SuncronLocationConfig, EditorClient.NodeProperties {}
interface SuncronLocationConfig {
	lat: number
	lon: number
}

export interface SuncronLocationState {
	sunTimes: BehaviorSubject<SunCalc.GetTimesResult>
}

export type SunEvent = keyof SunCalc.GetTimesResult
