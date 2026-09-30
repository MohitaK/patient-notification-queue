import { Worker, Job } from 'bullmq'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
}

interface NotificationJob {
  patientId: string
  type: string
  message: string
}

async function processNotification(job: Job<NotificationJob>): Promise<void> {
  const { patientId, type, message } = job.data

  console.log(`[PROCESSING] Job ${job.id} | type=${type} patient=${patientId}`)

  // Simulate sending notification (email/SMS) - eg: await smsProvider.send({ patientId, message })
  await new Promise((r) => setTimeout(r, 200))

  console.log(`[SENT] patient=${patientId} | "${message}"`)
}

const worker = new Worker<NotificationJob>('notifications', processNotification, {
  connection,
  concurrency: 3,
})

worker.on('completed', (job) => {
  console.log(`[DONE] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[FAILED] Job ${job?.id} | ${err.message}`)
})

console.log('Worker started, waiting for jobs...')
