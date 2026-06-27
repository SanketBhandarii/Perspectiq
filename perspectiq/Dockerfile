# Step 1: Use a lightweight Node.js image
FROM node:20-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package files first (to speed up future builds)
COPY package.json package-lock.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of your app's code
COPY . .

# Step 6: Expose the port Vite runs on (configured to 3000 in your vite.config.ts)
EXPOSE 3000

# Step 7: Run the development server
# We use --host 0.0.0.0 so the app is accessible from outside the container
CMD ["npm", "run", "dev"]
