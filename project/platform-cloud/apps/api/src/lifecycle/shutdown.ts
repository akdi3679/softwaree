let shuttingDown = false;

export function setupShutdown(server: { close: (cb: () => void) => void }) {
  const handler = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down...`);

    server.close(() => console.log('HTTP server closed'));

    // Wait up to 10s for in-flight requests
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    console.log('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGINT', () => handler('SIGINT'));
}
