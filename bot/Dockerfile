#from alpine:latest
from node:alpine

#RUN apk add --update nodejs npm
RUN mkdir /data


#RUN apt install sqlite3 -y
RUN apk update \
    && apk upgrade \
    && apk --no-cache add dcron libcap tzdata

RUN cp /usr/share/zoneinfo/Europe/Rome /etc/localtime

COPY oilPriceItaly.js /data/
COPY Prices.js /data/
COPY updateDB/*.js /data/update/
COPY env.js /data/
COPY package.json /data/

WORKDIR /data
RUN npm install --force

RUN node /data/update/updatePrices.js
RUN node /data/update/updateStations.js

RUN /usr/sbin/crond
RUN echo "10 8 * * * node /data/update/updatePrices.js" >> /tmp/cron
RUN echo "10 8 * * * node /data/update/updateStations.js" >> /tmp/cron
RUN crontab /tmp/cron


ENTRYPOINT ["node","/data/oilPriceItaly.js"];
