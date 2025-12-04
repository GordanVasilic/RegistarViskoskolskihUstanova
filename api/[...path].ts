import app from './server'

export default function handler(req: any, res: any) {
  (app as any)(req, res)
}
