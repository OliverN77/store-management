FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first (copy package files)
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --production

# Install netcat for wait script
RUN apk add --no-cache netcat-openbsd curl

# Copy source
COPY . .

# Ensure wait script is executable
RUN chmod +x ./wait-for-db.sh

ENV NODE_ENV=production

EXPOSE 3001

# Wait for DB (DB_SERVER and DB_PORT supplied via env) then start app
CMD ["sh", "-c", "./wait-for-db.sh \"$DB_SERVER\" \"$DB_PORT\" node app.js"]
