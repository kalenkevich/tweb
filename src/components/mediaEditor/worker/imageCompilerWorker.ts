export interface CompileImageWorkerEvent {
  data: CompileImageData;
}

export interface CompileImageData {}

function handleMessage(event: CompileImageWorkerEvent) {
  const data = event.data;
}

addEventListener('message', handleMessage);
