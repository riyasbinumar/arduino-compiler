FROM node:20-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    python3 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
ENV PATH="/root/bin:$PATH"

RUN arduino-cli core update-index
RUN arduino-cli core install arduino:avr

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
