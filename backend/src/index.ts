import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import prescriptionRoutes from './routes/prescriptions'
import patientRoutes from './routes/patients'
import notificationRoutes from './routes/notifications'
import dashboardRoutes from './routes/dashboard'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`RxFlow backend running on http://localhost:${config.port}`)
})
