export default function splitChunk(file: File, chunkSize = 1024 * 1024) {
  const chunks = []
  for (let i = 0; i < file.size; i += chunkSize) {
    chunks.push(file.slice(i, i + chunkSize))
  }

  return chunks
}
