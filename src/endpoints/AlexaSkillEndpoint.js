'use strict'

const Endpoint = require('./Endpoint')

class AlexaSkillEndpoint extends Endpoint {
  constructor (alexaSkillConfig, func) {
    super(alexaSkillConfig, func)
    this.name = func.name
    this.method = 'POST'
    this.path = `/alexa-skill/${this.name}`
  }

  getLambdaEvent (request) {
    // Pass-through
    return request.body
  }

  handleLambdaSuccess (response, result) {
    response.send(result)
  }

  toString () {
    return `Alexa-Skill: ${this.name}`
  }
}

module.exports = AlexaSkillEndpoint
