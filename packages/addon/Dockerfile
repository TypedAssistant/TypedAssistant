ARG BUILD_FROM
FROM $BUILD_FROM

# Set timezone
RUN cp /usr/share/zoneinfo/Europe/London /etc/localtime \
    && echo "Europe/London" > /etc/timezone
ENV TZ=Europe/London

COPY retry.sh /usr/local/bin/retry.sh
RUN chmod +x /usr/local/bin/retry.sh
COPY run.sh /

RUN echo "${ALPINE_MIRROR}/v3.18/main/" >> /etc/apk/repositories
RUN . /usr/local/bin/retry.sh && retry apk add build-base git jq krb5-dev libgcc libsecret-dev make npm nodejs --repository="http://dl-cdn.alpinelinux.org/alpine/v3.18/main/"

RUN apk --no-cache add ca-certificates wget
RUN . /usr/local/bin/retry.sh && retry wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN . /usr/local/bin/retry.sh && retry wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk update
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk 
RUN apk add --no-cache --force-overwrite libstdc++-dev
RUN find / -name 'libstdc++.so.6'

EXPOSE 8080

COPY . /TypedAssistant/
WORKDIR /TypedAssistant

RUN . /usr/local/bin/retry.sh && retry npm install -g bun

# Make sure run.sh is executable
RUN chmod a+x /run.sh
ENV SUPERVISOR_TOKEN=$SUPERVISOR_TOKEN

CMD [ "/run.sh" ]
