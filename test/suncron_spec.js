var should = require('should')
var helper = require('node-red-node-test-helper')
var suncron = require('../suncron.js')
var demoFlow = require('./demo.json')

helper.init(require.resolve('node-red'))

describe('suncron Node', function () {
  beforeEach(function (done) {
    helper.startServer(done)
  })

  afterEach(function (done) {
    helper.unload()
    helper.stopServer(done)
  })

  it('should be loaded', function (done) {
    helper.load(suncron, demoFlow, function () {
      var n1 = helper.getNode('n1')
      n1.should.have.property('name', 'suncron')
      done()
    })
  })
})
