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

    try {
      const mergedFile = new File(chunks, fileName, { type: fileType })
      const savedPath = path.join(__dirname, randomSeed, fileName)
      await saveFileToPath(mergedFile, savedPath)

      // clean up
      uploadedChunkCountMap.delete(`${randomSeed}_${fileName}`)
      chunkMap.delete(`${randomSeed}_${fileName}`)

      return new Response(JSON.stringify({
        message: 'file upload success',
        isFileSaved: true,
        fileName,
        randomSeed,
        chunkIndex
      }))
    } catch (err) {
      console.error(err)
      return new Response(JSON.stringify({
        message: 'chunk upload failed'
      }), {
        status: 500
      })
    }
  }

  // sleep random time for mocking upload progress
  return await new Promise<Response>((resolve => setTimeout(() => {
    resolve(new Response(JSON.stringify({
      message: 'chunk upload success',
      fileName,
      isFileSaved: false,
      randomSeed,
      chunkIndex
    }), {
      status: 200
    }))
  }, Math.random() * 1000)))
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
