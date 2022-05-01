#from alpine:latest
from node:latest

#RUN apk add --update nodejs npm
RUN mkdir /data

COPY oilPriceItaly.js /data/
COPY env.js /data/
COPY package.json /data/

WORKDIR /data
RUN npm install --force

ENTRYPOINT ["node","/data/oilPriceItaly.js"];
