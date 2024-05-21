require('dotenv').config();
const Docker = require('dockerode');
const docker = new Docker({host: process.env.VM_IP, port: process.env.VM_PORT});

const execute_python = async (code, input) => {
    const escapedCode = code.replace(/"/g, '\\"');
  
    try {
      const container = await docker.createContainer({
        Image: 'python',
        Cmd: ['/bin/bash', '-c', `echo "${escapedCode}" > temp.py && python temp.py <<< "${input}"`],
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
              await container.wait();
              const stripAnsi = (await import('strip-ansi')).default;
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
    } catch (error) {
      console.log(error);
      throw new Error('Internal server error');
    }
  };

  module.exports = execute_python;