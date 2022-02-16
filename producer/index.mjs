import { RabbitMQClient } from '../shared/RabbitMQClient.mjs'
import { default as actionMessages } from '../proto/tasks_pb.js'
import { TaskQueues } from '../shared/queues.mjs'

const config = {
  host: process.env.RABBITMQ_HOSTNAME,
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD
}
const broker = await RabbitMQClient.create(config)
const IDs = new Set()

async function createNewTask () {
  const id = Date.now().toString(16)
  console.log(`[PRODUCER] Adicionando nova tarefa: ${id}`)
  IDs.add(id)

  const task = new actionMessages.CreateTask()
  task.setId(id)
    .setTitle(`Task ${id}`)
    .setAssignee('Lucas')
    .setCreated((new Date).toISOString())
    .setDone(false)

  if (Math.random() > 0.5) {
    task.setDescription('Tarefa com ID ' + id + ' foi criada!')
    const dueDate = new Date()
    dueDate.setDate((new Date).getDate() + Math.floor(Math.random() * 10))
    task.setDuedate(dueDate.toISOString())
    task.setPriority(Math.floor(Math.floor(Math.random() * 3)) + 1)
  }

  const payload = task.serializeBinary()
  await broker.sendMessage(TaskQueues.taskCreationQueue, payload)
  console.log(`[PRODUCER] Mensagem enviada ${task.getId()}`)
}

async function changeTaskStatus (id) {
  console.log(`[PRODUCER] Alterando status da tarefa: ${id}`)
  const task = new actionMessages.ChangeTaskStatus()
  task.setId(id)
    .setDone(Math.floor(Math.random()) > 0.5)
  await broker.sendMessage(TaskQueues.taskStatusChangeQueue, task.serializeBinary())
}

async function deleteTask (id) {
  console.log(`[PRODUCER] Removendo tarefa: ${id}`)
  const task = new actionMessages.DeleteTask()
  task.setId(id)
  await broker.sendMessage(TaskQueues.taskDeletionQueue, task.serializeBinary())
  IDs.delete(id)
}

createNewTask()
setInterval(createNewTask, Math.random() * 5000)

setInterval(async () => {
  const id = Array.from(IDs)[Math.floor(Math.random() * IDs.size)]
  await changeTaskStatus(id)
}, Math.random() * 10000)


setInterval(async () => {
  const id = Array.from(IDs)[Math.floor(Math.random() * IDs.size)]
  await deleteTask(id)
}, Math.random() * 8000)
