FROM node:22-alpine

RUN mkdir /data
RUN mkdir /db

RUN apk update \
   && apk upgrade \
   && apk --no-cache add dcron libcap tzdata openrc

RUN cp /usr/share/zoneinfo/Europe/Rome /etc/localtime

#RUN apt update && apt install -y systemd
#RUN timedatectl set-timezone Europe/Rome

# --- bot ---
COPY bot/src /data/src
COPY bot/tsconfig.json bot/package.json /data/
COPY bot/.env /data/

WORKDIR /data
RUN npm install --force
RUN npm run build

# --- serverless ---
COPY serverless/src /data/update/src
COPY serverless/tsconfig.json serverless/package.json /data/update/
COPY serverless/.env /data/update/.env

WORKDIR /data/update
RUN npm install --force
RUN npm run build

WORKDIR /data

RUN node /data/update/dist/updatePrices.js
RUN node /data/update/dist/updateStations.js

#RUN /usr/sbin/crond -f
RUN echo "10 8 * * * node /data/update/dist/updatePrices.js" >> /tmp/cron
RUN echo "10 8 * * * node /data/update/dist/updateStations.js" >> /tmp/cron
RUN crontab /tmp/cron

#ENTRYPOINT ["/usr/sbin/crond", "&&", "node","/data/oilPriceItaly.js"];
CMD /usr/sbin/crond && node /data/dist/oilPriceItaly.js
