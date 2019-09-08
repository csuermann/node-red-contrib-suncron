const CronJob = require('cron').CronJob
const dayjs = require('dayjs')
const SunCalc = require('suncalc')

module.exports = function (RED) {
  function SuncronNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    const eventTypes = [
      'sunrise',
      'sunriseEnd',
      'goldenHourEnd',
      'solarNoon',
      'goldenHour',
      'sunsetStart',
      'sunset',
      'dusk',
      'nauticalDusk',
      'night',
      'nadir',
      'nightEnd',
      'nauticalDawn',
      'dawn'
    ]

    let msgCrons = []
    let dailyCron = []

    const calcScheduleForToday = function () {
      let today = new Date()
      let sunTimes = SunCalc.getTimes(today, config.lat, config.lon)

      return eventTypes.reduce((result, eventType) => {
        const payload = config[`${eventType}Payload`]

        if (payload !== '') {
          const payloadType = config[`${eventType}PayloadType`]
          const topic = config[`${eventType}Topic`]
          const sunEventTime = dayjs(sunTimes[eventType])
          const offsetSec = config[`${eventType}Offset`]
          const offsetType = config[`${eventType}OffsetType`]
          const offset = offsetSec * offsetType
          let cronTime

          if (offset > 0) {
            cronTime = dayjs(sunEventTime).add(offsetSec, 'second')
          } else {
            cronTime = dayjs(sunEventTime).subtract(offsetSec, 'second')
          }

          result[eventType] = {
            event: eventType,
            sunEventTimeUTC: sunEventTime.toISOString(),
            sunEventTimeLocal: sunEventTime.format('YYYY-MM-DDTHH:mm:ss'),
            offset: offsetSec * offsetType,
            cronTime,
            cronTimeUTC: cronTime.toISOString(),
            cronTimeLocal: cronTime.format('YYYY-MM-DDTHH:mm:ss'),
            payload,
            payloadType,
            topic
          }
        }
        return result
      }, {})
    }

    const formatSchedule = function (schedule) {
      let result = {}
      for (let eventType in schedule) {
        let event = schedule[eventType]
        result[eventType] = {
          event: eventType,
          sunEventTime: event.sunEventTimeLocal,
          cronTime: event.cronTimeLocal
        }
      }
      return result
    }

    const installMsgCronjobs = function (schedule) {
      stopMsgCrons()

      let i = 0

      for (let eventType in schedule) {
        i++

        let event = schedule[eventType]

        // override cronTimes for debugging purpose
        if (RED.settings.suncronMockTimes) {
          event.cronTime = dayjs().add(i * 5, 'second')
        }

        let cron = new CronJob({
          cronTime: event.cronTime.toDate(),
          onTick: () => {
            ejectMsg(event, schedule)
            setNodeStatus(`${event.event} at ${event.cronTime.format('HH:mm')}`)
          }
        })

        try {
          cron.start()
          msgCrons.push(cron)
        } catch (err) {
          debug(`${event.event}: ${err.message}`)
        }
      }

      debug(`${i} msg crons installed`)
      setNodeStatus(`${i} crons active`)
    }

    const installDailyCronjob = function () {
      // run daily cron 5 seconds past midnight (except for debugging: 5 seconds past the full minute)
      const cronTime = RED.settings.suncronMockTimes
        ? '5 * * * * *'
        : '5 0 0 * * *'

      const cron = new CronJob({
        cronTime,
        onTick: () => {
          installMsgCronjobs(calcScheduleForToday())
          setNodeStatus(`updated for ${dayjs().format('ddd, MMM D')}`)
        }
      })
      cron.start()
      return cron
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
        text: text
      })
    }

    const stopMsgCrons = function () {
      if (msgCrons.length > 0) {
        msgCrons.forEach(cron => {
          cron.stop()
        })

        debug(`${msgCrons.length} msg crons deleted`)
        msgCrons = []
      }
    }

    const ejectMsg = function ({ payload, payloadType, topic }, schedule) {
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
        schedule: formatSchedule(schedule)
      })
    }

    node.on('close', function () {
      stopMsgCrons()
      dailyCron.stop()
    })
    ;(function () {
      // on startup:

      const schedule = calcScheduleForToday()
      debug(schedule)

      installMsgCronjobs(schedule)

      dailyCron = installDailyCronjob()
    })()
  }

  RED.nodes.registerType('suncron', SuncronNode)
}
