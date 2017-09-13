interface SvgTransformMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

function mul(m: SvgTransformMatrix, n: SvgTransformMatrix) {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  }
}

const cache = new Map<string, SvgTransformMatrix>()

const identMatrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

const svgNS = 'http://www.w3.org/2000/svg'

let workerElement: SVGGElement = null

function prepareWorkerElement() {
  if (workerElement) {
    return workerElement
  }

  const svg = document.createElementNS(svgNS, 'svg')
  workerElement = document.createElementNS(svgNS, 'g')
  svg.appendChild(workerElement)

  return workerElement
}

export default function parseSvgTransform(s: string) {
  if (s == null) {
    return identMatrix
  }
  if (cache.has(s)) {
    return cache.get(s)
  }
  const g = prepareWorkerElement()
  g.setAttribute('transform', s)
  const animVal = g.transform.animVal

  let matrix = identMatrix
  for (let i = 0; i < animVal.numberOfItems; i++) {
    matrix = mul(matrix, animVal.getItem(i).matrix)
  }
  cache.set(s, matrix)
  return matrix
}
