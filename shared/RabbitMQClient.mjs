import amqp from 'amqplib'

const once = (fnToCall) => {
  let called = false
  let result
  return (...args) => {
    if (!called) {
      called = true
      result = fnToCall(...args)
    }
    return result
  }
}

class RabbitMQClient {

  /**
   * @type {amqp.Connection}
   */
  #connection

  /**
   * @type {amqp.Channel}
   */
  #channel

  /**
   * @type {string}
   */
  #connectionString = ''

  /**
   * @type {{[queueName: string]: Array<(message, responses: {ack: () => void, nack: () => void}) => void>}}
   */
  #queues = {}

  /**
   * @type {RabbitMQClient}
   */
  static #instance = null

  static async create (config) {
    if (!RabbitMQClient.#instance) RabbitMQClient.#instance = (new RabbitMQClient()).#connect(config)
    return RabbitMQClient.#instance
  }

  async #connect (config) {
    if (!this.#connectionString && config) this.#connectionString = `amqp://${config.username}:${config.password}@${config.host}`
    this.#connection = await amqp.connect(this.#connectionString)
    this.#channel = await this.#connection.createChannel()
    return this
  }

  async #checkForConnection () {
    if (!this.#connection) await this.#connect()
    return this
  }

  #unsubscribe (queue, handler) {
    if (!this.#queues[queue]) return
    this.#queues[queue] = this.#queues[queue].filter(h => h !== handler)
  }

  async sendMessage (queue, message) {
    this.#checkForConnection()
    await this.#channel.assertQueue(queue, { durable: true })
    this.#channel.sendToQueue(queue, Buffer.from(message))
  }

  /**
   * @param {string} queue
   * @param {(message: Buffer, responses: {ack: ()=>void, nack: ()=>void}) => () => void} handler
   */
  async listen (queue, handler) {
    this.#checkForConnection()
    if (this.#queues[queue]) {
      const existingHandler = this.#queues[queue].find(h => h === handler)
      if (existingHandler) return () => this.#unsubscribe(queue, existingHandler)
      this.#queues[queue].push(handler)
      return () => this.#unsubscribe(queue, handler)
    }

    await this.#channel.assertQueue(queue, { durable: true })
    this.#queues[queue] = [handler]
    this.#channel.consume(queue, async (message) => {
      const ack = once(() => this.#channel.ack(message))
      const nack = once(() => this.#channel.nack(message))
      this.#queues[queue].forEach(handler => handler(message, { ack, nack }))
    })

    return () => this.#unsubscribe(queue, handler)
  }
}

export { RabbitMQClient }
