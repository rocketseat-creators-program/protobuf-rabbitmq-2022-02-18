import { RabbitMQClient } from '../shared/RabbitMQClient.mjs'
import { default as actionMessages } from '../proto/tasks_pb.js'
import { TaskQueues } from '../shared/queues.mjs'

const config = {
  host: process.env.RABBITMQ_HOSTNAME,
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD
}
const broker = await RabbitMQClient.create(config)
const tasks = new Map()
const locked = new Set()

broker.listen(TaskQueues.taskCreationQueue, async (message, { ack }) => {
  const rawTask = actionMessages.CreateTask.deserializeBinary(message.content)
  console.log(`[CONSUMER] Nova tarefa recebida: ${rawTask.getId()}`)
  const task = {
    id: rawTask.getId(),
    title: rawTask.getTitle(),
    assignee: rawTask.getAssignee(),
    created: new Date(rawTask.getCreated()),
    done: rawTask.getDone(),
    description: rawTask.getDescription(),
    dueDate: rawTask.getDuedate() ? new Date(rawTask.getDuedate()) : null,
    priority: rawTask.getPriority()
  }
  tasks.set(task.id, task)
  console.log(`[CONSUMER] Tarefa adicionada: ${task.id}`)
  // console.log(`[CONSUMER] Tarefas atuais (${tasks.size}):`, Array.from(tasks.values()))
  ack()
})

broker.listen(TaskQueues.taskDeletionQueue, (message, { ack, nack }) => {
  const rawTask = actionMessages.DeleteTask.deserializeBinary(message.content)
  console.log(`[CONSUMER] Removendo tarefa: ${rawTask.getId()}`)
  if (locked.has(rawTask.getId())) {
    console.log(`[CONSUMER] Tarefa bloqueada: ${rawTask.getId()}`)
    return nack()
  }

  tasks.delete(rawTask.getId())
  // console.log(`[CONSUMER] Tarefas atuais (${tasks.size}):`, Array.from(tasks.values()))
  ack()
})

broker.listen(TaskQueues.taskStatusChangeQueue, (message, { ack }) => {
  const rawTask = actionMessages.ChangeTaskStatus.deserializeBinary(message.content)
  console.log(`[CONSUMER] Alterando status da tarefa: ${rawTask.getId()}`)
  const task = tasks.get(rawTask.getId())
  if (!task) {
    console.log(`[CONSUMER] Tarefa não encontrada: ${rawTask.getId()}`)
    return ack()
  }

  locked.add(rawTask.getId())
  task.done = rawTask.getDone()
  console.log(`[CONSUMER] Tarefa alterada: ${task.id} para ${task.done}`)
  locked.delete(rawTask.getId())
  // console.log(`[CONSUMER] Tarefas atuais (${tasks.size}):`, Array.from(tasks.values()))
  ack()
})
