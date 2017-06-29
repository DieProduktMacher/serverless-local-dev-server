'use strict'

const Server = require('./Server.js')

class ServerlessPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options || {}

    this.commands = {
      'local-dev-server': {
        usage: 'Runs a local dev server for Alexa-Skill and HTTP functions',
        lifecycleEvents: [ 'start' ],
        options: {
          port: { usage: 'Port to listen on', shortcut: 'p' }
        }
      }
    }

    this.hooks = {
      'local-dev-server:start': this.start.bind(this)
    }
  }

  start () {
    let server = new Server()
    server.log = this.serverless.cli.log.bind(this.serverless.cli)
    server.setFunctions(this.serverless.service, this.serverless.config.servicePath)
    server.start(this.options.port || 5005)
  }
}

module.exports = ServerlessPlugin
