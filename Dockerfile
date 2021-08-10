FROM node:16-alpine

WORKDIR /app

COPY package*.json /app/

RUN npm install && npm install -g sequelize-cli
RUN npm install --save sequelize

COPY . .

EXPOSE 5000

CMD ["npm", "start"]