/**
 * 프론트엔드(Vite, 5173) + 로컬 API 서버(3000)를 한 번에 실행
 * 사용법: npm run dev:all
 * Ctrl+C 로 두 프로세스를 함께 종료합니다.
 */
import { spawn } from 'node:child_process'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const node = process.execPath

const procs = [
  { name: 'api ', color: '\x1b[35m', args: [join(ROOT, 'scripts', 'dev-api.mjs')] },
  { name: 'vite', color: '\x1b[36m', args: [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')] },
]

const children = procs.map(({ name, color, args }) => {
  const child = spawn(node, args, { cwd: ROOT, env: { ...process.env, FORCE_COLOR: '1' } })
  const prefix = `${color}[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    let buf = ''
    stream.on('data', (d) => {
      buf += d.toString()
      const lines = buf.split(/\r?\n/)
      buf = lines.pop()
      for (const l of lines) out.write(prefix + l + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => {
    console.log(`${prefix}종료됨 (code ${code})`)
    shutdown(code ?? 0)
  })
  return child
})

let shuttingDown = false
function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const c of children) if (c.exitCode === null) c.kill()
  setTimeout(() => process.exit(code), 300)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
