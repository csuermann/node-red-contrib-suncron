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

      if (config.replay === true) {
        try {
          const mostRecentEvent = findMostRecentEvent(schedule)

          setTimeout(() => {
            ejectMsg(mostRecentEvent, schedule)
          }, 500)
        } catch (e) {
          debug(e)
        }
      }

      installMsgCronjobs(schedule)
      setTimeout(() => {
        ejectSchedule(schedule)
      }, 500)
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

          try {
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
              topic,
            }
          } catch (e) {
            console.log(
              `ignoring event type '${eventType}' as no event time could be determined for current day.`
            )
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
        throw new Error('done for today')
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
              `now: ${event.event} @ ${event.cronTime.format('HH:mm')}`,
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
          ejectSchedule(schedule)
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
          `next: ${nextEvent.eventName} @ ${nextEvent.eventTime.format(
            'HH:mm'
          )}`
        )
      } catch (err) {
        setNodeStatus(err.message)
      }
    }

    const findMostRecentEvent = function (schedule) {
      let pastEvents = Object.keys(schedule)
        .map((eventType) => schedule[eventType])
        .sort((e1, e2) => e2.cronTime.unix() - e1.cronTime.unix())
        .filter((event) => event.cronTime.isBefore(dayjs()))

      if (pastEvents.length > 0) {
        return pastEvents.shift()
      } else {
        throw new Error('no past events')
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

    const ejectSchedule = function (schedule) {
      if (!config.ejectScheduleOnUpdate) {
        return
      }
      node.send({
        topic: 'suncron:schedule',
        payload: formatSchedule(schedule),
      })
    }

    node.on('input', function (msg, send, done) {
      send =
        send ||
        function () {
          node.send.apply(node, arguments)
        }
      if (typeof msg.payload === 'object') {
        // config object received as msg.payload
        debug(`!!!! CONFIG OBJECT RECEIVED !!!`)
        // debug(msg.payload)

        eventTypes.forEach((eventType) => {
          if (
            msg.payload.hasOwnProperty(eventType) &&
            Number.isInteger(msg.payload[eventType])
          ) {
            debug(`new offset for ${eventType}: ${msg.payload[eventType]}`)
            config[`${eventType}Offset`] = Math.abs(msg.payload[eventType])
            config[`${eventType}OffsetType`] =
              msg.payload[eventType] < 0 ? -1 : 1
          }
        })

        letsGo()
      } else {
        try {
          const mostRecentEvent = findMostRecentEvent(schedule)
          ejectMsg(mostRecentEvent, schedule)
        } catch (e) {
          debug(e)
        }
      }

      if (done) {
        done()
      }
    })

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

  RED.nodes.registerType('suncron', SuncronNode)
}
