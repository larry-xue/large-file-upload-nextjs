"use client";
import splitChunk from "@/utils/splitChunk";
import { useRef, useEffect } from "react";

export default function Home() {
  const formElemRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formElemRef.current) return;
    formElemRef.current.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const file = formData.get('file') as File;

      if (!file.size) {
        alert('Please select a file');
        return;
      }

      let success = 0
      const randomSeed = Math.random().toString(36).slice(2)
      const chunks = splitChunk(file, 1024 * 1024);
      chunks.map((item, index) => {

        fetch('/api/upload', {
          method: 'POST',
          headers: {
            'I-Chunks-Count': `${chunks.length}`,
            'I-Current-Chunk-Index': `${index}`,
            'I-File-Name': file.name,
            'I-Random-Seed': randomSeed,
            'I-File-Type': file.type
          },
          body: item
        }).then((res) => {
          if (res.ok) {
            console.log(`chunk_${index} uploaded, current progress: ${++success}/${chunks.length}`);
          } else {
            console.log(`chunk_${index} uploaded failed`);
          }
        }).catch((err) => {
          console.warn('err ', err);
        });
      });
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-slate-600">
      <form ref={formElemRef} action="/api/upload" method="post" encType="multipart/form-data" className="flex flex-col gap-4 items-center">
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline" type="file" name="file" />
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-48" type="submit">Upload</button>
      </form>
    </main>
  );
}
