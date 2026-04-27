FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Expose Railway's dynamic port
EXPOSE 4173

CMD ["npm", "run", "start"]
