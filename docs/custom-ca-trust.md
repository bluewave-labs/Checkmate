# Custom Certificate Authority Trust

This guide explains how to configure Checkmate to trust custom Certificate Authorities (CAs) when running in Docker, particularly useful for internal/private CAs like Smallstep.

## Understanding Certificate Authorities

Certificate Authorities (CAs) are entities that issue and manage digital certificates. While public CAs (like Let's Encrypt, DigiCert) are trusted by default in most systems, private or internal CAs (like those issued by Smallstep, internal PKI systems) require explicit trust configuration.

When Checkmate monitors HTTPS endpoints with certificates from private CAs, it may show them as "DOWN" due to certificate validation failures, even if the service is actually accessible.

## Node-level Trust Approach

The simplest approach is to mount your custom CA certificate and configure Node.js to trust it using the `NODE_EXTRA_CA_CERTS` environment variable.

### Docker Compose Configuration

Add a volume mount for your CA certificate and set the environment variable:

```yaml
services:
  server:
    image: uptime_server:latest
    restart: always
    ports:
      - "52345:52345"
    env_file:
      - server.env
    environment:
      NODE_EXTRA_CA_CERTS: /certs/custom-ca.pem
    volumes:
      - ./certs:/certs:ro
    depends_on:
      - redis
      - mongodb
```

### Directory Structure

Create a `certs` directory in your Docker Compose project root:

```
docker/dev/
├── docker-compose.yaml
├── certs/
│   └── custom-ca.pem
└── ...
```

## OS-level Trust Approach (Debian-based)

For more comprehensive trust configuration, you can create a derived Dockerfile that installs your CA at the OS level.

### Custom Dockerfile

Create `docker/dev/server-custom-ca.Dockerfile`:

```dockerfile
FROM node:20-alpine

# Install ca-certificates for Alpine
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server/ ./

# Copy your custom CA certificate
COPY ./certs/custom-ca.crt /usr/local/share/ca-certificates/

# Update CA certificates
RUN update-ca-certificates

EXPOSE 52345

CMD ["node", "src/index.js"]
```

### Docker Compose Override

Create `docker/dev/docker-compose.custom-ca.yaml`:

```yaml
services:
  server:
    build:
      context: .
      dockerfile: server-custom-ca.Dockerfile
    restart: always
    ports:
      - "52345:52345"
    env_file:
      - server.env
    depends_on:
      - redis
      - mongodb
```

Run with: `docker-compose -f docker-compose.yaml -f docker-compose.custom-ca.yaml up`

## Alpine Linux Considerations

Since Checkmate uses Alpine Linux as the base image, you need to install the `ca-certificates` package:

```dockerfile
# Install ca-certificates for Alpine
RUN apk add --no-cache ca-certificates

# Copy and update CA certificates
COPY ./certs/custom-ca.crt /usr/local/share/ca-certificates/
RUN update-ca-certificates
```

## Smallstep CA Configuration

If you're using Smallstep as your internal CA, you can export the root CA certificate:

### Export Smallstep Root CA

```bash
# Export the root CA certificate
step certificate inspect --format pem step-ca/root_ca.crt > custom-ca.pem

# Or if you have the CA URL configured
step certificate inspect --format pem $(step path)/certs/root_ca.crt > custom-ca.pem
```

### Using the Exported Certificate

1. Copy the exported `custom-ca.pem` to your `docker/dev/certs/` directory
2. Use either the Node-level or OS-level approach above
3. Restart your Checkmate server container

## Security Considerations

⚠️ **Important Security Warning**: Only trust CAs that you control or explicitly trust. Adding untrusted CAs can compromise the security of your monitoring system.

- **Private CAs**: Only trust CAs from your organization's PKI infrastructure
- **Self-signed certificates**: Consider using proper CA infrastructure instead
- **Certificate validation**: Ensure your CA certificates are valid and not expired
- **Access control**: Limit access to the CA certificate files in production

## Troubleshooting

### Verify CA Trust

Test if your CA is trusted by the container:

```bash
# Enter the running container
docker exec -it <container_name> sh

# Check if the CA is in the trust store
ls -la /usr/local/share/ca-certificates/
cat /etc/ssl/certs/ca-certificates.crt | grep -A 5 -B 5 "YOUR_CA_NAME"
```

### Common Issues

1. **Permission denied**: Ensure the CA certificate file has proper read permissions
2. **Certificate format**: Use PEM format (.pem, .crt) for best compatibility
3. **Container restart**: Always restart the container after adding new CA certificates
4. **Path issues**: Verify the certificate path in your volume mounts

## Example: Complete Working Setup

Here's a complete example for a Smallstep CA setup. This demonstrates both the baseline failure (expected) and the custom CA success:

### Baseline Test (Should Fail)
1. **Start Checkmate without custom CA trust:**
   ```bash
   cd docker/dev
   docker-compose up -d
   ```

2. **Test connection to internal HTTPS endpoint:**
   ```bash
   # This should fail with TLS error (unknown CA)
   docker-compose exec server node -e "
     const https = require('https');
     https.get('https://your-internal-site.com', res => {
       console.log('STATUS:', res.statusCode);
     }).on('error', e => {
       console.error('ERR:', e.message);
     });
   "
   ```
   **Expected result**: TLS error due to unknown CA

### Custom CA Test (Should Succeed)
1. **Export Smallstep Root CA:**
   ```bash
   step certificate inspect --format pem step-ca/root_ca.crt > docker/dev/certs/smallstep-root-ca.pem
   ```

2. **Update docker-compose.yaml with custom CA trust:**
   ```yaml
   services:
     server:
       environment:
         NODE_EXTRA_CA_CERTS: /certs/smallstep-root-ca.pem
       volumes:
         - ./certs:/certs:ro
   ```

3. **Restart with custom CA:**
   ```bash
   docker-compose down
   docker-compose -f docker-compose.yaml -f docker-compose.custom-ca-example.yaml up -d
   ```

4. **Test the same connection:**
   ```bash
   # This should now succeed
   docker-compose exec server node -e "
     const https = require('https');
     https.get('https://your-internal-site.com', res => {
       console.log('STATUS:', res.statusCode);
     }).on('error', e => {
       console.error('ERR:', e.message);
     });
   "
   ```
   **Expected result**: HTTP 200 OK

### Verification
- **Baseline**: TLS failure proves default behavior (unknown CA)
- **Custom CA**: TLS success proves custom CA trust is working
- **Both tests must pass** to confirm the feature works correctly

Your Checkmate server should now trust certificates issued by your Smallstep CA, allowing you to monitor internal HTTPS endpoints without disabling SSL validation.
