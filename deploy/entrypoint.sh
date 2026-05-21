#!/bin/sh
# Start nginx
nginx -g 'daemon off;' &
# Start backend
java -jar /app/app.jar --spring.profiles.active=prod
