import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import prescriptionRoutes from './routes/prescriptions'
import patientRoutes from './routes/patients'
import notificationRoutes from './routes/notifications'
import dashboardRoutes from './routes/dashboard'
import drugRoutes from './routes/drugs'
import dispensingRoutes from './routes/dispensing'
import signatureRoutes from './routes/signatures'
import auditRoutes from './routes/audit'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/drugs', drugRoutes)
app.use('/api/dispensing', dispensingRoutes)
app.use('/api/signatures', signatureRoutes)
app.use('/api/audit-logs', auditRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`RxFlow backend running on http://localhost:${config.port}`)
})
