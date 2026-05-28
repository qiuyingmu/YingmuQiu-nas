#!/bin/sh
set -e

# Trap signals to ensure both processes are cleaned up on exit
cleanup() {
    echo "Shutting down..."
    [ -n "$NGINX_PID" ] && kill "$NGINX_PID" 2>/dev/null
    [ -n "$JAVA_PID" ] && kill "$JAVA_PID" 2>/dev/null
    wait
    echo "Shutdown complete."
}
trap cleanup EXIT INT TERM

# Start nginx in background
nginx -g 'daemon off;' &
NGINX_PID=$!

# Start backend in background
java -Dfile.encoding=UTF-8 -jar /app/app.jar --spring.profiles.active=prod &
JAVA_PID=$!

# Wait for either process to exit
wait -n $NGINX_PID $JAVA_PID
EXIT_CODE=$?

# If one process dies, kill the other and exit
cleanup
exit $EXIT_CODE
