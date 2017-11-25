'use strict'

const Server = require('./Server.js')

class ServerlessLocalDevServerPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options || {}

    this.commands = {
      'local-dev-server': {
        usage: 'Runs a local dev server for Alexa-Skill and HTTP functions',
        lifecycleEvents: ['loadEnvVars', 'start'],
        options: {
          port: {usage: 'Port to listen on', shortcut: 'p'}
        }
      }
    }

    this.hooks = {
      'local-dev-server:loadEnvVars': this.loadEnvVars.bind(this),
      'local-dev-server:start': this.start.bind(this)
    }
  }

  loadEnvVars () {
    Object.assign(process.env, {IS_LOCAL: true})
  }

  start () {
    this.server = new Server()
    this.server.log = this.serverless.cli.log.bind(this.serverless.cli)
    Object.assign(this.server.customEnvironment, this.options.environment)
    this.server.setConfiguration(this.serverless.service, this.serverless.config.servicePath)
    let customPort = this.serverless.service && this.serverless.service.custom && this.serverless.service.custom.localDevPort
    this.server.start(customPort || this.options.port || 5005)
  }
}

module.exports = ServerlessLocalDevServerPlugin
