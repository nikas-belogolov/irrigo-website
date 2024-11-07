import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { Server } from "socket.io";
import { createServer } from 'node:http';

import { createObjectCsvWriter } from "csv-writer";

const csvWriter = createObjectCsvWriter({
    path: './graph_data.csv',
    header: [
      {id: 'pressure', title: 'pressure'},
      {id: 'flow', title: 'flow'},
      {id: 'timestamp', title: 'timestamp'}
    ]
});

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/graph", async (req, res) => {
  const [p, f, t] = [req.body.p, req.body.f, new Date(Date.now())];

  io.emit("data", {
    y: { p, f },
    x: t
  });

  // Save data to csv
  await csvWriter.writeRecords([{
    pressure: p, flow: f, timestamp: t
  }])

  res.status(200).json({
    message: "Successfully received data."
  });

  
})

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny"));

// handle SSR requests
app.all("*", remixHandler);



const port = process.env.PORT || 3000;
server.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
