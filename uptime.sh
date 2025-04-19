default_server_base_url="http://localhost:5000/api/v1" 
default_client_host="http://localhost:5173"
default_jwt_secret="my_secret"
default_db_type="MongoDB"
default_db_connection_string="mongodb://mongodb:27017/uptime_db"
default_redis_host="redis"
default_redis_port=6379
default_token_ttl="99d"

default_system_email_host="smtp.gmail.com"
default_system_email_port=465

echo "Welcome to the Uptime Monitor Setup Script! \n"
echo

echo "Configuring client"
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' '*'
echo

read -p "Enter the API Base URL (press enter for default) [$default_server_base_url]: " input_url
input_url="${input_url:-$default_server_base_url}"


echo "API base url: $input_url"
echo

echo "Writing to ./Docker/client.env"
echo

echo "VITE_APP_API_BASE_URL=\"$input_url\"" > ./Client/.env

echo "Configuring server"
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' '*'
echo

read -p "Enter the Client Host [$default_client_host]: " client_host
client_host="${client_host:-$default_client_host}"
echo "Client Host: $client_host"
echo

read -p "Enter your JWT secret [$default_jwt_secret]: " jwt_secret
jwt_secret="${jwt_secret:-$default_jwt_secret}"
echo "JWT Secret: $jwt_secret"
echo

read -p "Enter your DB type [$default_db_type]: " db_type
db_type="${db_type:-$default_db_type}"
echo "DB Type: $db_type"
echo

read -p "Enter your DB connection string [$default_db_connection_string]: " db_connection_string
db_connection_string="${db_connection_string:-$default_db_connection_string}"
echo "DB connection string: $db_connection_string"
echo

read -p "Enter your Redis Host [$default_redis_host]: " redis_host
redis_host="${redis_host:-$default_redis_host}"
echo "Redis Host: $redis_host"
echo

read -p "Enter your Redis Port [$default_redis_port]: " redis_port
redis_port="${redis_port:-$default_redis_port}"
echo "Redis Port: $redis_port"
echo

read -p "Enter your system email host [$default_system_email_host]: " system_email_host
system_email_host="${system_email_host:-$default_system_email_host}"
echo "System email host: $system_email_host"
echo

read -p "Enter your system email port [$default_system_email_port]: " system_email_port
system_email_port="${system_email_port:-$default_system_email_port}"
echo "System email port: $system_email_port"
echo

read -p "Enter your system email address: " system_email_address
echo "System email address: $system_email_address"
echo

read -p "Enter your system email password: " system_email_password
echo "System email password: $system_email_password"
echo



read -p "Enter your Token TTL [$default_token_ttl]: " token_ttl
token_ttl="${token_ttl:-$default_token_ttl}"
echo "Token TTL: $token_ttl"
echo

read -p "Enter your Pagespeed API key: " pagespeed_api_key
echo "Pagespeed API key: $pagespeed_api_key"
echo

echo "Writing to ./Docker/server.env"
echo

{
    echo "CLIENT_HOST=\"$client_host\""
    echo "JWT_SECRET=\"$jwt_secret\""
    echo "DB_TYPE=\"$db_type\""
    echo "DB_CONNECTION_STRING=\"$db_connection_string\""
    echo "REDIS_HOST=\"$redis_host\""
    echo "REDIS_PORT=$redis_port"
    echo "SYSTEM_EMAIL_HOST=\"$system_email_host\""
    echo "SYSTEM_EMAIL_PORT=$system_email_port"
    echo "SYSTEM_EMAIL_ADDRESS=\"$system_email_address\""
    echo "SYSTEM_EMAIL_PASSWORD=\"$system_email_password\""
    echo "TOKEN_TTL=\"$token_ttl\""
    echo "PAGESPEED_API_KEY=\"$pagespeed_api_key\""
} > ./Docker/server.env

cd ./Docker
source ./build_images.sh

cd ./Docker
docker-compose up