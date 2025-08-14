# Custom CA Trust - Quick Reference

## Fast Setup (Node-level)

1. **Export your CA certificate:**
   ```bash
   # For Smallstep
   step certificate inspect --format pem step-ca/root_ca.crt > docker/dev/certs/custom-ca.pem
   ```

2. **Use the provided example override:**
   ```bash
   docker-compose -f docker-compose.yaml -f docker-compose.custom-ca-example.yaml up -d
   ```

3. **Or manually update docker-compose.yaml:**
   ```yaml
   services:
     server:
       environment:
         NODE_EXTRA_CA_CERTS: /certs/custom-ca.pem
       volumes:
         - ./certs:/certs:ro
   ```

## Alternative Setup (OS-level)

1. **Use custom Dockerfile:**
   ```bash
   docker-compose -f docker-compose.yaml -f docker-compose.custom-ca.yaml up
   ```

## File Structure
```
docker/dev/
├── docker-compose.yaml
├── docker-compose.custom-ca-example.yaml  # Example config
├── certs/
│   ├── README.md
│   └── custom-ca.pem                     # Your CA certificate
└── export-smallstep-ca.sh                # Helper script
```

## Environment Variables
- `NODE_EXTRA_CA_CERTS=/certs/custom-ca.pem` - Node.js trust
- Mount `./certs:/certs:ro` - Volume mount

## Security
- ✅ Only trust CAs you control
- ✅ Use read-only volume mounts
- ✅ Keep certificates out of version control
- ❌ Never trust untrusted CAs

## Troubleshooting
- Check container logs: `docker-compose logs server`
- Verify certificate: `docker exec -it <container> ls -la /certs/`
- Test connection: `docker exec -it <container> wget --ca-certificate=/certs/custom-ca.pem https://your-internal-site.com`

## Full Documentation
See [Custom CA Trust Guide](./custom-ca-trust.md) for detailed instructions.
