#!/bin/bash
# used in package.json scripts

type redis-server >/dev/null 2>&1 || { echo >&2 "I require redis-server but it's not installed.  Please install redis server." exit 1; } 
echo '\nlaunching redis-server in background with testing config...\n'; 
redis-server test/redis.conf
node test/runall.js
redis-cli -h 127.0.0.1 -p 1212 shutdown