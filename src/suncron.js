const CronJob = require('cron').CronJob
const dayjs = require('dayjs')
const SunCalc = require('suncalc')

module.exports = function (RED) {
  function SuncronNode(config) {
    RED.nodes.createNode(this, config)

    const node = this

    let schedule

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
      'dawn',
    ]

    let msgCrons = []
    let dailyCron = []

    const letsGo = function () {
      schedule = calcScheduleForToday()

      installMsgCronjobs(schedule)
      debug(schedule)

      dailyCron = installDailyCronjob()
    }

    const calcScheduleForToday = function () {
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

      const eventType = config.sunEventType
      const payload = config.payload
      const payloadType = config.payloadType
      const topic = config.topic
      const sunEventTime = dayjs(sunTimes[eventType])
      const offset = config.offset
      const cronTime = dayjs(sunEventTime).add(offset, 'minute')

      return {
        [eventType]: {
          event: eventType,
          sunEventTimeUTC: sunEventTime.toISOString(),
          sunEventTimeLocal: sunEventTime.format('YYYY-MM-DDTHH:mm:ss'),
          offset: offset,
          cronTime,
          cronTimeUTC: cronTime.toISOString(),
          cronTimeLocal: cronTime.format('YYYY-MM-DDTHH:mm:ss'),
          payload,
          payloadType,
          topic,
        }
      }
    }

    const formatSchedule = function (schedule) {
      let result = {}
      for (let eventType in schedule) {
        let event = schedule[eventType]
        result[eventType] = {
          event: eventType,
          sunEventTime: event.sunEventTimeLocal,
          cronTime: event.cronTimeLocal,
          offset: event.offset,
        }
      }
      return result
    }

    function findNextEvent(schedule) {
      let futureEvents = Object.keys(schedule)
        .map((eventType) => ({
          eventName: eventType,
          eventTime: schedule[eventType].cronTime,
        }))
        .sort((e1, e2) => e1.eventTime.unix() - e2.eventTime.unix())
        .filter((event) => event.eventTime.isAfter(dayjs()))

      if (futureEvents.length > 0) {
        return futureEvents.shift()
      } else {
        throw new Error('Done for today')
      }
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
            setNodeStatus(
              `Now: ${event.event} @ ${event.cronTime.format('HH:mm')}`,
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
          debug(`${event.event}: ${err.message}`)
        }
      }

      debug(`${i} msg crons installed`)
      setNodeStatus(`${i} crons active`)
      setTimeout(() => {
        setNodeStatusToNextEvent(schedule)
      }, 2000)
    }

    const installDailyCronjob = function () {
      // run daily cron 5 seconds past midnight (except for debugging: 5 seconds past the full minute)
      const cronTime = RED.settings.suncronMockTimes
        ? '5 * * * * *'
        : '5 0 0 * * *'

      const cron = new CronJob({
        cronTime,
        onTick: () => {
          schedule = calcScheduleForToday()
          installMsgCronjobs(schedule)
          setNodeStatusToNextEvent(schedule)
        },
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
        text: text,
      })
    }

    const setNodeStatusToNextEvent = function (schedule) {
      try {
        const nextEvent = findNextEvent(schedule)
        setNodeStatus(
          `Scheduled @ ${nextEvent.eventTime.format('HH:mm')}`
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

      let formatedSchedule = formatSchedule(schedule)
      let next

      try {
        next = formatedSchedule[findNextEvent(schedule).eventName]
      } catch (e) {
        next = null
      }

      node.send({
        topic,
        payload: castPayload(payload, payloadType),
        schedule: formatedSchedule,
        next,
      })
    }

    node.on('close', function () {
      stopMsgCrons()
      dailyCron.stop()
    })
    ;(function () {
      // on startup:
      try {
        letsGo()
      } catch (e) {
        console.log(e)
      }
    })()
  }

  RED.nodes.registerType('suncron-pro', SuncronNode)
}
