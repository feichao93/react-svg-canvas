const svgTransformParser: SvgTransformParser = require('svg-transform-parser')

interface SvgTransformParser {
  parse(svgTransformString: string): SvgTransformParseResult
}

interface SvgTransformParseResult {
  translate?: { tx?: number, ty?: number }
  rotate?: { angle?: number, cx?: number, cy?: number }
  skewX: { angle?: number }
  skewY: { angle?: number }
  matrix?: SvgTransformMatrix
  throw?: true
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

function applyRotate(m: SvgTransformMatrix, { angle = 0, cx = 0, cy = 0 }: SvgTransformParseResult['rotate']) {
  /* TODO */
  return m
}

function applyTranslate(m: SvgTransformMatrix, { tx = 0, ty = 0 }: SvgTransformParseResult['translate']) {
  /* TODO */
  return m
}

function applyMatrix(m: SvgTransformMatrix, matrix: SvgTransformMatrix) {
  return mul(m, matrix)
}

function applySkewX(m: SvgTransformMatrix, { angle = 0 }: SvgTransformParseResult['skewX']) {
  /* TODO */
  return m
}

function applySkewY(m: SvgTransformMatrix, { angle = 0 }: SvgTransformParseResult['skewY']) {
  /* TODO */
  return m
}

export function parseSvgTransform2(s: string) {
  const r = svgTransformParser.parse(s)
  if (r.throw) {
    throw new Error('Invalid svg transform ' + s)
  }

  let matrix = identMatrix
  // TODO 应用这些变换的顺序是否正确?
  if (r.skewX) {
    matrix = applySkewX(matrix, r.skewX)
  }
  if (r.skewY) {
    matrix = applySkewY(matrix, r.skewY)
  }
  if (r.rotate) {
    matrix = applyRotate(matrix, r.rotate)
  }
  if (r.matrix) {
    matrix = applyMatrix(matrix, r.matrix)
  }
  if (r.translate) {
    matrix = applyTranslate(matrix, r.translate)
  }
  return matrix
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

export function parseSvgTransform(s: string) {
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

export function range(end: number) {
  const result: number[] = []
  for (let i = 0; i < end; i++) {
    result.push(i)
  }
  return result
}
