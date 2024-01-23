const fs = require('fs');
const server = require('http').createServer();

server.on('request', (req, res) => {
  // Solution 1
  //   fs.readFile('test-file.txt', (err, data) => {
  //     if (err) console.log(err);
  //     res.end(data);
  //   });

  // Solution 2: Streams
  //   const readable = fs.createReadStream('test-file.txt');

  //   readable.on('data', (chunk) => {
  //     res.write(chunk); //writeable stream
  //   });

  //   readable.on('end', () => {
  //     res.end(); //indicate end of stream
  //   });

  //   readable.on('error', (err) => {
  //     console.log(err);
  //     res.statusCode = 500;
  //     res.end('File not found');
  //   });

  // Solution 3
  // readatablesteam.pipe(writable)
  // pipe will connext readablestream straight into a writeable stream
  const readable = fs.createReadStream('test-file.txt').pipe(res);
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:8000/');
});
