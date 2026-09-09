"use client"

import { useEffect, useRef } from "react"

export function SpiderCursor() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let w, h
    const ctx = canvas.getContext("2d")
    const { sin, cos, PI, hypot, min, max } = Math

    function spawn() {
      const pts = many(333, () => {
        return {
          x: rnd(window.innerWidth),
          y: rnd(window.innerHeight),
          len: 0,
          r: 0,
        }
      })

      const pts2 = many(9, (i) => {
        return {
          x: cos((i / 9) * PI * 2),
          y: sin((i / 9) * PI * 2),
        }
      })

      const seed = rnd(100)
      let tx = rnd(window.innerWidth)
      let ty = rnd(window.innerHeight)
      let x = rnd(window.innerWidth)
      let y = rnd(window.innerHeight)
      const kx = rnd(0.5, 0.5)
      const ky = rnd(0.5, 0.5)
      const walkRadius = pt(rnd(50, 50), rnd(50, 50))
      const r = window.innerWidth / rnd(100, 150)

      function paintPt(pt) {
        pts2.forEach((pt2) => {
          if (!pt.len) return
          drawLine(
            lerp(x + pt2.x * r, pt.x, pt.len * pt.len),
            lerp(y + pt2.y * r, pt.y, pt.len * pt.len),
            x + pt2.x * r,
            y + pt2.y * r,
          )
        })
        drawCircle(pt.x, pt.y, pt.r)
      }

      return {
        follow(x, y) {
          tx = x
          ty = y
        },

        tick(t) {
          const selfMoveX = cos(t * kx + seed) * walkRadius.x
          const selfMoveY = sin(t * ky + seed) * walkRadius.y
          const fx = tx + selfMoveX
          const fy = ty + selfMoveY

          x += min(window.innerWidth / 100, (fx - x) / 10)
          y += min(window.innerWidth / 100, (fy - y) / 10)

          let i = 0
          pts.forEach((pt) => {
            const dx = pt.x - x,
              dy = pt.y - y
            const len = hypot(dx, dy)
            let r = min(2, window.innerWidth / len / 5)
            pt.t = 0
            const increasing = len < window.innerWidth / 10 && i++ < 8
            const dir = increasing ? 0.1 : -0.1
            if (increasing) {
              r *= 1.5
            }
            pt.r = r
            pt.len = max(0, min(pt.len + dir, 1))
            paintPt(pt)
          })
        },
      }
    }

    const spiders = many(2, spawn)

    const handlePointerMove = (e) => {
      spiders.forEach((spider) => {
        spider.follow(e.clientX, e.clientY)
      })
    }

    function anim(t) {
      if (w !== window.innerWidth) w = canvas.width = window.innerWidth
      if (h !== window.innerHeight) h = canvas.height = window.innerHeight
      ctx.fillStyle = "#000"
      drawCircle(0, 0, w * 10)
      ctx.fillStyle = ctx.strokeStyle = "#fff"
      t /= 1000
      spiders.forEach((spider) => spider.tick(t))
      requestAnimationFrame(anim)
    }

    function rnd(x = 1, dx = 0) {
      return Math.random() * x + dx
    }

    function drawCircle(x, y, r) {
      ctx.beginPath()
      ctx.ellipse(x, y, r, r, 0, 0, PI * 2)
      ctx.fill()
    }

    function drawLine(x0, y0, x1, y1) {
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      many(100, (i) => {
        i = (i + 1) / 100
        const x = lerp(x0, x1, i)
        const y = lerp(y0, y1, i)
        const k = noise(x / 5 + x0, y / 5 + y0) * 2
        ctx.lineTo(x + k, y + k)
      })
      ctx.stroke()
    }

    function many(n, f) {
      return [...Array(n)].map((_, i) => f(i))
    }

    function lerp(a, b, t) {
      return a + (b - a) * t
    }

    function noise(x, y, t = 101) {
      const w0 = sin(0.3 * x + 1.4 * t + 2.0 + 2.5 * sin(0.4 * y + -1.3 * t + 1.0))
      const w1 = sin(0.2 * y + 1.5 * t + 2.8 + 2.3 * sin(0.5 * x + -1.2 * t + 0.5))
      return w0 + w1
    }

    function pt(x, y) {
      return { x, y }
    }

    window.addEventListener("pointermove", handlePointerMove)
    requestAnimationFrame(anim)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [])

  return (
    <div className="overflow-hidden m-0 w-full h-screen">
      <canvas ref={canvasRef} className="block" style={{ display: "block" }} />
    </div>
  )
}