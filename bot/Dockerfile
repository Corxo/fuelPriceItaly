from node:alpine

RUN mkdir /data
RUN mkdir /db

RUN apk update \
   && apk upgrade \
   && apk --no-cache add dcron libcap tzdata openrc

RUN cp /usr/share/zoneinfo/Europe/Rome /etc/localtime

#RUN apt update && apt install -y systemd
#RUN timedatectl set-timezone Europe/Rome

COPY oilPriceItaly.js /data/
COPY init.js /data/
COPY Prices.js /data/
COPY updateDB/*.js /data/update/
COPY env.js /data/
COPY package.json /data/

WORKDIR /data
RUN npm install --force

RUN node /data/init.js

RUN node /data/update/updatePrices.js
RUN node /data/update/updateStations.js

#RUN /usr/sbin/crond -f
RUN echo "10 8 * * * node /data/update/updatePrices.js" >> /tmp/cron
RUN echo "10 8 * * * node /data/update/updateStations.js" >> /tmp/cron
RUN crontab /tmp/cron

#ENTRYPOINT ["/usr/sbin/crond", "&&", "node","/data/oilPriceItaly.js"];
CMD /usr/sbin/crond && node /data/oilPriceItaly.js