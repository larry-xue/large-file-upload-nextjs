import path from 'path'
import fs from 'fs'

// storage mock
const chunkMap = new Map()
const uploadedChunkCountMap = new Map()

// api/upload
export async function POST(request: Request) {
  const chunkData = await request.blob();
  // read request headers
  const headers = request.headers
  const chunkIndex = headers.get('I-Current-Chunk-Index')
  const chunksCount = +(headers.get('I-Chunks-Count') || 0)
  const randomSeed = headers.get('I-Random-Seed') || ''
  const fileName = headers.get('I-File-Name') || ''
  const fileType = headers.get('I-File-Type') || ''

  chunkMap.set(`${randomSeed}_${fileName}_${chunkIndex}`, chunkData)
  const uploadedChunkCount = uploadedChunkCountMap.get(`${randomSeed}_${fileName}`) || 0;
  uploadedChunkCountMap.set(`${randomSeed}_${fileName}`, uploadedChunkCount + 1)

  if (uploadedChunkCountMap.get(`${randomSeed}_${fileName}`) === chunksCount) {
    const chunks = []
    for (let i = 0; i < chunksCount; i++) {
      chunks.push(chunkMap.get(`${randomSeed}_${fileName}_${i}`))
    }
    const mergedFile = new File(chunks, fileName, { type: fileType })
    const savedPath = path.join(__dirname, randomSeed, fileName)
    await saveFileToPath(mergedFile, savedPath)
  }

  return new Response('File uploaded successfully', {
    status: 200
  });
}

function saveFileToPath(file: File, filePath: string) {
  return new Promise(async (resolve, reject) => {
    const fileBuffer = await file.arrayBuffer();
    // Create the directory if it does not exist
    const directory = path.dirname(filePath);
    fs.mkdirSync(directory, { recursive: true });

    fs.writeFile(filePath, new Uint8Array(fileBuffer), (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    })
  });
}
