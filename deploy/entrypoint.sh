#!/bin/sh
# Start nginx
nginx -g 'daemon off;' &
# Start backend
java -Dfile.encoding=UTF-8 -jar /app/app.jar --spring.profiles.active=prod
