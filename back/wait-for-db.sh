#!/bin/sh
# Simple wait-for-db script using nc (busybox) / bash sleep loop
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

if [ -z "$host" ] || [ -z "$port" ]; then
  echo "Usage: $0 host port -- command"
  exit 1
fi

echo "Waiting for database $host:$port..."
until nc -z "$host" "$port"; do
  >&2 echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Database is up - executing command"
exec $cmd
