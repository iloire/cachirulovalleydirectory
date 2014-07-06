#!/bin/bash
type redis-server >/dev/null 2>&1 || { echo >&2 "I require redis-server but it's not installed.  Please install redis server."; exit 1; }
redis-server redis.conf
node server.js
redis-cli -h 127.0.0.1 -p 1212 shutdown