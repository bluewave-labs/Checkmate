# Checkmate Documentation

Welcome to the Checkmate documentation. This directory contains guides and references for various aspects of Checkmate deployment and configuration.

## Available Documentation

### Deployment & Configuration
- **[Custom CA Trust Guide](./custom-ca-trust.md)** - Configure Checkmate to trust custom Certificate Authorities
- **[Custom CA Quick Reference](./custom-ca-quick-reference.md)** - Quick setup guide for custom CA trust

## Docker Configuration

### Custom CA Trust
If you need to monitor internal HTTPS endpoints with certificates from private Certificate Authorities (like Smallstep), see our custom CA trust documentation:

- **Full Guide**: [Custom CA Trust Guide](./custom-ca-trust.md)
- **Quick Reference**: [Custom CA Quick Reference](./custom-ca-quick-reference.md)

### Example Configurations
The `docker/dev/` directory contains example configurations:
- `docker-compose.custom-ca-example.yaml` - Example Docker Compose with custom CA
- `server-custom-ca.Dockerfile` - Example Dockerfile for OS-level CA trust
- `export-smallstep-ca.sh` - Helper script for Smallstep CA export

## Contributing to Documentation

If you find issues or want to improve the documentation:

1. Check existing issues and discussions
2. Submit a pull request with your changes
3. Follow the same markdown formatting style
4. Include practical examples and code snippets

## Getting Help

- [GitHub Discussions](https://github.com/bluewave-labs/checkmate/discussions)
- [Discord Channel](https://discord.gg/NAb6H3UTjK)
- [Documentation Portal](https://docs.checkmate.so/)
