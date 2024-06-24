require('dotenv').config();
const Docker = require('dockerode');
const docker = new Docker();

const execute_js = async (code, input) => {
    const escapedCode = code.replace(/"/g, '\\"');
  
    try {
        const container = await docker.createContainer({
          Image: 'node:latest',
          Cmd: ['/bin/bash', '-c', `echo "let input = process.argv[2]; ${escapedCode}" > temp.js && timeout 5 node temp.js "${input}"`],
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
                const containerInfo = await container.inspect();
                const exitCode = containerInfo.State.ExitCode;
                const stripAnsi = (await import('strip-ansi')).default;

                if (exitCode === 124) {
                  resolve({ ans: `EXECUTION TIMED OUT\nOUTPUT CAPTURED TILL TIMEOUT\n${stripAnsi(output)}`});
                } else if (exitCode !== 0) {
                  reject(new Error(`Program exited with status ${exitCode}`));
                } else {
                    await container.wait();
                  resolve({ ans: stripAnsi(output) });
                }
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
      } catch (error) {
        console.log(error);
        throw new Error('Internal server error');
    }
  };

  module.exports = execute_js;