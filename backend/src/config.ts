export const config = {
  port: parseInt(process.env.PORT || '3000'),
  jwtSecret: process.env.JWT_SECRET || 'rxflow-dev-secret-change-in-production',
  jwtExpiresIn: '2h',
  jwtRefreshExpiresIn: '7d',
}
