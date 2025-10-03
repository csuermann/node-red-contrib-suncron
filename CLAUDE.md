# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node-RED node package that provides sun event-based scheduling functionality. The main node triggers configurable messages based on solar events like sunrise, sunset, golden hours, astronomical twilight, etc.

## Commands

### Testing
```bash
npm test                    # Run mocha tests
```

### Development
- No build step required - this is a standard Node.js module
- No linting commands configured in package.json
- Tests use Mocha with node-red-node-test-helper

## Architecture

### Core Files
- `suncron.js`: Main Node-RED node implementation containing the SuncronNode function
- `suncron.html`: Node-RED editor UI configuration with extensive HTML forms for each sun event
- `package.json`: Standard Node.js package with Node-RED node registration

### Key Dependencies
- `cron`: CronJob scheduling library for timing events
- `dayjs`: Date manipulation and formatting
- `suncalc`: Solar position calculations for determining sun event times

### Node Structure
The main `SuncronNode` function in `suncron.js` handles:
- **Schedule calculation**: Uses SunCalc library to compute sun event times for a given location
- **Cron job management**: Creates and manages multiple cron jobs for different sun events
- **Event handling**: Processes incoming messages and runtime configuration updates
- **Status updates**: Shows next event and current status in Node-RED UI

### Event System
- Supports 14 different sun events (sunrise, sunset, dawn, dusk, golden hours, etc.)
- Each event can have custom payload, topic, and time offset
- Schedule recalculates daily at midnight
- Provides both individual event messages and schedule update messages

### Configuration
- Latitude/longitude for location-based calculations
- Per-event payload/topic configuration with multiple data types (string, number, boolean, JSON)
- Offset support (hours/minutes, positive/negative)
- Options for startup replay and schedule emission

### Testing
- Uses `node-red-node-test-helper` for Node-RED specific testing
- Basic load test in `test/suncron_spec.js`
- Demo flow configuration in `test/demo.json`

## Development Notes

- The HTML file contains extensive UI configuration with repeated form sections for each of the 14 sun events
- Runtime offset updates are supported via incoming message objects
- Debug mode available via `RED.settings.suncronDebug`
- Mock timing mode for development via `RED.settings.suncronMockTimes`
- Events are skipped if their calculated time is in the past