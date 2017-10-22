'use strict'

const path = require('path')
const Endpoint = require('./Endpoint')

class HttpEndpoint extends Endpoint {
  constructor (httpConfig, func) {
    super(httpConfig, func)
    if (typeof httpConfig === 'string') {
      let s = httpConfig.split(' ')
      httpConfig = {method: s[0], path: s[1]}
    }
    this.method = httpConfig.method
    this.resourcePath = httpConfig.path.replace(/\{([a-zA-Z_]+)\}/g, ':$1')
    this.path = path.join('/http', this.resourcePath)
  }

  getLambdaEvent (request) {
    return {
      httpMethod: request.method,
      body: JSON.stringify(request.body, null, '  '),
      queryStringParameters: request.query,
      pathParameters: request.params || {}
    }
  }

  handleLambdaSuccess (response, result) {
    if (result.headers) {
      response.set(result.headers)
    }
    response.status(result.statusCode)
    response.send(result.body === 'object' ? JSON.stringify(result.body) : result.body)
  }

  toString () {
    return `HTTP: ${this.method} ${this.resourcePath}`
  }
}

module.exports = HttpEndpoint
