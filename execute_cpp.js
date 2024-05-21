const Docker = require('dockerode');
const docker = new Docker({host: process.env.VM_IP, port: process.env.VM_PORT});

const execute_cpp = async (code, input) => {
    const escapedCode = code.replace(/"/g, '\\"');
    console.log(escapedCode);
    console.log(input);
  
    const container = await docker.createContainer({
      Image: 'gcc',
      Cmd: ['/bin/bash', '-c', `echo "${escapedCode}" > temp.cpp && g++ -o temp temp.cpp && ./temp <<< "${input}"`],
      AttachStdout: true,
      AttachStderr: true,
      Tty: true
    });
  
    container.start().catch(err => reject(err));
    
    return new Promise((resolve, reject) => {
      container.attach({ stream: true, stdout: true, stderr: true }, async (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
  
        let output = '';
        stream.on('data', chunk => output += chunk.toString());
  
        stream.on('end', async () => {
          try {
            await container.wait(); // Ensure container execution is complete
            const stripAnsi = (await import('strip-ansi')).default;
            console.log(output);
            resolve({ ans: stripAnsi(output) });
          } catch (error) {
            reject(error);
          } finally {
            try {
              await container.remove();
            } catch (removeError) {
              console.error('Error removing container:', removeError);
            }
          }
        });
      });
    });
  };

  module.exports = execute_cpp;