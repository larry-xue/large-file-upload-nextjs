"use client";
import splitChunk from "@/utils/splitChunk";
import { useRef, useEffect, useState } from "react";

export default function Home() {
  const formElemRef = useRef<HTMLFormElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);

  const uploadFile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const file = formData.get('file') as File;

    if (!file.size) {
      alert('Please select a file');
      return;
    }

    const randomSeed = Math.random().toString(36).slice(2)
    const chunks = splitChunk(file, 1024 * 1024);
    let isFailed = false
    setUploadProgress(0)
    setChunkCount(chunks.length)

    chunks.map((item, index) => {
      fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'I-Chunks-Count': `${chunks.length}`,
          'I-Current-Chunk-Index': `${index}`,
          'I-File-Name': file.name,
          'I-Random-Seed': randomSeed,
          'I-File-Type': file.type
        },
        body: item
      }).then((res) => {
        if (res.ok) {
          console.log(`chunk_${index} uploaded`, uploadProgress);
          setUploadProgress(prev => prev + 1)
          const resJson = res.json();
          resJson.then((json) => {
            if (json.isFileSaved) {
              alert('file upload success');
            }
          })
        } else {
          console.log(`chunk_${index} uploaded failed`);
          isFailed = true
        }
      }).catch((err) => {
        console.warn('err ', err);
        isFailed = true
      });
    });

    if (isFailed) {
      alert('file upload failed');
    }
  }

  useEffect(() => {
    if (!formElemRef.current) return;
    formElemRef.current.onsubmit = uploadFile;
  }, []);

  return (
    <main className="flex min-h-screen flex-col p-24 bg-slate-600">
      <form ref={formElemRef} action="/api/upload" method="post" encType="multipart/form-data" className="flex flex-col gap-4 items-center">
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="file" name="file" />
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-48" type="submit">Upload</button>
      </form>
      {/* show upload progress */}
      <div className="text-white mt-4 text-lg font-bold mb-2 bg-gradient-to-tr from-sky-500 to-green-700 w-fit">upload progress</div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(uploadProgress / chunkCount * 100).toFixed(2)}%` }}></div>
      </div>
    </main>
  );
}
