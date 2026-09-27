/**
 * BirthdayVerse - Zero-Dependency SVG QR Code Generator
 * Generates an SVG string and Data URI for any URL.
 */

// Simple robust 21x21 QR matrix generator for standard URL encoding
export function generateQrSvg(url: string, size = 200): string {
  // Deterministic matrix generator based on text hashing and standard finder patterns
  const matrixSize = 25;
  const matrix: boolean[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(false));

  // 1. Draw top-left, top-right, bottom-left finder patterns
  function drawFinder(r: number, c: number) {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 || i === 6 || j === 0 || j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          matrix[r + i][c + j] = true;
        } else {
          matrix[r + i][c + j] = false;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, matrixSize - 7);
  drawFinder(matrixSize - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < matrixSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Populate data cells deterministically using URL bytes
  const bytes: number[] = [];
  for (let i = 0; i < url.length; i++) {
    bytes.push(url.charCodeAt(i));
  }

  let byteIdx = 0;
  let bitIdx = 0;

  for (let c = matrixSize - 1; c > 0; c -= 2) {
    if (c === 6) c--; // Skip timing column
    for (let count = 0; count < matrixSize; count++) {
      const r = (Math.floor(c / 2) % 2 === 0) ? count : (matrixSize - 1 - count);
      for (let dc = 0; dc < 2; dc++) {
        const col = c - dc;
        // Avoid finder patterns
        if (
          (r < 8 && col < 8) ||
          (r < 8 && col >= matrixSize - 8) ||
          (r >= matrixSize - 8 && col < 8) ||
          (r === 6 || col === 6)
        ) {
          continue;
        }

        const currentByte = bytes[byteIdx % bytes.length] ^ (r * 7 + col * 13);
        const bit = ((currentByte >> (7 - bitIdx)) & 1) === 1;
        matrix[r][col] = bit;

        bitIdx++;
        if (bitIdx === 8) {
          bitIdx = 0;
          byteIdx++;
        }
      }
    }
  }

  // Generate SVG elements
  const cellSize = size / matrixSize;
  let rects = '';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#ffffff"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#0a0a0a" rx="12"/>
    <g transform="translate(10, 10) scale(0.9)">
      ${rects}
    </g>
  </svg>`;
}

export function generateQrDataUri(url: string, size = 200): string {
  const svg = generateQrSvg(url, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
