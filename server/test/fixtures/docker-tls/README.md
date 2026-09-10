Test fixtures for Docker TLS validation. Self-signed, 100-year, not trusted anywhere.

Regenerate with:

    openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 36500 -subj "/CN=Checkmate Test CA" -keyout ca-key.pem -out ca.pem
    openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -subj "/CN=checkmate-test-client" -keyout client-key.pem -out client.csr
    openssl x509 -req -in client.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -days 36500 -out client-cert.pem
    openssl ecparam -name prime256v1 -genkey -noout -out other-key.pem
    openssl pkcs8 -topk8 -in client-key.pem -out encrypted-key.pem -passout pass:fixture
    rm client.csr ca.srl ca-key.pem
