import express from 'express'
import { Queue } from 'bullmq'

const app = express()
app.use(express.json())

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
}

const queue = new Queue('notifications', { connection })

type NotificationType = 'lab_result' | 'appointment' | 'rx_ready'

interface NotifyRequest {
  patientId: string
  type: NotificationType
  priority: 'critical' | 'normal'
  message: string
}

app.post('/notify', async (req, res) => {
  const { patientId, type, priority, message } = req.body as NotifyRequest

  if (!patientId || !type || !message) {
    res.status(400).json({ error: 'patientId, type, and message are required' })
    return
  }

  const job = await queue.add(
    'send-notification',
    { patientId, type, message },
    {
      priority: priority === 'critical' ? 1 : 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    }
  )

  console.log(`[QUEUED] Job ${job.id} | patient=${patientId} type=${type} priority=${priority}`)
  res.json({ jobId: job.id, queued: true })
})

app.listen(3000, () => console.log('Producer listening on http://localhost:3000'))
