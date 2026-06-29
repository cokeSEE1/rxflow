import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import { auth } from '../middleware/auth'

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPG/PNG/GIF/WebP/BMP 格式'))
    }
  },
})

const router = Router()
router.use(auth)

router.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: '文件大小不能超过 10MB' })
        }
        return res.status(400).json({ error: err.message })
      }
      if (!req.file) {
        return res.status(400).json({ error: '请选择文件' })
      }
      const url = `/uploads/${req.file.filename}`
      res.json({ url, name: req.file.originalname })
    })
  },
)

export default router
